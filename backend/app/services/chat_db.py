"""
Chat database operations service
"""
import uuid
from typing import List, Optional
from sqlmodel import select

from app.api.deps import SessionDep
from app.models.chat import Chat, ChatCreate
from app.models.course import Course
from app.schemas.public import ChatPublic
from app.services.chat_utils import create_greeting_message


def verify_course_access(
    course_id: uuid.UUID, 
    session: SessionDep, 
    current_user
) -> Course:
    """
    Verify course exists and user has access
    
    Raises:
        HTTPException: If course not found or no permissions
    """
    from fastapi import HTTPException
    
    course = session.exec(select(Course).where(Course.id == course_id)).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if not current_user.is_superuser and (course.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    return course


def get_recent_messages(
    course_id: uuid.UUID, 
    session: SessionDep, 
    limit: int = 10
) -> List[Chat]:
    """Get recent chat messages for a course"""
    return session.exec(
        select(Chat)
        .where(Chat.course_id == course_id)
        .order_by(Chat.created_at.desc())
        .limit(limit)
    ).all()


def get_all_messages(
    course_id: uuid.UUID, 
    session: SessionDep, 
    limit: int = 50
) -> List[Chat]:
    """Get all chat messages for a course in chronological order"""
    return session.exec(
        select(Chat)
        .where(Chat.course_id == course_id)
        .order_by(Chat.created_at.asc())
        .limit(limit)
    ).all()


def get_last_system_message(
    course_id: uuid.UUID, 
    session: SessionDep
) -> Optional[Chat]:
    """Get the most recent system message for continuation"""
    return session.exec(
        select(Chat)
        .where(Chat.course_id == course_id, Chat.is_system == True)
        .order_by(Chat.created_at.desc())
        .limit(1)
    ).first()


def save_user_message(
    message: str, 
    course_id: uuid.UUID, 
    session: SessionDep
) -> Chat:
    """Save a user message to the database"""
    user_chat_data = ChatCreate(
        message=message,
        is_system=False,
        course_id=course_id,
    )
    user_msg = Chat(**user_chat_data.model_dump())
    session.add(user_msg)
    session.commit()
    return user_msg


def save_system_message(
    message: str, 
    course_id: uuid.UUID, 
    session: SessionDep
) -> Chat:
    """Save a system message to the database"""
    system_chat_data = ChatCreate(
        message=message,
        is_system=True,
        course_id=course_id,
    )
    system_msg = Chat(**system_chat_data.model_dump())
    session.add(system_msg)
    session.commit()
    return system_msg


def update_system_message(
    message: Chat, 
    new_content: str, 
    session: SessionDep
) -> None:
    """Update an existing system message"""
    message.message = new_content
    session.add(message)
    session.commit()


def create_greeting_if_needed(
    course: Course, 
    session: SessionDep
) -> Optional[ChatPublic]:
    """
    Create and save a greeting message if no messages exist for the course
    
    Returns:
        ChatPublic greeting message or None if creation fails
    """
    try:
        greeting_text = create_greeting_message(course.name)
        
        # Create and save greeting message
        greeting_data = ChatCreate(
            message=greeting_text,
            is_system=True,
            course_id=course.id,
        )
        greeting_msg = Chat(**greeting_data.model_dump())
        session.add(greeting_msg)
        session.commit()
        session.refresh(greeting_msg)
        
        # Return greeting as ChatPublic
        return ChatPublic(**greeting_msg.model_dump())
    except Exception as e:
        print(f"Error creating greeting message: {e}")
        return None