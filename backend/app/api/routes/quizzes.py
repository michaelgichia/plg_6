import logging
import uuid
from random import shuffle
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, desc, select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, SessionDep
from app.models.course import Course
from app.models.document import Document
from app.models.embeddings import Chunk
from app.models.quizzes import Quiz, QuizSession
from app.schemas.internal import QuizFilterParams
from app.schemas.public import (
    QuizChoice,
    QuizPublic,
    QuizScoreSummary,
    QuizSessionPublic,
    QuizSessionsList,
    QuizSubmissionBatch,
    QuizzesPublic,
)
from app.tasks import (
    fetch_and_format_quizzes,
    get_new_quizzes_for_course,
    score_quiz_batch,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


router = APIRouter(prefix="/quizzes", tags=["quizzes"])


@router.get("/{course_id}", response_model=QuizzesPublic)
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
        .join(Chunk, Quiz.chunk_id == Chunk.id)
        .join(Document, Chunk.document_id == Document.id)
        .join(Course, Document.course_id == Course.id)
        .where(
            and_(
                Course.id == course_id,
                Course.owner_id == current_user.id,
                Quiz.difficulty_level == filters.difficulty,
            )
        )
        .order_by(text(f"{filters.order_by} {filters.order_direction}"))
        .offset(filters.offset)
        .limit(filters.limit)
        .options(selectinload(Quiz.chunk))
        .limit(5)
    )
    quizzes = session.exec(statement).all()

    public_quizzes = []
    for q in quizzes:
        result = dict(q[0])
        logger.info(f"Result[1] {result}")

        all_choices = [
            result["correct_answer"],
            result["distraction_1"],
            result["distraction_2"],
            result["distraction_3"],
        ]

        shuffle(all_choices)
        logger.info(f"All choices: {all_choices}")

        choices_with_ids = [
            QuizChoice(id=str(uuid.uuid4()), text=choice) for choice in all_choices
        ]

        logger.info(f"Choices with IDs: {choices_with_ids}")

        public_quizzes.append(
            QuizPublic(
                id=result["id"], quiz_text=result["quiz_text"], choices=choices_with_ids
            )
        )

    return QuizzesPublic(data=public_quizzes, count=len(public_quizzes))


@router.post("/{course_id}/score", response_model=QuizScoreSummary)
def submit_and_score_quiz_batch(
    course_id: uuid.UUID,
    submission_batch: QuizSubmissionBatch,
    session: SessionDep,
    current_user: CurrentUser,
):
    """
    API endpoint to receive a batch of user answers and return a summary
    score.
    """

    score_summary = score_quiz_batch(
        course_id=course_id,
        db=session,
        submission_batch=submission_batch,
        current_user=current_user,
    )

    return score_summary


@router.get("/incomplete/{course_id}", response_model=QuizSessionsList)
def get_incomplete_sessions(
    course_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
):
    """
    Fetch all incomplete quiz sessions for a given course and user.
    """
    statement = (
        select(QuizSession)
        .where(
            QuizSession.user_id == current_user.id,
            QuizSession.course_id == course_id,
            QuizSession.is_completed.is_(False),
        )
        .order_by(desc(QuizSession.updated_at))
    )

    try:
        raw_results = session.exec(statement).all()
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
    "/start/{course_id}", response_model=tuple[QuizSessionPublic, QuizzesPublic]
)
def start_new_quiz_session(
    course_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    filters: Annotated[QuizFilterParams, Depends()],
):
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
                QuizSession.is_completed == False,
            )
            .limit(1)
        )

        if session.exec(active_session_check).first():
            raise HTTPException(
                status_code=400,
                detail="An incomplete quiz session already exists. Please resume or finish it first.",
            )

        initial_quizzes = get_new_quizzes_for_course(
            session, course_id, current_user, filters.difficulty
        )

        if not initial_quizzes:
            raise HTTPException(
                status_code=404,
                detail="No quizzes found for this course and difficulty.",
            )

        logger.info(f"Initial quizzes: {initial_quizzes}")

        initial_quiz_ids = [str(q.id) for q in initial_quizzes]

        logger.info(f"Initial quiz IDs: {initial_quiz_ids}")

        # 3. Create and Commit New Session
        new_session = QuizSession(
            user_id=current_user.id,
            course_id=course_id,
            total_submitted=0,
            total_correct=0,
            is_completed=False,
            quiz_ids_json=initial_quiz_ids,
        )

        logger.info(f"New session: {new_session}")

        session.add(new_session)
        session.commit()
        session.refresh(new_session)

        quizzes_to_show = fetch_and_format_quizzes(session, initial_quiz_ids)

        return new_session, quizzes_to_show
    except Exception as e:
        logger.error(f"Error in start_new_quiz_session: {e}")
        raise HTTPException(status_code=400, detail=str(e))
