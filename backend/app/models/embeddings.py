import uuid
from datetime import datetime, timezone

from typing import TYPE_CHECKING
from app.models.course import Course
from sqlalchemy import text
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.document import Document
    from app.models.quizzes import Quiz


class ChunkBase(SQLModel):
    text_content: str
    embedding_id: str = Field(unique=True)
    document_id: uuid.UUID


class ChunkCreate(ChunkBase):
    pass


class ChunkUpdate(SQLModel):
    text_content: str | None = None
    embedding_id: str | None = None
    document_id: uuid.UUID | None = None


class Chunk(ChunkBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    document_id: uuid.UUID = Field(foreign_key="document.id", nullable=False)

    document: "Document" = Relationship(back_populates="chunks")
    quizzes: list["Quiz"] = Relationship(
        back_populates="chunk", sa_relationship_kwargs={"cascade": "delete"}
    )
    course_id: uuid.UUID = Field(foreign_key="course.id", nullable=False)
    course: Course | None = Relationship(back_populates="chunks")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )