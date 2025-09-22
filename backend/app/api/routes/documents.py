import asyncio
import os
import shutil
import tempfile
import uuid
from asyncio.log import logger
from datetime import datetime, timezone
from typing import Any

import aiofiles
import openai
from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from langchain.text_splitter import RecursiveCharacterTextSplitter
from pinecone import Pinecone, ServerlessSpec
from pypdf import PdfReader
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.models.common import Message
from app.models.course import Course
from app.models.document import Document, DocumentStatus

router = APIRouter(prefix="/documents", tags=["documents"])
index_name = "developer-quickstart-py"

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV_NAME = os.getenv("PINECONE_ENV_NAME")
EMBEDDING_MODEL = "text-embedding-3-small"

EXPECTED_DIMENSION = 1536
MAX_FILES = 10
MAX_FILE_SIZE_MB = 25
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

pc = Pinecone(api_key=PINECONE_API_KEY, environment=PINECONE_ENV_NAME)

task_status: dict[str, str] = {}

async_openai_client = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def ensure_index_exists():
    """Ensure Pinecone index exists with the correct dimension, recreate if wrong."""
    if pc.has_index(index_name):
        existing = pc.describe_index(index_name)
        if existing.dimension != EXPECTED_DIMENSION:
            pc.delete_index(index_name)
            pc.create_index(
                name=index_name,
                dimension=EXPECTED_DIMENSION,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )
    else:
        pc.create_index(
            name=index_name,
            dimension=EXPECTED_DIMENSION,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )


def chunk_text(text: str):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", ".", "!", "?", " ", ""],
    )
    return splitter.split_text(text)


async def embed_chunks(chunks: list[str]) -> list[list[float]]:
    try:
        # Use the asynchronous client
        response = await async_openai_client.embeddings.create(
            input=chunks,
            model=EMBEDDING_MODEL,
        )
        return [item.embedding for item in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {e}")


def store_embeddings(
    chunks: list[str],
    embeddings: list[list[float]],
    course_id: str,
    document_id: str,
    index,
):
    vectors = [
        {
            "id": str(uuid.uuid4()),
            "values": embedding,
            "metadata": {
                "course_id": course_id,
                "document_id": document_id,
                "text": chunk,
                "chunk_index": i,
            },
        }
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings, strict=False))
    ]
    index.upsert(vectors)


async def process_pdf_task(file_path: str, document_id: uuid.UUID, session: SessionDep):
    """Background task to parse, chunk, embed, and store PDF."""
    document = session.get(Document, document_id)
    if not document:
        return  # Document record not found, nothing to do

    try:
        ensure_index_exists()
        index = pc.Index(index_name)

        document.status = DocumentStatus.PROCESSING
        session.add(document)
        session.commit()

        with open(file_path, "rb") as f:
            reader = PdfReader(f)
            full_text = "\n".join(
                [page.extract_text() for page in reader.pages if page.extract_text()]
            )

        if not full_text.strip():
            document.status = DocumentStatus.FAILED
            session.add(document)
            session.commit()
            return

        chunks = chunk_text(full_text)
        embeddings = []
        BATCH_SIZE = 50
        for i in range(0, len(chunks), BATCH_SIZE):
            batch = chunks[i : i + BATCH_SIZE]
            embeddings.extend(await embed_chunks(batch))
            await asyncio.sleep(0)

        store_embeddings(
            chunks, embeddings, str(document.course_id), str(document.id), index
        )
        document.updated_at = datetime.now(timezone.utc)
        document.status = DocumentStatus.COMPLETED
        document.chunk_count = len(chunks)
        session.add(document)
        session.commit()

    except Exception as e:
        logger.error(f"[process_pdf_task] Error processing document: {e}")
        document.status = DocumentStatus.FAILED
        session.add(document)
        session.commit()
    finally:
        os.remove(file_path)


