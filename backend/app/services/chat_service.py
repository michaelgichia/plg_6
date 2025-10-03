"""
Main chat service that orchestrates all chat functionality
"""
import uuid
from collections.abc import AsyncGenerator
from typing import List

from app.api.deps import SessionDep, CurrentUser
from app.services.chat_db import (
    verify_course_access,
    get_recent_messages,
    get_last_system_message,
    save_user_message,
    save_system_message,
    update_system_message,
)
from app.services.chat_utils import (
    filter_chat_history,
    build_system_prompt,
    build_continuation_prompt,
)
from app.services.chat_cache import check_cached_response
from app.services.rag_service import get_question_embedding, retrieve_relevant_context
from app.services.openai_service import stream_cached_response, generate_openai_response


async def handle_continuation(
    course_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> AsyncGenerator[str, None]:
    """Handle response continuation logic"""
    # Verify access
    course = verify_course_access(course_id, session, current_user)
    
    # Get the last system message to continue from
    last_system_msg = get_last_system_message(course_id, session)
    
    if not last_system_msg or not last_system_msg.message:
        yield "Error: No previous response found to continue"
        return
    
    # Get recent chat history for context (limited for continuations)
    recent_messages = get_recent_messages(course_id, session, limit=6)
    
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
            "content": build_continuation_prompt(course.name)
        }
    ]
    
    # Add filtered conversation history
    messages.extend(conversation_history)
    
    # Add continuation request
    messages.append({
        "role": "user",
        "content": "Please continue your previous response."
    })
    
    # Generate and stream response
    full_response = ""
    async for chunk in generate_openai_response(messages):
        full_response += chunk
        yield chunk
    
    # Update the last system message by appending continuation
    if full_response and last_system_msg:
        # Remove truncation indicator from previous message before appending
        current_message = last_system_msg.message or ""
        cleaned_message = current_message.replace(
            "\n\n[Response was truncated. Ask me to continue for more details.]", 
            ""
        )
        update_system_message(
            last_system_msg, 
            cleaned_message + full_response, 
            session
        )


async def handle_regular_question(
    question: str,
    course_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> AsyncGenerator[str, None]:
    """Handle regular question processing with RAG and caching"""
    # Verify access
    course = verify_course_access(course_id, session, current_user)
    
    # Generate embedding for the question
    question_embedding = await get_question_embedding(question)

    # Check for cached similar response first
    cached_result = await check_cached_response(
        question, question_embedding, course_id, session
    )
    
    if cached_result:
        cached_response, _ = cached_result
        
        # Save user message
        save_user_message(question, course_id, session)
        
        # Stream cached response directly (without similarity note for cleaner UX)
        async for chunk in stream_cached_response(cached_response):
            yield chunk
        
        # Save system message with cached response
        save_system_message(cached_response, course_id, session)
        return

    # Retrieve relevant context from documents
    context_str = await retrieve_relevant_context(question_embedding, course_id)
    
    if not context_str:
        yield "Error: No relevant content found for this question"
        return

    # Get recent chat history for conversational context
    recent_messages = get_recent_messages(course_id, session)
    
    # Filter history based on token limits
    conversation_history = filter_chat_history(
        recent_messages, 
        question, 
        context_str
    )

    # Save user message
    save_user_message(question, course_id, session)

    # Build messages with filtered conversation history
    messages = [
        {
            "role": "system",
            "content": build_system_prompt(course.name)
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

    # Generate and stream response
    full_response = ""
    async for chunk in generate_openai_response(messages):
        full_response += chunk
        yield chunk

    # Save system message
    save_system_message(full_response, course_id, session)