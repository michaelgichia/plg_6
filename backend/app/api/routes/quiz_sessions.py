import logging
import uuid

from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.models.quizzes import QuizSession
from app.schemas.public import (
    QuizScoreSummary,
    QuizSessionPublicWithQuizzes,
    QuizSubmissionBatch,
)
from app.tasks import (
    score_quiz_batch,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


router = APIRouter(prefix="/quiz-sessions", tags=["quiz-sessions"])


@router.get("/", response_model=QuizSessionPublicWithQuizzes)
def get_quiz_session(
    session_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
):
    """
    API endpoint to retrieve a specific QuizSession identified by the session_id.
    """
    try:
        statement = (
            select(QuizSession)
            .where(QuizSession.id == session_id)
            .options(
                selectinload(QuizSession.quizzes)  # type: ignore
            )
        )
        quiz_session = session.exec(statement).first()
        if not quiz_session:
            raise HTTPException(status_code=404, detail="Quiz session not found")
        if quiz_session.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Forbidden")

        return quiz_session
    except Exception as e:
        logger.error(f"Error in get_quiz_session: {e}")
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

    score_summary = score_quiz_batch(
        session_id=session_id,
        db=session,
        submission_batch=submission_batch,
        current_user=current_user,
    )

    return score_summary
