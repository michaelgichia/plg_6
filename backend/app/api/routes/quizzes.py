import uuid
from random import shuffle

from fastapi import APIRouter
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.models.course import Course
from app.models.document import Document
from app.models.embeddings import Chunk
from app.models.quizzes import Quiz
from app.schemas.public import QuizChoice, QuizPublic, QuizzesPublic

router = APIRouter(prefix="/quizzes", tags=["quizzes"])

@router.get("/{course_id}", response_model=QuizzesPublic)
def list_quizzes(course_id: str, session: SessionDep, current_user: CurrentUser):
    """
    Retrieve quizzes for a course.
    """
    statement = (
        select(Quiz)
        .join(Chunk, Quiz.chunk_id == Chunk.id)
        .join(Document, Chunk.document_id == Document.id)
        .join(Course, Document.course_id == Course.id)
        .where(Course.id == course_id)
        .where(Course.owner_id == current_user.id)
        .options(selectinload(Quiz.chunk))
    )
    quizzes = session.exec(statement).all()
    public_quizzes = []
    for q in quizzes:
        # Create a list of all choices
        all_choices = [q.correct_answer, q.distraction_1, q.distraction_2, q.distraction_3]

        # Shuffle the list of choices
        shuffle(all_choices)

        choices_with_ids = [
            QuizChoice(id=str(uuid.uuid4()), text=choice)
            for i, choice in enumerate(all_choices)
        ]

        public_quizzes.append(
            QuizPublic(
                id=q.id, quiz_text=q.quiz_text, choices=choices_with_ids
            )
        )


    return QuizzesPublic(data=public_quizzes, count=len(public_quizzes))
