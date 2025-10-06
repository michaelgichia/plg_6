import uuid
from collections.abc import AsyncGenerator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.api.deps import CurrentUser, SessionDep
from app.schemas.public import ChatPublic, ChatMessage
from app.services.chat_db import (
    create_greeting_if_needed,
    get_all_messages,
    verify_course_access,
)
from app.services.chat_service import handle_continuation, handle_regular_question

router = APIRouter(prefix="/chat", tags=["chat"])

async def generate_chat_response(
    question: str,
    course_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    continue_response: bool = False,
) -> AsyncGenerator[str, None]:
    """
    Main chat response generator that delegates to appropriate service handlers
    """
    try:
        if continue_response:
            # Delegate to continuation handler
            async for chunk in handle_continuation(course_id, session, current_user):
                yield chunk
        else:
            # Delegate to regular question handler
            async for chunk in handle_regular_question(
                question, course_id, session, current_user
            ):
                yield chunk

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
        chat: Message to process with optional continuation flag

    Returns:
        Streaming response of AI-generated content
    """
    return StreamingResponse(
        generate_chat_response(
            chat.message,
            course_id,
            session,
            current_user,
            chat.continue_response,
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
    course = verify_course_access(course_id, session, current_user)

    # Get existing messages
    messages = get_all_messages(course_id, session, limit)

    # Generate Athena greeting if no messages exist
    if not messages:
        greeting = create_greeting_if_needed(course, session)
        if greeting:
            return [greeting]
        else:
            # If greeting creation fails, return empty list
            return []

    # Convert to ChatPublic
    return [ChatPublic(**msg.model_dump()) for msg in messages]
