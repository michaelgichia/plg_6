import uuid
from datetime import datetime, timezone

from pydantic import BaseModel
from sqlalchemy import text
from sqlmodel import Field, Relationship, SQLModel

from app.models.user import User


# shared properties
class CourseBase(SQLModel):
    name: str = Field(min_length=3, max_length=255)
    description: str | None = Field(default=None, max_length=1020)


# Properties to receive on item creation
class CourseCreate(CourseBase):
    pass


# Properties to receive on item update
class CourseUpdate(CourseBase):
    name: str | None = Field(default=None, min_length=3, max_length=255)  # type: ignore
    description: str | None = Field(default=None, max_length=1020)  # type: ignore


# Database model, database table inferred from class name
class Course(CourseBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="users.id", nullable=False, ondelete="CASCADE", index=True
    )

    owner: User | None = Relationship(back_populates="courses")
    documents: list["Document"] = Relationship(  # noqa: F821 # type: ignore
        back_populates="course",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    chunks: list["Chunk"] = Relationship(  # noqa: F821 # type: ignore
        back_populates="course",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    chats: list["Chat"] = Relationship(back_populates="course")  # noqa: F821 # type: ignore
    quizzes: list["Quiz"] = Relationship(  # noqa: F821 # type: ignore
        back_populates="course",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    quiz_sessions: list["QuizSession"] = Relationship(  # noqa: F821 # type: ignore
        back_populates="course",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
        index=True,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
        index=True,
    )

class QAItem(BaseModel):
    question: str
    answer: str
