"""
Centralized Pydantic/response schemas for Course and Document to avoid circular imports.
"""

import uuid
from datetime import datetime

from sqlmodel import SQLModel


class DocumentPublic(SQLModel):
    id: uuid.UUID
    filename: str
    description: str | None = None
    course_id: uuid.UUID
    updated_at: datetime
    created_at: datetime
    status: str  # Use str for status to avoid Enum import cycles


class CoursePublic(SQLModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    description: str | None = None
    created_at: datetime
    updated_at: datetime
    documents: list["DocumentPublic"]


class CoursesPublic(SQLModel):
    data: list["CoursePublic"]
    count: int

# Public model for API responses
class ChatPublic(SQLModel):
  id: uuid.UUID
  message: str
  course_id: uuid.UUID
  is_system: bool
  created_at: datetime
  updated_at: datetime