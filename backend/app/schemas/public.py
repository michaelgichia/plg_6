"""
Centralized Pydantic/response schemas for Course and Document to avoid circular imports.
"""

import uuid
from collections.abc import Sequence
from datetime import datetime
from enum import Enum, StrEnum

from sqlmodel import Field, SQLModel

from app.models.course import Course


class DocumentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class DocumentPublic(SQLModel):
    id: uuid.UUID
    course_id: uuid.UUID
    updated_at: datetime
    created_at: datetime
    status: DocumentStatus


class CoursePublic(SQLModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    description: str | None = None
    documents: Sequence["DocumentPublic"]
    created_at: datetime
    updated_at: datetime


class CoursesPublic(SQLModel):
    data: Sequence["Course"]
    count: int


class DifficultyLevel(StrEnum):
    # Quiz difficulty levels
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"
    ALL = "all"


class QuizChoice(SQLModel):
    id: uuid.UUID
    text: str


class QuizPublic(SQLModel):
    id: uuid.UUID
    quiz_text: str
    choices: Sequence[QuizChoice]


class QuizzesPublic(SQLModel):
    data: Sequence["QuizPublic"]
    count: int


class ChunkPublic(SQLModel):
    id: uuid.UUID
    document_id: uuid.UUID
    text_content: str
    quizzes: Sequence["QuizPublic"]


class ChunksPublic(SQLModel):
    data: Sequence["ChunkPublic"]
    count: int


class SingleQuizSubmission(SQLModel):
    """The user's answer for one question."""

    quiz_id: uuid.UUID
    selected_answer_text: str


class QuizSubmissionBatch(SQLModel):
    """Container for multiple quiz submissions."""

    submissions: Sequence[SingleQuizSubmission]
    total_time_seconds: float = Field(default=0.0)


class SingleQuizScore(SQLModel):
    """The result for a single question."""

    quiz_id: uuid.UUID
    is_correct: bool
    correct_answer_text: str
    feedback: str


class QuizScoreSummary(SQLModel):
    """The overall score for the batch of submissions."""

    total_submitted: int
    total_correct: int
    score_percentage: float
    results: Sequence[SingleQuizScore]


class QuizStats(SQLModel):
    best_total_submitted: int
    best_total_correct: int
    best_score_percentage: float
    average_score: float
    attempts: float


class QuizSessionPublic(SQLModel):
    """
    Public schema for a QuizSession, used to show the user their incomplete
    or completed quiz attempts.
    """

    id: uuid.UUID
    course_id: uuid.UUID

    total_submitted: int
    total_correct: int
    score_percentage: float | None = None
    is_completed: bool

    created_at: datetime
    updated_at: datetime


class QuizSessionsList(SQLModel):
    data: Sequence[QuizSessionPublic]
