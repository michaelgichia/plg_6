from random import shuffle

from fastapi import APIRouter
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.models.course import Course
from app.models.document import Document
from app.models.questions import Question
from app.schemas.public import QuestionChoice, QuestionPublic, QuestionsPublic

router = APIRouter(prefix='/quizzes', tags=['quizzes'])

@router.get("/{quiz_id}", response_model=QuestionsPublic)
def get_quiz_for_user(session: SessionDep, current_user: CurrentUser,):
    """
    Retrieve quiz questions with shuffled answer choices.
    """

    statement = (
        select(Question)
        .join(Document)
        .where(Document.id == Question.document_id)
        .join(Course)
        .where(Course.owner_id == current_user.id)
    )
    # Fetch questions from your internal, secure model
    internal_questions = session.exec(statement).all()

    public_questions = []
    for q in internal_questions:
        # Create a list of all choices
        all_choices = [q.correct_answer, q.distraction_1, q.distraction_2, q.distraction_3]

        # Shuffle the list of choices
        shuffle(all_choices)

        choices_with_ids = [
            QuestionChoice(id=chr(65 + i), text=choice)
            for i, choice in enumerate(all_choices)
        ]

        public_questions.append(
            QuestionPublic(
                id=q.id, question_text=q.question_text, choices=choices_with_ids
            )
        )

    return QuestionsPublic(data=public_questions, count=len(public_questions))
