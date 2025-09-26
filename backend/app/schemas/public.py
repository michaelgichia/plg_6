"""
Centralized Pydantic/response schemas for Course and Document to avoid circular imports.
"""

import uuid
from datetime import datetime
from enum import Enum, StrEnum

from sqlmodel import SQLModel


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
  documents: list["DocumentPublic"]
  created_at: datetime
  updated_at: datetime

class CoursesPublic(SQLModel):
    data: list["CoursePublic"]
    count: int

class DifficultyLevel(StrEnum):
    # Quiz difficulty levels
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"
    ALL = "all"

class QuizChoice(SQLModel):
    id: str
    text: str

class QuizPublic(SQLModel):
    id: uuid.UUID
    quiz_text: str
    choices: list[QuizChoice]

class QuizzesPublic(SQLModel):
    data: list["QuizPublic"]
    count: int

class ChunkPublic(SQLModel):
    id: uuid.UUID
    document_id: uuid.UUID
    text_content: str
    quizzes: list["QuizPublic"]

class ChunksPublic(SQLModel):
    data: list["ChunkPublic"]
    count: int
