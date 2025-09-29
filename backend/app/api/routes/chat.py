import uuid
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from app.api.deps import CurrentUser, SessionDep


class Chat(BaseModel):
    chat_id: str
    message: str
    time: str
    is_system: bool


router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/{course_id}", response_model=Chat)
def list_chat(
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    cursor: str = "",
    limit: int = 100,
) -> Any:
    """
    Get chat history for a course.
    """


@router.post("/{course_id}", response_model=Chat)
def send_chat(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID, message: str
) -> Any:
    """
    Send chat for a course.
    """
