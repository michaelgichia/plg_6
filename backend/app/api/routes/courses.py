import logging
import uuid
from collections.abc import Sequence
from datetime import datetime, timezone
from random import shuffle
from typing import Annotated, Any, cast

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, text
from sqlalchemy.orm import QueryableAttribute, selectinload
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models.common import Message
from app.models.course import (
    Course,
    CourseCreate,
    CourseUpdate,
)
from app.models.document import Document
from app.models.embeddings import Chunk
from app.models.quizzes import Quiz
from app.schemas.internal import QuizFilterParams
from app.schemas.public import (
    CoursePublic,
    CoursesPublic,
    DocumentPublic,
    QuizChoice,
    QuizPublic,
    QuizzesPublic,
)


class CourseWithDocuments(CoursePublic):
    documents: Sequence[DocumentPublic] = []


router = APIRouter(prefix="/courses", tags=["courses"])


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@router.get("/", response_model=CoursesPublic)
def read_courses(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> CoursesPublic:
    """
    Retrieve courses with pagination and user-based security filtering.
    """

    course_statement = select(Course)
    count_statement = select(func.count()).select_from(Course)

    if not current_user.is_superuser:
        filter_clause = Course.owner_id == current_user.id
        course_statement = course_statement.where(filter_clause)
        count_statement = count_statement.where(filter_clause)

    total_count = session.exec(count_statement).one()
    course_statement = course_statement.offset(skip).limit(limit)
    courses: Sequence[Course] = session.exec(course_statement).all()

    return CoursesPublic(data=courses, count=total_count)


@router.get("/{id}", response_model=CourseWithDocuments)
def read_course(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get course by ID, including its documents.
    """
    documents_attr = cast(QueryableAttribute[Any], Course.documents)

    statement = (
        select(Course).where(Course.id == id).options(selectinload(documents_attr))
    )
    course = session.exec(statement).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if not current_user.is_superuser and (course.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    return course


@router.post("/", response_model=Course)
def create_course(
    *, session: SessionDep, current_user: CurrentUser, course_in: CourseCreate
) -> Course:
    """
    Create new course.
    """
    try:
        course = Course.model_validate(course_in, update={"owner_id": current_user.id})
        course.updated_at = datetime.now(timezone.utc)
        session.add(course)
        session.commit()
        session.refresh(course)

        return course

    except Exception as e:
        session.rollback()
        logger.error(f"Error in create_course: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{id}", response_model=CoursePublic)
def update_course(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    course_in: CourseUpdate,
) -> Any:
    """
    Update an course.
    """
    try:
        course = session.get(Course, id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        if not current_user.is_superuser and (course.owner_id != current_user.id):
            raise HTTPException(status_code=400, detail="Not enough permissions")

        course_data = course_in.model_dump(exclude_unset=True)

        for key, value in course_data.items():
            setattr(course, key, value)
        session.add(course)
        session.commit()
        session.refresh(course)
        return course

    except Exception as e:
        session.rollback()
        logger.error(f"Error in update_course: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{id}", response_model=Message)
def delete_course(
    *, session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """
    Delete an course.
    """
    course = session.get(Course, id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if not current_user.is_superuser and (course.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    session.delete(course)
    session.commit()
    return {"message": "Course deleted successfully"}


@router.get("/{id}/documents", response_model=list[dict[str, Any]])
async def list_documents(
    id: str, session: SessionDep, skip: int = 0, limit: int = 100
) -> list[dict[str, Any]]:
    """
    List documents for a specific course.
    """
    statement = (
        select(Document).where(Document.course_id == id).offset(skip).limit(limit)
    )
    documents = session.exec(statement).all()
    return [
        {
            "id": str(doc.id),
            "filename": doc.filename,
            "chunk_count": doc.chunk_count,
            "status": doc.status,
            "updated_at": doc.updated_at.isoformat(),
        }
        for doc in documents
    ]


@router.get("/{id}/quizzes", response_model=QuizzesPublic)
def list_quizzes(
    course_id: str,
    session: SessionDep,
    current_user: CurrentUser,
    filters: Annotated[QuizFilterParams, Depends()],
):
    """
    Fetches the first 10 Quiz objects related to a specific course,
    ensuring the course is owned by the current user.
    """

    statement = (
        select(Quiz)
        .join(Chunk, Quiz.chunk_id == Chunk.id)  # type: ignore
        .join(Document, Chunk.document_id == Document.id)  # type: ignore
        .join(Course, Document.course_id == Course.id)  # type: ignore
        .where(
            and_(
                Course.id == course_id,  # type: ignore
                Course.owner_id == current_user.id,  # type: ignore
                Quiz.difficulty_level == filters.difficulty,  # type: ignore
            )
        )
        .order_by(text(f"{filters.order_by} {filters.order_direction}"))
        .offset(filters.offset)
        .limit(filters.limit)
        .options(selectinload(Quiz.chunk))
    )
    quizzes = session.exec(statement).all()  # type: ignore

    public_quizzes = []
    for q in quizzes:
        result = dict(q)

        all_choices = [
            result["correct_answer"],
            result["distraction_1"],
            result["distraction_2"],
            result["distraction_3"],
        ]

        shuffle(all_choices)

        choices_with_ids = [
            QuizChoice(id=uuid.uuid4(), text=choice) for choice in all_choices
        ]

        public_quizzes.append(
            QuizPublic(
                id=result["id"], quiz_text=result["quiz_text"], choices=choices_with_ids
            )
        )

    return QuizzesPublic(data=public_quizzes, count=len(public_quizzes))
