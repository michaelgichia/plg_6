import asyncio
import os
import shutil
import tempfile
import uuid
from typing import Any

import openai
from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from langchain.text_splitter import RecursiveCharacterTextSplitter
from pinecone import Pinecone, ServerlessSpec
from pypdf import PdfReader
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.models.course import Course
from app.models.document import Document, DocumentStatus

router = APIRouter(prefix="/documents", tags=["documents"])
index_name = "developer-quickstart-py"

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV_NAME = os.getenv("PINECONE_ENV_NAME")
EMBEDDING_MODEL = "text-embedding-3-small"
EXPECTED_DIMENSION = 1536

pc = Pinecone(api_key=PINECONE_API_KEY, environment=PINECONE_ENV_NAME)

task_status: dict[str, str] = {}


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


def embed_chunks(chunks: list[str]) -> list[list[float]]:
    try:
        response = openai.embeddings.create(
            input=chunks,
            model=EMBEDDING_MODEL,
        )
        return [item.embedding for item in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {e}")


def store_embeddings(
    chunks: list[str], embeddings: list[list[float]], course_id: str, index
):
    vectors = [
        {
            "id": str(uuid.uuid4()),
            "values": embedding,
            "metadata": {
                "course_id": course_id,
                "text": chunk,
                "chunk_index": i,
            },
        }
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings, strict=False))
    ]
    index.upsert(vectors)

async def process_pdf_task(
    file_path: str, document_id: uuid.UUID, course_id: str, session: SessionDep
):
    """Background task to parse, chunk, embed, and store PDF."""
    try:
        ensure_index_exists()
        index = pc.Index(index_name)
        # 1. Update document status to "processing"
        document = session.get(Document, document_id)
        if not document:
            # TODO(mike): Handle case where document record is not found
            return

        document.status = DocumentStatus.PROCESSING
        session.add(document)
        session.commit()

        # 2. Perform the PDF processing
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
            embeddings.extend(embed_chunks(batch))
            await asyncio.sleep(0)

        store_embeddings(chunks, embeddings, course_id, index)
        document.status = DocumentStatus.COMPLETED
        document.chunk_count = len(chunks)
        session.add(document)
        session.commit()

    except Exception as e:
        document.status = DocumentStatus.FAILED
        session.add(document)
        session.commit()
    finally:
        os.remove(file_path)


@router.post("/process")
async def process_document(
    session: SessionDep,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    course_id: str = Form(...),
):
    """
    Accept PDF upload, create a Document record, save to temp file,
    and queue a background task for processing.
    """
    if not course_id:
        raise HTTPException(status_code=400, detail="course_id is required")

    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    # 1. Create a Document record in the database
    db_document = Document(
        title=file.filename,  # Using filename as a title by default
        filename=file.filename,
        course_id=course_id,
        # Status is 'pending' by default, no need to set
    )
    session.add(db_document)
    session.commit()
    session.refresh(db_document)

    # 2. Save the file to a temporary location
    # This part remains the same, but it's now tied to the Document ID
    tmp_dir = tempfile.mkdtemp()
    tmp_path = os.path.join(tmp_dir, str(db_document.id) + "_" + file.filename)

    with open(tmp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 3. Launch the background task using the document's ID
    # The task now receives the document_id, which it can use to update the status
    background_tasks.add_task(process_pdf_task, tmp_path, db_document.id, course_id, session)

    return {"document_id": db_document.id, "status": db_document.status}

@router.get("/{id}", response_model=Document)
def read_document(
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID
) -> Any:
    """
    Get a document by its ID, ensuring the user has permissions.
    """
    statement = (
        select(Document)
        .join(Course)
        .where(Document.id == id)
        .where(Course.owner_id == current_user.id)
    )

    document = session.exec(statement).first()

    if not document:
        if session.get(Document, id) is None:
            raise HTTPException(status_code=404, detail="Document not found")
        else:
            raise HTTPException(status_code=403, detail="Not enough permissions to access this document")

    return document
