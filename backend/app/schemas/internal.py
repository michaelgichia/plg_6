from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.public import DifficultyLevel


class PaginationParams(BaseModel):
    limit: int = Field(5, gt=0, le=50)
    offset: int = Field(0, ge=0)
    order_by: Literal["created_at", "difficulty_level", "quiz_text"] = "created_at"


class QuizFilterParams(PaginationParams):
    difficulty: DifficultyLevel = DifficultyLevel.EASY
    order_direction: Literal["asc", "desc"] = "desc"
