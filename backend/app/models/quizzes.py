import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, func
from sqlalchemy import Enum as SAEnum
from sqlmodel import Field, Relationship, SQLModel, text

from app.schemas.public import DifficultyLevel


class QuizBase(SQLModel):
    quiz_text: str
    correct_answer: str
    distraction_1: str
    distraction_2: str
    distraction_3: str
    topic: str
    chunk_id: uuid.UUID
    difficulty_level: DifficultyLevel

# Properties to receive on quiz creation
class QuizCreate(QuizBase):
    pass

class Quiz(QuizBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    difficulty_level: DifficultyLevel = Field(
        default=DifficultyLevel.ALL,
        sa_column=Column(SAEnum(DifficultyLevel, name="difficulty_level_enum"))
    )

    chunk_id: uuid.UUID = Field(foreign_key="chunk.id")
    chunk: "Chunk" = Relationship(back_populates="quizzes")

    created_at: datetime = Field(
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