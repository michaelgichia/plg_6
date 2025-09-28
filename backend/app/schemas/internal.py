from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.public import DifficultyLevel


# Model for generic pagination and ordering
class PaginationParams(BaseModel):
    limit: int = Field(
        5, gt=0, le=50
    )  # Setting default limit to 5 as per your original code
    offset: int = Field(0, ge=0)
    # Ensure order_by columns exist in the Quiz/QuizSession models
    order_by: Literal["created_at", "difficulty_level", "quiz_text"] = "created_at"


# Model for filtering logic
class QuizFilterParams(PaginationParams):
    # This comes from the URL, e.g., /quizzes/{course_id}?difficulty=EASY
    difficulty: DifficultyLevel = DifficultyLevel.EASY
    # Optionally, allow ordering direction
    order_direction: Literal["asc", "desc"] = "desc"

def get_quiz_filters(
    limit: int = Field(5, gt=0, le=20),
    offset: int = Field(0, ge=0),
    difficulty: DifficultyLevel = DifficultyLevel.EASY,
    order_by: Literal["created_at", "difficulty_level", "quiz_text"] = "created_at",
    order_direction: Literal["asc", "desc"] = "desc",
) -> QuizFilterParams:
    """Dependency that collects and validates query parameters."""
    return QuizFilterParams(
        limit=limit,
        offset=offset,
        difficulty=difficulty,
        order_by=order_by,
        order_direction=order_direction,
    )