async def handle_document_processing(
    file: UploadFile, document_id: uuid.UUID, session: SessionDep
):
    """
    Background task to handle all blocking I/O:
    saving the file and then calling the main processing task.
    """
    tmp_dir = tempfile.mkdtemp()
    tmp_path = os.path.join(tmp_dir, f"{document_id}_{file.filename}")

    try:
        # Asynchronously read chunks from the UploadFile stream
        with open(tmp_path, "wb") as buffer:
            while True:
                chunk = await file.read(1024)  # Read in 1KB chunks
                if not chunk:
                    break
                buffer.write(chunk)

        # Pass the path of the saved file to the next background task
        await process_pdf_task(tmp_path, document_id, session)

    except Exception as e:
        logger.error(f"[handle_document_processing] Error processing document: {e}")
        # Handle errors and update the document status
        document = session.get(Document, document_id)
        if document:
            document.status = DocumentStatus.FAILED
            session.add(document)
            session.commit()

    finally:
        # Clean up the temporary file and directory
        shutil.rmtree(tmp_dir)


@router.post("/process")
async def process_multiple_documents(
    session: SessionDep,
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    course_id: uuid.UUID = Form(...),
):
    """
    Accept multiple PDF uploads, save to temp files, and queue a background task for each.
    """
    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=400,
            detail=f"You can only upload a maximum of {MAX_FILES} files at a time.",
        )

    results = []

    for file in files:
        if file.content_type != "application/pdf":
            raise HTTPException(
                status_code=400,
                detail=f"File '{file.filename}' is not a PDF. Only PDF files are supported.",
            )

        if file.size and file.size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"File '{file.filename}' exceeds the {MAX_FILE_SIZE_MB}MB size limit.",
            )

        title_without_extension = os.path.splitext(file.filename)[0]

        # 1. Create a Document record in the database
        db_document = Document(
            title=title_without_extension,
            filename=file.filename,
            course_id=course_id,
        )
        session.add(db_document)
        session.commit()
        session.refresh(db_document)

        # 2. Save the file to a temporary location within the request
        tmp_dir = tempfile.mkdtemp()
        tmp_path = os.path.join(tmp_dir, f"{db_document.id}_{file.filename}")

        # The key change: Asynchronously read and write the file in the endpoint.
        # This ensures the stream is consumed before the endpoint returns.
        async with aiofiles.open(tmp_path, "wb") as buffer:
            while chunk := await file.read(1024):
                await buffer.write(chunk)

        # 3. Add the background task, passing the path to the saved file.
        background_tasks.add_task(process_pdf_task, tmp_path, db_document.id, session)

        results.append(
            {
                "document_id": db_document.id,
                "filename": file.filename,
                "status": db_document.status,
            }
        )

    return {"message": "Processing started for multiple files", "documents": results}


@router.get("/{id}", response_model=Document)
def read_document(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """Get a document by its ID, ensuring the user has permissions."""
    statement = (
        select(Document)
        .join(Course)
        .where(Document.id == id)
        .where(Course.owner_id == current_user.id)
    )

    document = session.exec(statement).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found or you do not have permission to access it.",
        )

    return document


# Background task for deleting embeddings
def delete_embeddings_task(document_id: uuid.UUID):
    """Background task to delete embeddings from Pinecone."""
    try:
        if pc.has_index(index_name):
            index = pc.Index(index_name)
            index.delete(filter={"document_id": str(document_id)})
            logger.info(f"Successfully deleted embeddings for document {document_id}")
    except Exception as e:
        logger.error(f"Failed to delete embeddings for document {document_id}: {e}")


@router.delete("/{id}")
def delete_document(
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    background_tasks: BackgroundTasks,  # Inject BackgroundTasks
) -> Any:
    """Delete a document by its ID, ensuring the user has permissions."""

    document = session.exec(
        select(Document).where(Document.id == id).options(selectinload(Document.course)) # type: ignore
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found or you do not have permission to delete it.",
        )

    if not current_user.is_superuser and (document.course.owner_id != current_user.id):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to delete this document.",
        )

    background_tasks.add_task(delete_embeddings_task, id)

    session.delete(document)
    session.commit()

    # 3. Return an immediate response
    return Message(
        message="Document deleted successfully. Embeddings are being removed in the background."
    )
