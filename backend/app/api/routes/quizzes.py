import uuid
from random import shuffle

from fastapi import APIRouter
from sqlalchemy import and_
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.models.course import Course
from app.models.document import Document
from app.models.embeddings import Chunk
from app.models.quizzes import Quiz
from app.schemas.public import (
    DifficultyLevel,
    QuizChoice,
    QuizPublic,
    QuizScoreSummary,
    QuizSubmissionBatch,
    QuizzesPublic,
)
from app.tasks import score_quiz_batch

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


@router.get("/{course_id}", response_model=QuizzesPublic)
def list_quizzes(
    course_id: str,
    session: SessionDep,
    current_user: CurrentUser,
    difficulty: DifficultyLevel = DifficultyLevel.EASY,
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
                Quiz.difficulty_level == difficulty,
            )
        )
        .options(selectinload(Quiz.chunk))
        .limit(5)
    )
    quizzes = session.exec(statement).all()

    public_quizzes = []
    for q in quizzes:
        # Create a list of all choices
        all_choices = [
            q.correct_answer,
            q.distraction_1,
            q.distraction_2,
            q.distraction_3,
        ]

        # Shuffle the list of choices
        shuffle(all_choices)

        choices_with_ids = [
            QuizChoice(id=str(uuid.uuid4()), text=choice)
            for i, choice in enumerate(all_choices)
        ]

        public_quizzes.append(
            QuizPublic(id=q.id, quiz_text=q.quiz_text, choices=choices_with_ids)
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
