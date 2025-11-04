import logging
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.models.quizzes import QuizSession
from app.schemas.public import (
    QuizAttemptPublic,
    QuizScoreSummary,
    QuizSessionPublicWithResults,
    QuizSubmissionBatch,
)
from app.tasks import (
    fetch_and_format_quizzes,
    score_quiz_batch,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


router = APIRouter(prefix="/quiz-sessions", tags=["quiz-sessions"])


@router.get("/{id}", response_model=QuizSessionPublicWithResults)
def get_quiz_session_optimized(
    id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Retrieves a QuizSession, eagerly loading attempts ONLY if completed,
    or just the session and quizzes if in progress.
    """
    try:
        statement = (
            select(QuizSession)
            .where(QuizSession.user_id == current_user.id, QuizSession.id == id)
            .options(selectinload(QuizSession.attempts))  # type: ignore
        )
        quiz_session = session.exec(statement).first()

        if not quiz_session:
            raise HTTPException(status_code=404, detail="Quiz session not found")

        if quiz_session.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Forbidden")

        quiz_uuids = [uuid.UUID(q_id) for q_id in quiz_session.quiz_ids_json]
        quizzes_to_show = fetch_and_format_quizzes(session, quiz_uuids)

        results_data = []
        if quiz_session.is_completed and quiz_session.attempts:
            results_data = [
                QuizAttemptPublic.model_validate(a) for a in quiz_session.attempts
            ]

        return QuizSessionPublicWithResults(
            **quiz_session.model_dump(),
            quizzes=quizzes_to_show.data,
            results=results_data,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_quiz_session_optimized: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{id}/score", response_model=QuizScoreSummary)
def submit_and_score_quiz_batch(
    session_id: uuid.UUID,
    submission_batch: QuizSubmissionBatch,
    session: SessionDep,
    current_user: CurrentUser,
):
    """
    API endpoint to receive a batch of user answers and score a specific
    QuizSession identified by the session_id.
    """
    try:
        statement = select(
            QuizSession,
        ).where(
            QuizSession.user_id == current_user.id,
            QuizSession.id == session_id,
        )
        quiz_session = session.exec(statement).first()

        if not quiz_session:
            raise HTTPException(
                status_code=404, detail="Quiz session not found for the current user"
            )

        if quiz_session.is_completed:
            raise HTTPException(
                status_code=400, detail="Quiz session is already completed"
            )

        score_summary = score_quiz_batch(
            session_id=session_id,
            db=session,
            submission_batch=submission_batch,
            current_user=current_user,
        )
        return score_summary

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Error in submit_and_score_quiz_batch: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
