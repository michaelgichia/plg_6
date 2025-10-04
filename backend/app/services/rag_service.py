"""
RAG (Retrieval-Augmented Generation) service for document context retrieval
"""
import uuid
from typing import List, Optional

from app.api.routes.documents import (
    async_openai_client,
    EMBEDDING_MODEL,
    index_name,
    pc,
)


async def get_question_embedding(question: str) -> List[float]:
    """Generate embedding for a question"""
    embed_resp = await async_openai_client.embeddings.create(
        input=[question],
        model=EMBEDDING_MODEL,
    )
    return embed_resp.data[0].embedding


async def retrieve_relevant_context(
    question_embedding: List[float], 
    course_id: uuid.UUID,
    top_k: int = 5
) -> Optional[str]:
    """
    Retrieve relevant context from course documents using vector similarity
    
    Args:
        question_embedding: The embedding vector for the question
        course_id: UUID of the course to search within
        top_k: Number of top matches to retrieve
        
    Returns:
        Concatenated context string or None if no relevant content found
    """
    try:
        # Query Pinecone for relevant chunks
        index = pc.Index(index_name)
        query_result = index.query(
            vector=question_embedding,
            filter={"course_id": str(course_id)},
            top_k=top_k,
            include_metadata=True,
        )
        
        contexts = [
            match["metadata"]["text"]
            for match in query_result["matches"]
            if "metadata" in match and "text" in match["metadata"]
        ]

        if not contexts:
            return None

        return "\n\n".join(contexts)
        
    except Exception as e:
        print(f"Error retrieving context: {e}")
        return None