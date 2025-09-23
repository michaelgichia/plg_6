import uuid
from typing import Any, AsyncGenerator
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import func, select
from pydantic import BaseModel
import openai
from app.api.deps import CurrentUser, SessionDep
from app.models.chat import Chat
from app.api.routes.documents import async_openai_client, pc, EMBEDDING_MODEL, index_name

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatMessage(BaseModel):
    message: str

async def generate_chat_response(
    question: str,
    course_id: str,
    session: SessionDep,
    current_user: CurrentUser,
) -> AsyncGenerator[str, None]:
    try:
        # 1. Generate embedding for the question
        embed_resp = await async_openai_client.embeddings.create(
            input=[question],
            model=EMBEDDING_MODEL,
        )
        question_embedding = embed_resp.data[0].embedding

        # 2. Query Pinecone for relevant chunks
        index = pc.Index(index_name)
        query_result = index.query(
            vector=question_embedding,
            filter={"course_id": str(course_id)},
            top_k=5,
            include_metadata=True,
        )
        contexts = [
            match["metadata"]["text"]
            for match in query_result["matches"]
            if "metadata" in match and "text" in match["metadata"]
        ]
        context_str = "\n\n".join(contexts)

        # 3. Stream response from OpenAI
        completion = await async_openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful tutor. Use the provided context to answer the question."},
                {"role": "user", "content": f"Context:\n{context_str}\n\nQuestion: {question}"}
            ],
            stream=True,
        )

        # Save user message
        user_msg = Chat(
            message=question,
            is_system=False,
            course_id=course_id,
        )
        session.add(user_msg)
        
        full_response = ""
        async for chunk in completion:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                full_response += content
                yield content

        # Save system message after completion
        system_msg = Chat(
            message=full_response,
            is_system=True,
            course_id=course_id,
        )
        session.add(system_msg)
        await session.commit()

    except Exception as e:
        yield f"Error: {str(e)}"

@router.post("/{course_id}/stream")
async def stream_chat(
    course_id: uuid.UUID,
    chat: ChatMessage,
    session: SessionDep,
    current_user: CurrentUser,
) -> StreamingResponse:
    """
    Stream chat responses for a course.
    """
    return StreamingResponse(
        generate_chat_response(
            chat.message,
            str(course_id),
            session,
            current_user,
        ),
        media_type='text/event-stream'
    )

@router.get("/{course_id}")
async def get_chat_history(
    course_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    limit: int = 50
) -> list[Chat]:
    """
    Get chat history for a course.
    """
    messages = session.exec(
        select(Chat)
        .where(Chat.course_id == str(course_id))
        .order_by(Chat.created_at.desc())
        .limit(limit)
    ).all()
    return messages   
