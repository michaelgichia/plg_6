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

pc = Pinecone(api_key=PINECONE_API_KEY, environment=PINECONE_ENV_NAME)


if not pc.has_index(index_name):
    pc.delete_index(index_name)
    pc.create_index(
        name=index_name,
        dimension=1536,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
    )

index = pc.Index(index_name)

def chunk_text(text: str):
    """Split long text into overlapping chunks for embeddings."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", ".", "!", "?", " ", ""],
    )
    return splitter.split_text(text)

def embed_chunks(chunks: list[str]) -> list[list[float]]:
    """Generate embeddings for each chunk using OpenAI."""
    embeddings = []
    for chunk in chunks:
        response = openai.embeddings.create(
            input=chunk,
            model="text-embedding-3-small",
        )
        embeddings.append(response.data[0].embedding)
    return embeddings

def store_embeddings(chunks: list[str], embeddings: list[list[float]], course_id: str):
    """Store embeddings + metadata in Pinecone vector DB."""
    vectors = []
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings, strict=False)):
        vectors.append({
            "id": str(uuid.uuid4()),
            "values": embedding,
            "metadata": {
                "course_id": course_id,
                "text": chunk,
                "chunk_index": i,
            }
        })
    index.upsert(vectors)

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

    try:
        pdf_bytes = await file.read()
        reader = PdfReader(io.BytesIO(pdf_bytes))
        full_text = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])

        if not full_text.strip():
            raise HTTPException(status_code=400, detail="No text found in PDF")

        chunks = chunk_text(full_text)
        embeddings = embed_chunks(chunks)
        store_embeddings(chunks, embeddings, course_id)

        return {"status": "success", "chunks_stored": len(chunks)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {e}")
