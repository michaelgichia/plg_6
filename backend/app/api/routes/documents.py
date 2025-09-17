import io
import os
import uuid

import openai
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
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


def ensure_index_exists():
    """Ensure Pinecone index exists with the correct dimension, recreate if wrong."""
    if pc.has_index(index_name):
        existing = pc.describe_index(index_name)
        if existing.dimension != EXPECTED_DIMENSION:
            # Delete and recreate index with correct dimension
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
    """Split long text into overlapping chunks for embeddings."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", ".", "!", "?", " ", ""],
    )
    return splitter.split_text(text)


def embed_chunks(chunks: list[str]) -> list[list[float]]:
    """Generate embeddings for all chunks in a single OpenAI request."""
    try:
        response = openai.embeddings.create(
            input=chunks,
            model=EMBEDDING_MODEL,
        )
        return [item.embedding for item in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {e}")


def store_embeddings(chunks: list[str], embeddings: list[list[float]], course_id: str, index):
    """Store embeddings + metadata in Pinecone vector DB."""
    try:
        vectors = [
            {
                "id": str(uuid.uuid4()),
                "values": embedding,
                "metadata": {
                    "course_id": course_id,
                    "text": chunk,
                    "chunk_index": i,
                }
            }
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings, strict=False))
        ]
        index.upsert(vectors)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pinecone upsert failed: {e}")


@router.post("/process")
async def process_document(
    file: UploadFile = File(...),
    course_id: str = Form(...)
):
    """Process PDF, chunk, embed, and store it in vector DB."""
    if not course_id:
        raise HTTPException(status_code=400, detail="course_id is required")
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    ensure_index_exists()
    index = pc.Index(index_name)

    try:
        pdf_bytes = await file.read()
        reader = PdfReader(io.BytesIO(pdf_bytes))
        full_text = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])

        if not full_text.strip():
            raise HTTPException(status_code=400, detail="No text found in PDF")

        chunks = chunk_text(full_text)
        embeddings = embed_chunks(chunks)
        store_embeddings(chunks, embeddings, course_id, index)

        return {"status": "success", "chunks_stored": len(chunks)}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {e}")
