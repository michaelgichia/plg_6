import uuid
from collections.abc import AsyncGenerator

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.api.routes.documents import (
    EMBEDDING_MODEL,
    async_openai_client,
    index_name,
    pc,
)
from app.models.chat import Chat, ChatCreate
from app.models.course import Course
from app.schemas.public import ChatPublic

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    message: str


class Config:
    schema_extra = {"example": {"message": "What is the main topic of the course?"}}


async def generate_chat_response(
    question: str,
    course_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> AsyncGenerator[str, None]:
    try:
        # Verify course exists and user has access
        course = session.exec(select(Course).where(Course.id == course_id)).first()

        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        if not current_user.is_superuser and (course.owner_id != current_user.id):
            raise HTTPException(status_code=400, detail="Not enough permissions")

        # Generate embedding for the question
        embed_resp = await async_openai_client.embeddings.create(
            input=[question],
            model=EMBEDDING_MODEL,
        )
        question_embedding = embed_resp.data[0].embedding

        # Query Pinecone for relevant chunks
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

        if not contexts:
            yield "Error: No relevant content found for this question"
            return

        context_str = "\n\n".join(contexts)

        # Save user message using ChatCreate
        user_chat_data = ChatCreate(
            message=question,
            is_system=False,
            course_id=course_id,  # Now UUID
        )
        user_msg = Chat(**user_chat_data.model_dump())
        session.add(user_msg)
        session.commit()

        # Stream response from OpenAI
        completion = await async_openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful tutor. Use the provided context to answer the question. If the context doesn't contain relevant information, say so politely.",
                },
                {
                    "role": "user",
                    "content": f"Context:\n{context_str}\n\nQuestion: {question}",
                },
            ],
            stream=True,
            temperature=0.7,
        )

        full_response = ""
        async for chunk in completion:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                full_response += content
                yield content

        # Save system message using ChatCreate
        system_chat_data = ChatCreate(
            message=full_response,
            is_system=True,
            course_id=course_id,
        )
        system_msg = Chat(**system_chat_data.model_dump())
        session.add(system_msg)
        session.commit()

    except Exception as e:
        yield f"Error: {str(e)}"


@router.post(
    "/{course_id}/stream",
    response_class=StreamingResponse,
    summary="Stream chat responses",
    description="Stream AI-generated responses based on course materials",
    responses={
        200: {"description": "Successful streaming response"},
        404: {"description": "Course not found"},
        401: {"description": "Not authenticated"},
    },
)
async def stream_chat(
    course_id: uuid.UUID,
    chat: ChatMessage,
    session: SessionDep,
    current_user: CurrentUser,
) -> StreamingResponse:
    """
    Stream chat responses for a course

    Args:
        course_id: UUID of the course
        chat: Message to process

    Returns:
        Streaming response of AI-generated content
    """
    return StreamingResponse(
        generate_chat_response(
            chat.message,
            course_id,
            session,
            current_user,
        ),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "connection": "keep-alive",
            "Content-Type": "text/plain; charset=utf-8",
        },
    )


@router.get(
    "/{course_id}/history",
    response_model=list[ChatPublic],
    summary="Get chat history",
    description="Retrieve chat history for a course",
    responses={
        200: {"model": list[ChatPublic], "description": "List of chat messages"},
        404: {"description": "Course not found"},
        401: {"description": "Not authenticated"},
    },
)
async def get_chat_history(
    course_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    limit: int = 50,
) -> list[ChatPublic]:
    """
    Get chat history for a course

    Args:
        course_id: UUID of the course
        limit: Maximum number of messages to return

    Returns:
        List of chat messages ordered by creation date, empty list if none found
    """
    # Verify course exists and user has access
    course = session.exec(select(Course).where(Course.id == course_id)).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if not current_user.is_superuser and (course.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    messages = session.exec(
        select(Chat)
        .where(Chat.course_id == course_id)  # Use UUID directly
        .order_by(Chat.created_at.asc())
        .limit(limit)
    ).all()

    # Convert to ChatPublic
    return [ChatPublic(**msg.model_dump()) for msg in messages] if messages else []
