import uuid
from collections.abc import AsyncGenerator
import tiktoken

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

# Token management constants
MAX_CONTEXT_TOKENS = 3500  # Leave room for response (~500 tokens)
SYSTEM_PROMPT_TOKENS = 100  # Estimate for system prompt
MAX_HISTORY_MESSAGES = 10


class ChatMessage(BaseModel):
    message: str
    continue_response: bool = False  # Flag to continue previous response

    class Config:
        schema_extra = {
            "example": {
                "message": "What is the main topic of the course?",
                "continue_response": False
            }
        }


def count_tokens(text: str, model: str = "gpt-4") -> int:
    """Count tokens in text using tiktoken"""
    try:
        encoding = tiktoken.encoding_for_model(model)
        return len(encoding.encode(text))
    except Exception:
        # Fallback estimation: ~4 chars per token
        return len(text) // 4


def filter_chat_history(
    messages: list[Chat], 
    current_question: str,
    context_str: str,
    max_tokens: int = MAX_CONTEXT_TOKENS
) -> list[dict]:
    """Filter and truncate chat history to fit within token limits"""
    
    # Calculate base tokens (system prompt + context + current question)
    base_tokens = (
        SYSTEM_PROMPT_TOKENS +
        count_tokens(context_str) +
        count_tokens(current_question)
    )
    
    available_tokens = max_tokens - base_tokens
    
    if available_tokens <= 0:
        return []  # No room for history
    
    conversation_history = []
    current_tokens = 0
    
    # Start with most recent messages (reverse chronological order)
    for msg in reversed(messages):
        if not msg.message:
            continue
            
        role = "assistant" if msg.is_system else "user"
        message_content = {
            "role": role,
            "content": msg.message
        }
        
        message_tokens = count_tokens(msg.message)
        
        # Check if adding this message would exceed token limit
        if current_tokens + message_tokens > available_tokens:
            break
            
        # Add to beginning to maintain chronological order
        conversation_history.insert(0, message_content)
        current_tokens += message_tokens
    
    return conversation_history


async def generate_chat_response(
    question: str,
    course_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    continue_response: bool = False,
) -> AsyncGenerator[str, None]:
    try:
        # Verify course exists and user has access
        course = session.exec(select(Course).where(Course.id == course_id)).first()

        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        if not current_user.is_superuser and (course.owner_id != current_user.id):
            raise HTTPException(status_code=400, detail="Not enough permissions")

        if continue_response:
            # Get the last system message to continue from
            last_system_msg = session.exec(
                select(Chat)
                .where(Chat.course_id == course_id, Chat.is_system == True)
                .order_by(Chat.created_at.desc())
                .limit(1)
            ).first()
            
            if not last_system_msg or not last_system_msg.message:
                yield "Error: No previous response found to continue"
                return
            
            # Get recent chat history for context
            recent_messages = session.exec(
                select(Chat)
                .where(Chat.course_id == course_id)
                .order_by(Chat.created_at.desc())
                .limit(6)  # Last 6 messages for continuation context
            ).all()
            
            # Build conversation history with token filtering
            conversation_history = filter_chat_history(
                recent_messages, 
                "Please continue your previous response.", 
                ""  # No RAG context for continuations
            )
            
            # Create continuation prompt
            messages = [
                {
                    "role": "system",
                    "content": f"You are Athena, a helpful AI tutor for the course '{course.name}'. Continue your previous response from exactly where it left off. Do not repeat what you already said, just continue naturally with the same friendly, supportive tone."
                }
            ]
            
            # Add filtered conversation history
            messages.extend(conversation_history)
            
            # Add continuation request
            messages.append({
                "role": "user",
                "content": "Please continue your previous response."
            })
            
        else:
            # Regular question processing
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

            # Get recent chat history for conversational context
            recent_messages = session.exec(
                select(Chat)
                .where(Chat.course_id == course_id)
                .order_by(Chat.created_at.desc())
                .limit(MAX_HISTORY_MESSAGES)
            ).all()
            
            # Filter history based on token limits
            conversation_history = filter_chat_history(
                recent_messages, 
                question, 
                context_str
            )

            # Save user message using ChatCreate
            user_chat_data = ChatCreate(
                message=question,
                is_system=False,
                course_id=course_id,
            )
            user_msg = Chat(**user_chat_data.model_dump())
            session.add(user_msg)
            session.commit()

            # Build messages with filtered conversation history
            messages = [
                {
                    "role": "system",
                    "content": f"You are Athena, a helpful AI tutor for the course '{course.name}'. You are friendly, encouraging, and knowledgeable. Handle social interactions gracefully:\n\n"
                    "- Respond warmly to greetings: 'Hello!' → 'Hi there! How can I help you with your studies today?'\n"
                    "- Acknowledge thanks: 'Thank you!' → 'You're welcome! Any other questions about the course materials?'\n"
                    "- For off-topic questions, politely redirect: 'I'm focused on helping with {course.name}. Is there something from the course materials I can explain?'\n"
                    "- Use the provided context from course materials to answer academic questions\n"
                    "- You have access to previous conversation history for better responses\n"
                    "- If context doesn't contain relevant information, say so and suggest asking about topics covered in the materials\n"
                    "- Always maintain a supportive, tutoring tone"
                }
            ]
            
            # Add filtered conversation history
            if conversation_history:
                messages.extend(conversation_history)
            
            # Add current question with context
            messages.append({
                "role": "user",
                "content": f"Context from course materials:\n{context_str}\n\nQuestion: {question}"
            })

        # Log token usage for monitoring
        total_tokens = sum(count_tokens(str(msg["content"])) for msg in messages)
        print(f"Chat context tokens: {total_tokens}, History messages: {len(conversation_history) if 'conversation_history' in locals() else 0}")

        # Stream response from OpenAI with context
        completion = await async_openai_client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            stream=True,
            temperature=0.7,
            max_tokens=1000,
        )

        full_response = ""
        async for chunk in completion:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                full_response += content
                yield content
            
            # Check if response was truncated (stream ended due to token limit)
            if chunk.choices[0].finish_reason == "length":
                yield "\n\n[Response was truncated. Ask me to continue for more details.]"

        # Save system message
        if continue_response and full_response:
            # Update the last system message by appending continuation
            last_system_msg = session.exec(
                select(Chat)
                .where(Chat.course_id == course_id, Chat.is_system == True)
                .order_by(Chat.created_at.desc())
                .limit(1)
            ).first()
            
            if last_system_msg:
                last_system_msg.message = (last_system_msg.message or "") + full_response
                session.add(last_system_msg)
                session.commit()
        else:
            # Save new system message
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
    course = session.exec(select(Course).where(Course.id == course_id)).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if not current_user.is_superuser and (course.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    messages = session.exec(
        select(Chat)
        .where(Chat.course_id == course_id)
        .order_by(Chat.created_at.asc())
        .limit(limit)
    ).all()

     # Generate Athena greeting if no messages exist
    if not messages:
        greeting_text = f"Hi! I'm Athena, your AI tutor for {course.name}. I'm ready to help you understand the course materials and answer any questions you have. What would you like to learn about today?"
        
        # Create and save greeting message
        greeting_data = ChatCreate(
            message=greeting_text,
            is_system=True,
            course_id=course_id,
        )
        greeting_msg = Chat(**greeting_data.model_dump())
        session.add(greeting_msg)
        session.commit()
        session.refresh(greeting_msg)
        
        # Return greeting as first message
        return [ChatPublic(**greeting_msg.model_dump())]

    # Convert to ChatPublic
    return [ChatPublic(**msg.model_dump()) for msg in messages] if messages else []