import logging
import uuid

from fastapi import APIRouter

from app.api.deps import CurrentUser, SessionDep
from app.schemas.public import (
    QuizScoreSummary,
    QuizSubmissionBatch,
)
from app.tasks import (
    score_quiz_batch,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


router = APIRouter(prefix="/quiz-sessions", tags=["quiz-sessions"])


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
