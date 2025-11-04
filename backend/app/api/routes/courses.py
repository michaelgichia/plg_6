import logging
import uuid
from collections.abc import Sequence
from datetime import datetime, timezone
from http import HTTPStatus
from random import shuffle
from typing import Annotated, Any, cast

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import QueryableAttribute, selectinload
from sqlalchemy.sql import and_, text
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.llm_clients.openai_client import INDEX_NAME
from app.models.common import Message
from app.models.course import (
    Course,
    CourseCreate,
    CourseUpdate,
    QAItem,
)
from app.models.document import Document
from app.models.embeddings import Chunk
from app.models.quizzes import Quiz, QuizSession
from app.prompts.flashcards import PROMPT
from app.schemas.internal import QuizFilterParams
from app.schemas.public import (
    CoursePublic,
    CoursesPublic,
    DocumentPublic,
    QuizChoice,
    QuizPublic,
    QuizSessionPublic,
    QuizSessionsList,
    QuizStats,
    QuizzesPublic,
)
from app.services.courses import generate_flashcards_from_text, get_retrieved_docs
from app.tasks import (
    fetch_and_format_quizzes,
    select_quizzes_by_course_criteria,
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
    courses_public = [CoursePublic.model_validate(course) for course in courses]

    return CoursesPublic(data=courses_public, count=total_count)


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
) -> list[dict[str, Any]]:  # type: ignore
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


@router.get("/{id}/attempts", response_model=QuizSessionsList)
def get_attempts_sessions(
    id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
):
    """
    Fetch all incomplete quiz sessions for a given course and user.
    """
    statement = (
        select(QuizSession)
        .where(
            QuizSession.user_id == current_user.id,  # type: ignore
            QuizSession.course_id == id,  # type: ignore
        )
        .order_by(desc(QuizSession.updated_at))  # type: ignore
    )

    try:
        raw_results = session.exec(statement).all()  # type: ignore
        sessions: list[QuizSession] = [
            r[0] if not isinstance(r, QuizSession) else r for r in raw_results
        ]

        if not sessions:
            return QuizSessionsList(data=[])

        public_sessions = [QuizSessionPublic.model_validate(s) for s in sessions]
        return QuizSessionsList(data=public_sessions)

    except SQLAlchemyError as e:
        logger.error("Database error fetching incomplete sessions", exc_info=e)
        raise HTTPException(status_code=500, detail="Database error")


@router.post(
    "/{course_id}/quiz/start", response_model=tuple[QuizSessionPublic, QuizzesPublic]
)
def start_new_quiz_session(
    course_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    filters: Annotated[QuizFilterParams, Depends()],
    limit: int = 5,
) -> Any:
    """
    Creates a new, immutable QuizSession, selects the initial set of questions,
    and returns the session details and the first batch of questions.
    """
    try:
        active_session_check = (
            select(QuizSession)
            .where(
                QuizSession.user_id == current_user.id,
                QuizSession.course_id == course_id,
                QuizSession.is_completed == False,  # noqa: E712
            )
            .limit(1)
        )

        if session.exec(active_session_check).first():
            raise HTTPException(
                status_code=400,
                detail="An incomplete quiz session already exists. Please resume or finish it first.",
            )

        initial_quizzes = select_quizzes_by_course_criteria(
            session, course_id, current_user, filters.difficulty, limit
        )

        if not initial_quizzes:
            raise HTTPException(
                status_code=404,
                detail="No quizzes found for this course and difficulty.",
            )

        initial_quiz_ids = [q.id for q in initial_quizzes]

        new_session = QuizSession(
            user_id=current_user.id,
            course_id=course_id,
            total_submitted=0,
            total_correct=0,
            is_completed=False,
            quiz_ids_json=[str(q_id) for q_id in initial_quiz_ids],
        )

        session.add(new_session)
        session.commit()
        session.refresh(new_session)

        quizzes_to_show = fetch_and_format_quizzes(session, initial_quiz_ids)

        return new_session, quizzes_to_show
    except HTTPException:
        # Reraise FastAPI HTTPExceptions
        raise
    except Exception as e:
        logger.error(f"Error in start_new_quiz_session: {e}")
        # Rollback in case of database error
        session.rollback()
        raise HTTPException(status_code=500, detail="Internal server error occurred.")


@router.get("/{course_id}/stats", response_model=QuizStats)
def get_quiz_stats(
    course_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> QuizStats:
    """
    Fetches course statistics: overall average, total attempts, and the full
    details of the single best-scoring quiz session.
    """

    # Base filter condition
    user_course_filter = and_(
        QuizSession.user_id == current_user.id,  # type: ignore
        QuizSession.course_id == course_id,  # type: ignore
        QuizSession.is_completed == True,  # noqa: E712 # type: ignore
    )

    best_session_statement = (
        select(
            QuizSession.total_submitted,
            QuizSession.total_correct,
            QuizSession.score_percentage,
        )
        .where(user_course_filter)
        .order_by(desc(QuizSession.score_percentage))  # type: ignore
        .limit(1)
    )

    best_session_stats = session.exec(best_session_statement).one_or_none()

    overall_stats_statement = select(
        func.count(QuizSession.id).label("attempts"),
        func.avg(QuizSession.score_percentage).label("average_score"),
    ).where(user_course_filter)

    overall_results = session.exec(overall_stats_statement).one_or_none()

    if not overall_results or overall_results[0] == 0:
        return QuizStats(
            best_total_submitted=0,
            best_total_correct=0,
            best_score_percentage=0.0,
            average_score=0.0,
            attempts=0,
        )

    attempts, average_score = overall_results

    if best_session_stats:
        (
            best_total_submitted,
            best_total_correct,
            best_score_percentage,
        ) = best_session_stats
    else:
        best_total_submitted = 0
        best_total_correct = 0
        best_score_percentage = 0.0

    return QuizStats(
        best_total_submitted=best_total_submitted,
        best_total_correct=best_total_correct,
        best_score_percentage=round(best_score_percentage or 0.0),
        average_score=round(average_score or 0.0),
        attempts=attempts,
    )


@router.get("/{id}/flashcards", response_model=list[QAItem])
async def generate_flashcards_by_course_id(
    id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> list[QAItem]:
    """
    Generate flashcards for the most recent document associated with a course.
    """

    statement = (
        select(Course).where(Course.id == id).options(selectinload(Course.owner))
    )
    course = session.exec(statement).first()

    if not course:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Course not found")

    if not current_user.is_superuser and course.owner_id != current_user.id:
        raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail="Access denied")

    latest_doc_stmt = (
        select(Document)
        .where(Document.course_id == id)
        .order_by(Document.created_at.desc())
        .limit(1)
    )
    document = session.exec(latest_doc_stmt).first()

    if not document:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND,
            detail="No documents found for this course.",
        )

    try:
        retrieved_texts = await get_retrieved_docs(
            document_id=document.id, index_name=INDEX_NAME, query=PROMPT
        )
    except ConnectionError as exc:
        raise HTTPException(status_code=HTTPStatus.SERVICE_UNAVAILABLE, detail=str(exc))

    if not retrieved_texts:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND,
            detail="No relevant content found for flashcard generation.",
        )

    flashcards = await generate_flashcards_from_text(retrieved_texts)

    return flashcards
