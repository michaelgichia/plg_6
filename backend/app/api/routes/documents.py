import asyncio
import os
import shutil
import tempfile
import uuid

import openai
from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from langchain.text_splitter import RecursiveCharacterTextSplitter
from pinecone import Pinecone, ServerlessSpec
from pypdf import PdfReader

router = APIRouter(prefix="/documents", tags=["documents"])
index_name = "developer-quickstart-py"

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV_NAME = os.getenv("PINECONE_ENV_NAME")
EMBEDDING_MODEL = "text-embedding-3-small"
EXPECTED_DIMENSION = 1536  # OpenAI text-embedding-3-small outputs 1536-dimensional vectors

pc = Pinecone(api_key=PINECONE_API_KEY, environment=PINECONE_ENV_NAME)

# Simple in-memory task tracking (use Redis/DB in production)
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

def store_embeddings(chunks: list[str], embeddings: list[list[float]], course_id: str, index):
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

async def process_pdf_task(file_path: str, course_id: str, task_id: str):
    """Background task to parse, chunk, embed, and store PDF."""
    try:
        task_status[task_id] = "processing"
        ensure_index_exists()
        index = pc.Index(index_name)

        # Parse PDF from disk
        with open(file_path, "rb") as f:
            reader = PdfReader(f)
            full_text = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])

        if not full_text.strip():
            task_status[task_id] = "failed: no text"
            return

        chunks = chunk_text(full_text)

        # Optional: batch embedding calls if many chunks
        embeddings = []
        BATCH_SIZE = 50
        for i in range(0, len(chunks), BATCH_SIZE):
            batch = chunks[i:i + BATCH_SIZE]
            embeddings.extend(embed_chunks(batch))
            await asyncio.sleep(0)  # yield to event loop

        store_embeddings(chunks, embeddings, course_id, index)
        task_status[task_id] = f"completed ({len(chunks)} chunks)"
    except Exception as e:
        task_status[task_id] = f"failed: {e}"
    finally:
        os.remove(file_path)

@router.post("/process")
async def process_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    course_id: str = Form(...)
):
    """Accept PDF upload, save to temp file, queue background task, return task_id."""
    if not course_id:
        raise HTTPException(status_code=400, detail="course_id is required")
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    # Save to temp file (streamed, avoids memory spike)
    tmp_dir = tempfile.mkdtemp()
    tmp_path = os.path.join(tmp_dir, file.filename)

    with open(tmp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    task_id = str(uuid.uuid4())
    task_status[task_id] = "queued"

    # Launch background task
    background_tasks.add_task(process_pdf_task, tmp_path, course_id, task_id)

    return {"task_id": task_id, "status": "queued"}

@router.get("/status/{task_id}")
async def get_task_status(task_id: str):
    """Check processing status of a previously submitted PDF."""
    return {"task_id": task_id, "status": task_status.get(task_id, "unknown")}
