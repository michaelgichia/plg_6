import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, event, text
from sqlmodel import Field, Relationship, SQLModel

from app.models.course import Course


# shared properties
class ChatBase(SQLModel):
    message: str | None = Field(default=None, max_length=1024)
    course_id: str = Field(min_length=3, max_length=255)
    is_system: bool
    created_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True), server_default=text("now()"), nullable=False
        )
    )
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


# Properties to receive on chat creation
class ChatCreate(ChatBase):
    message: str
    course_id: str
    is_system: bool


# Properties to receive on chat update
class ChatUpdate(ChatBase):
    id: str
    message: str


# Database model, database table inferred from class name
class Chat(ChatBase, table=True):
    __tablename__ = "chat"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    message: str = Field(nullable=False, max_length=1024)
    is_system: bool = Field(nullable=False)
    course_id: uuid.UUID = Field(
        foreign_key="course.id", nullable=False, ondelete="CASCADE"
    )

    course: Course | None = Relationship(back_populates="course")


# Automatically update the updated_at field before update
@event.listens_for(Chat, "before_update", propagate=True)
def set_updated_at(mapper, connection, target):
    target.updated_at = datetime.utcnow()
