import uuid
from datetime import datetime, timezone

from sqlalchemy import Enum as SAEnum
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from sqlmodel import Column, Field, ForeignKey, Relationship, SQLModel, text

from app.schemas.public import DifficultyLevel


class QuizBase(SQLModel):
    chunk_id: uuid.UUID
    course_id: uuid.UUID
    correct_answer: str
    difficulty_level: DifficultyLevel
    distraction_1: str
    distraction_2: str
    distraction_3: str
    document_id: uuid.UUID
    feedback: str | None = None
    quiz_text: str
    topic: str


# Properties to receive on quiz creation
class QuizCreate(QuizBase):
    pass


class QuizAttemptBase(SQLModel):
    user_id: uuid.UUID = Field(foreign_key="users.id")
    session_id: uuid.UUID = Field(foreign_key="quizsession.id")
    quiz_id: uuid.UUID = Field(
        sa_column=Column(
            UUID(as_uuid=True),
            ForeignKey("quiz.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )
    selected_answer_text: str

    is_correct: bool
    correct_answer_text: str

    time_spent_seconds: float = Field(default=0.0)
    feedback: str | None = None


class QuizSessionBase(SQLModel):
    user_id: uuid.UUID = Field(foreign_key="users.id")
    course_id: uuid.UUID = Field(
        foreign_key="course.id",
        nullable=False,
    )
    total_time_seconds: float = Field(default=0.0)
    total_submitted: int
    total_correct: int
    quiz_ids_json: list[str] = Field(sa_column=Column(JSONB), default_factory=list)
    score_percentage: float | None = 0


class QuizSession(QuizSessionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    is_completed: bool = Field(default=False)

    attempts: list["QuizAttempt"] = Relationship(
        back_populates="session",
        sa_relationship=relationship(
            "QuizAttempt",
            back_populates="session",
            lazy="selectin",
        ),
    )
    course: "Course" = Relationship(
        back_populates="quiz_sessions",
        sa_relationship=relationship(
            "Course",
            back_populates="quiz_sessions",
            lazy="selectin",
        ),
    )

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

class QuizAttempt(QuizAttemptBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")},
    )

    quiz: "Quiz" = Relationship(back_populates="attempts")
    user: "User" = Relationship(back_populates="quiz_attempts")
    session: "QuizSession" = Relationship(back_populates="attempts")


class Quiz(QuizBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    difficulty_level: DifficultyLevel = Field(
        default=DifficultyLevel.ALL,
        sa_column=Column(SAEnum(DifficultyLevel, name="difficulty_level_enum")),
    )
    attempts: list["QuizAttempt"] = Relationship(
        back_populates="quiz", sa_relationship_kwargs={"cascade": "delete"}
    )

    chunk_id: uuid.UUID = Field(foreign_key="chunk.id")
    chunk: "Chunk" = Relationship(back_populates="quizzes")

    document_id: uuid.UUID = Field(foreign_key="document.id")
    document: "Document" = Relationship(back_populates="quizzes")

    course_id: uuid.UUID = Field(foreign_key="course.id")
    course: "Course" = Relationship(back_populates="quizzes")

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
