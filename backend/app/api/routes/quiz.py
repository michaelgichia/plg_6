from random import shuffle

from fastapi import APIRouter
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.models.course import Course
from app.models.document import Document
from app.models.quizzes import Quiz
from app.schemas.public import QuizChoice, QuizPublic

router = APIRouter(prefix='/quizzes', tags=['quizzes'])

@router.get("/{quiz_id}", response_model=QuizPublic)
def get_quiz_for_user(session: SessionDep, current_user: CurrentUser,):
    """
    Retrieve quiz questions with shuffled answer choices.
    """

    statement = (
        select(Quiz)
        .join(Document)
        .where(Document.id == Quiz.document_id)
        .join(Course)
        .where(Course.owner_id == current_user.id)
    )
    # Fetch quizzes from your internal, secure model
    internal_quizzes = session.exec(statement).all()

    public_quizzes = []
    for q in internal_quizzes:
        # Create a list of all choices
        all_choices = [q.correct_answer, q.distraction_1, q.distraction_2, q.distraction_3]

        # Shuffle the list of choices
        shuffle(all_choices)

        choices_with_ids = [
            QuizChoice(id=chr(65 + i), text=choice)
            for i, choice in enumerate(all_choices)
        ]

        public_quizzes.append(
            QuizPublic(
                id=q.id, quiz_text=q.quiz_text, choices=choices_with_ids
            )
        )

    return QuizPublic(data=public_quizzes, count=len(public_quizzes))
