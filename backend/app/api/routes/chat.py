import uuid
from typing import Any
from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import selectinload
from sqlmodel import func, select
from pydantic import BaseModel

from app.api.deps import CurrentUser, SessionDep
from app.models.common import Message

class Chat(BaseModel):
    chat_id: str
    message: str
    time: str
    is_system: bool

router = APIRouter(prefix="/chat", tags=["chat"])

@router.get("/{course_id}", response_model=Chat)
def list_chat(session: SessionDep, current_user: CurrentUser, id: uuid.UUID, cursor: str = '', limit: int = 100) -> Any:
    """
    Get chat history for a course.
    """
    
@router.get("/{course_id}", response_model=Chat)
def send_chat(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Send chat for a course.
    """
    
