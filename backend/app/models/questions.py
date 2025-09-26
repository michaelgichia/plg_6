import uuid
from datetime import datetime, timezone

from sqlalchemy import func
from sqlmodel import Field, Relationship, SQLModel, text

from app.schemas.public import DifficultyLevel


class QuestionBase(SQLModel):
    question_text: str
    correct_answer: str
    distraction_1: str
    distraction_2: str
    distraction_3: str
    topic: str
    chunk_id: uuid.UUID

# Properties to receive on question creation
class QuestionCreate(QuestionBase):
    pass

class Question(QuestionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    difficulty_level: DifficultyLevel = Field(default=DifficultyLevel.ALL)

    chunk_id: uuid.UUID = Field(foreign_key="chunk.id")
    chunk: "Chunk" = Relationship(back_populates="questions")

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={
            "server_default": text("CURRENT_TIMESTAMP"),
            "onupdate": func.now(),
        },
    )