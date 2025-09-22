import uuid
from typing import Any
from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import selectinload
from sqlmodel import func, select
from pydantic import BaseModel

from app.api.deps import CurrentUser, SessionDep
from app.models.common import Message
from app.models.course import (
    Course,
    CourseCreate,
    CoursePublic,
    CoursesPublic,
    CourseUpdate,
)
from app.models.document import Document, DocumentPublic

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
    statement = (
        select(Course).where(Course.id == id).options(selectinload(Course.documents))
    )
    course = session.exec(statement).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if not current_user.is_superuser and (course.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    return course
