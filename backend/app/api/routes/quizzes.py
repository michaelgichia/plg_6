import uuid
from random import shuffle
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, desc, select, text
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, SessionDep
from app.models.course import Course
from app.models.document import Document
from app.models.embeddings import Chunk
from app.models.quizzes import Quiz, QuizSession
from app.schemas.internal import QuizFilterParams, get_quiz_filters
from app.schemas.public import (
    QuizChoice,
    QuizPublic,
    QuizScoreSummary,
    QuizSessionPublic,
    QuizSubmissionBatch,
    QuizzesPublic,
)
from app.tasks import (
    fetch_and_format_quizzes,
    get_new_quizzes_for_course,
    score_quiz_batch,
)

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


@router.get("/{course_id}", response_model=QuizzesPublic)
def list_quizzes(
    course_id: str,
    session: SessionDep,
    current_user: CurrentUser,
    filters: Annotated[QuizFilterParams, Depends(get_quiz_filters)],
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


@router.get("/incomplete/{course_id}", response_model=list[QuizSessionPublic])
def get_incomplete_sessions(
    course_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
):
    """
    Fetches all incomplete (resumable) quiz sessions for a specific course
    and the current user.
    """

    statement = (
        select(QuizSession)
        .where(
            QuizSession.user_id == current_user.id,
            QuizSession.course_id == course_id,
            QuizSession.is_completed == False,  # noqa: E712
        )
        .order_by(desc(QuizSession.updated_at))
    )

    sessions = session.exec(statement).all()

    return sessions


@router.post(
    "/start/{course_id}", response_model=tuple[QuizSessionPublic, QuizzesPublic]
)
def start_new_quiz_session(
    course_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    filters: Annotated[QuizFilterParams, Depends(get_quiz_filters)],
):
    """
    Creates a new, immutable QuizSession, selects the initial set of questions,
    and returns the session details and the first batch of questions.
    """
    # 1. Check for existing active session (Prevent users from having multiple active sessions)
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
        # Raise an error or redirect to the incomplete sessions list
        raise HTTPException(
            status_code=400,
            detail="An incomplete quiz session already exists. Please resume or finish it first.",
        )

    # 2. Get Initial Quizzes (Helper function required)
    # This must contain the logic from your original list_quizzes function
    initial_quizzes = get_new_quizzes_for_course(
        session, course_id, current_user, filters.difficulty
    )

    if not initial_quizzes:
        raise HTTPException(
            status_code=404, detail="No quizzes found for this course and difficulty."
        )

    initial_quiz_ids = [q.id for q in initial_quizzes]

    # 3. Create and Commit New Session
    new_session = QuizSession(
        user_id=current_user.id,
        course_id=course_id,
        total_submitted=0,
        total_correct=0,
        is_completed=False,
        quiz_ids_json=initial_quiz_ids,  # Save the blueprint
    )
    session.add(new_session)
    session.commit()
    session.refresh(new_session)  # Refresh to get final DB values (like timestamps)

    # 4. Format and Return
    # Return the first 5 questions formatted for the user
    quizzes_to_show = fetch_and_format_quizzes(session, initial_quiz_ids)

    # Note: You need a QuizSessionPublic schema for the return type
    return new_session, quizzes_to_show
