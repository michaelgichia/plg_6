import uuid
from datetime import datetime, timezone

from app.models.quizzes import Quiz
from sqlalchemy import text
from sqlmodel import Field, Relationship, SQLModel

from app.models.course import Course
from app.models.embeddings import Chunk
from app.schemas.public import DocumentStatus


class DocumentBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)


# Properties to receive on document creation
class DocumentCreate(DocumentBase):
    pass


class Document(DocumentBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    chunk_count: int | None = None
    course_id: uuid.UUID = Field(foreign_key="course.id", nullable=False)
    embedding_namespace: str | None = None
    filename: str
    status: DocumentStatus = Field(default=DocumentStatus.PENDING)

    course: Course | None = Relationship(back_populates="documents")
    chunks: list[Chunk] = Relationship(
        back_populates="document", sa_relationship_kwargs={"cascade": "delete"}
    )
    quizzes: list[Quiz] = Relationship(
        back_populates="document", sa_relationship_kwargs={"cascade": "delete"}
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )
