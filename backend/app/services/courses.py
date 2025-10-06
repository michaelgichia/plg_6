import json
import logging
import uuid
from http import HTTPStatus

from fastapi import HTTPException

from app.llm_clients.openai_client import client
from app.llm_clients.pinecone_config import pc
from app.models.course import (
    QAItem,
)
from app.prompts.flashcards import PROMPT

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def get_retrieved_docs(
    document_id: uuid.UUID, index_name: str, query: str, top_k: int = 5
):
    """
    Retrieve text chunks directly from Pinecone for a specific document.
    """
    index = pc.Index(index_name)

    try:
        embed = await client.embeddings.create(
            model="text-embedding-3-small",
            input=query,
        )
        query_vector = embed.data[0].embedding

        results = index.query(
            vector=query_vector,
            top_k=top_k,
            include_metadata=True,
            filter={"document_id": str(document_id)},
        )

        return [match["metadata"]["text"] for match in results["matches"]]

    except Exception as exc:
        logger.error(
            f"Pinecone retrieval failed for document {document_id}: {exc}",
            exc_info=True,
        )
        raise ConnectionError(
            "Failed to retrieve document content from vector store."
        ) from exc


async def generate_flashcards_from_text(chunks: list[str]) -> list[QAItem]:
    """
    Calls an LLM to generate flashcards directly from text chunks.
    """
    joined_text = "\n\n".join(chunks)
    system_prompt = (
        "You are an AI assistant that creates educational flashcards.\n"
        "Use the provided text to create concise, meaningful Q&A pairs.\n"
        "Respond with valid JSON array format only."
    )
    user_prompt = f"{system_prompt}\n\nText:\n{joined_text}\n\n{PROMPT}"

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": user_prompt}],
            temperature=0.7,
        )

        answer_text = response.choices[0].message.content.strip()
        flashcards = json.loads(answer_text)
        return [QAItem.model_validate(fc) for fc in flashcards]

    except json.JSONDecodeError:
        logger.error("Model returned invalid JSON:\n%s", answer_text)
        raise HTTPException(
            status_code=HTTPStatus.BAD_GATEWAY,
            detail="Model returned invalid JSON output.",
        )
    except Exception as exc:
        logger.error("LLM request failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            detail="Failed to generate flashcards from LLM.",
        )
