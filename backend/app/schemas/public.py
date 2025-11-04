"""
Centralized Pydantic/response schemas for all entities (Course, Document, Quiz, Session).
This file should only contain Pydantic models (BaseModel/SQLModel for schema use).
"""

import uuid
from collections.abc import Sequence
from datetime import datetime
from enum import Enum, StrEnum

from pydantic import BaseModel, Field

# ----------------------------------------------------------------------
# Base Configuration Class (Apply once)
# ----------------------------------------------------------------------


class PydanticBase(BaseModel):
    """Base class for all public response schemas."""

    model_config = {
        "from_attributes": True,  # Enables ORM mode: allows assignment from attributes
    }


# ----------------------------------------------------------------------
# Document and Course Schemas
# ----------------------------------------------------------------------


class DocumentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class DocumentPublic(PydanticBase):
    id: uuid.UUID
    course_id: uuid.UUID
    updated_at: datetime
    created_at: datetime
    status: DocumentStatus
    filename: str
    title: str


class CoursePublic(PydanticBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    description: str | None = None
    documents: Sequence[DocumentPublic]
    created_at: datetime
    updated_at: datetime


class CoursesPublic(BaseModel):
    data: Sequence[CoursePublic]
    count: int


# ----------------------------------------------------------------------
# Quiz and Chunk Schemas
# ----------------------------------------------------------------------


class DifficultyLevel(StrEnum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"
    ALL = "all"


class QuizChoice(PydanticBase):
    id: uuid.UUID
    text: str


class QuizPublic(PydanticBase):
    id: uuid.UUID
    quiz_text: str
    choices: list[QuizChoice]


class QuizzesPublic(BaseModel):
    data: list[QuizPublic]
    count: int


class ChunkPublic(PydanticBase):
    id: uuid.UUID
    document_id: uuid.UUID
    text_content: str
    # Nested quizzes
    quizzes: list[QuizPublic]


class ChunksPublic(BaseModel):
    data: list[ChunkPublic]
    count: int


# ----------------------------------------------------------------------
# Quiz Submission and Scoring Schemas
# ----------------------------------------------------------------------


class SingleQuizSubmission(PydanticBase):
    """The user's answer for one question."""

    quiz_id: uuid.UUID
    selected_answer_text: str


class QuizSubmissionBatch(PydanticBase):
    """Container for multiple quiz submissions."""

    submissions: list[SingleQuizSubmission]
    total_time_seconds: float = Field(default=0.0)


class SingleQuizScore(PydanticBase):
    """The result for a single question."""

    quiz_id: uuid.UUID
    is_correct: bool
    correct_answer_text: str
    feedback: str


class QuizScoreSummary(PydanticBase):
    """The overall score for the batch of submissions."""

    total_submitted: int
    total_correct: int
    score_percentage: float
    results: list[SingleQuizScore]


# ----------------------------------------------------------------------
# Quiz Session and Stats Schemas
# ----------------------------------------------------------------------


class QuizStats(PydanticBase):
    best_total_submitted: int
    best_total_correct: int
    best_score_percentage: float
    average_score: float
    attempts: int


class QuizSessionPublic(PydanticBase):
    """Public schema for a QuizSession."""

    id: uuid.UUID
    course_id: uuid.UUID

    total_submitted: int
    total_correct: int
    score_percentage: float | None = None
    is_completed: bool

    created_at: datetime
    updated_at: datetime


class QuizSessionsList(BaseModel):
    data: list[QuizSessionPublic]


class QuizAttemptPublic(PydanticBase):
    """
    Public schema for a single QuizAttempt record.
    Used to return the full history/results when a session is complete.
    """

    quiz_id: uuid.UUID
    selected_answer_text: str
    is_correct: bool
    correct_answer_text: str
    time_spent_seconds: float
    created_at: datetime
    feedback: str | None = None


class QuizSessionPublicWithQuizzes(QuizSessionPublic):
    quizzes: list[QuizPublic] = Field(default_factory=list)


class QuizSessionPublicWithResults(QuizSessionPublicWithQuizzes):
    """
    Expanded schema that includes quiz attempts (results)
    when the session is marked as completed.
    """

    results: list[QuizAttemptPublic] = Field(default_factory=list)


class ChatPublic(PydanticBase):
    id: uuid.UUID
    message: str
    course_id: uuid.UUID
    is_system: bool
    created_at: datetime
    updated_at: datetime


class ChatMessage(BaseModel):
    message: str
    continue_response: bool = False  # Flag to continue previous response

    class Config:
        json_schema_extra = {
            "example": {
                "message": "What is the main topic of the course?",
                "continue_response": False,
            }
        }
