import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.models.quizzes import QuizSession
from app.schemas.internal import QuizFilterParams
from app.schemas.public import (
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
            QuizSession.user_id == current_user.id,  # type: ignore
            QuizSession.course_id == course_id,  # type: ignore
            QuizSession.is_completed.is_(False),  # type: ignore
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
                QuizSession.user_id == current_user.id,  # type: ignore
                QuizSession.course_id == course_id,  # type: ignore
                QuizSession.is_completed == False,  # type: ignore  # noqa: E712
            )
            .limit(1)
        )

        if session.exec(active_session_check).first():  # type: ignore
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

        initial_quiz_ids = [q.id for q in initial_quizzes]

        new_session = QuizSession(
            user_id=current_user.id,
            course_id=course_id,
            total_submitted=0,
            total_correct=0,
            is_completed=False,
            quiz_ids_json=initial_quiz_ids,
        )

        session.add(new_session)
        session.commit()
        session.refresh(new_session)

        quizzes_to_show = fetch_and_format_quizzes(session, initial_quiz_ids)

        return new_session, quizzes_to_show
    except Exception as e:
        logger.error(f"Error in start_new_quiz_session: {e}")
        raise HTTPException(status_code=400, detail=str(e))
