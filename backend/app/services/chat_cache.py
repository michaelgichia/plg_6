"""
Chat response caching service
"""
import uuid
import numpy as np
from typing import Optional, Tuple, List
from sqlmodel import select

from app.api.routes.documents import async_openai_client, EMBEDDING_MODEL
from app.models.chat import Chat
from app.api.deps import SessionDep

# Caching constants
SIMILARITY_THRESHOLD = 0.85  # Minimum similarity for cache hit
MAX_CACHE_ENTRIES = 100  # Maximum cached responses per course


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculate cosine similarity between two vectors"""
    v1 = np.array(vec1)
    v2 = np.array(vec2)
    
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    
    return dot_product / (norm_v1 * norm_v2)


async def check_cached_response(
    question: str,
    question_embedding: List[float],
    course_id: uuid.UUID,
    session: SessionDep,
) -> Optional[Tuple[str, str]]:
    """
    Check if a similar question has been asked before and return cached response
    Returns: (cached_response, original_question) or None if no similar question found
    """
    # Get recent user questions with their system responses for this course
    recent_pairs = session.exec(
        select(Chat)
        .where(Chat.course_id == course_id)
        .order_by(Chat.created_at.desc())
        .limit(MAX_CACHE_ENTRIES * 2)  # Get more to find pairs
    ).all()
    
    # Group messages into question-answer pairs
    pairs = []
    for i in range(len(recent_pairs) - 1):
        if (not recent_pairs[i].is_system and 
            recent_pairs[i+1].is_system and
            recent_pairs[i].message and 
            recent_pairs[i+1].message):
            pairs.append((recent_pairs[i].message, recent_pairs[i+1].message))
    
    # Check similarity with recent questions
    for cached_question, cached_response in pairs[:MAX_CACHE_ENTRIES]:
        try:
            # Generate embedding for cached question
            embed_resp = await async_openai_client.embeddings.create(
                input=[cached_question],
                model=EMBEDDING_MODEL,
            )
            cached_embedding = embed_resp.data[0].embedding
            
            # Calculate similarity
            similarity = cosine_similarity(question_embedding, cached_embedding)
            
            if similarity >= SIMILARITY_THRESHOLD:
                return cached_response, cached_question
                
        except Exception as e:
            print(f"Error checking cache similarity: {e}")
            continue
    
    return None