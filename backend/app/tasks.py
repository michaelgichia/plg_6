import json
import logging
import random
import uuid

from fastapi import HTTPException
from sqlalchemy import and_
from sqlalchemy.orm import load_only, selectinload
from sqlmodel import Session, select

from app.api.deps import CurrentUser, SessionDep
from app.models.course import Course
from app.models.document import Document
from app.models.embeddings import Chunk
from app.models.quizzes import Quiz, QuizAttempt, QuizSession
from app.prompts.quizzes import get_quiz_prompt
from app.schemas.public import (
    DifficultyLevel,
    QuizChoice,
    QuizPublic,
    QuizScoreSummary,
    QuizSubmissionBatch,
    QuizzesPublic,
    SingleQuizScore,
)
from app.utils import clean_string

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def generate_quizzes_task(document_id: uuid.UUID, session: SessionDep):
    """
    Background task to generate a bank of quiz questions from a document.
    """
    try:
        statement = select(Chunk).where(Chunk.document_id == document_id)
        chunks = session.exec(statement).all()

        if not chunks:
            logger.warning(f"No chunks found for document {document_id}")
            return

        concatenated_text = " ".join([chunk.text_content for chunk in chunks])

        for difficulty_level in [
            DifficultyLevel.EASY,
            DifficultyLevel.MEDIUM,
            DifficultyLevel.HARD,
        ]:
            prompt = f"""
            Generate a set of multiple-choice quizzes based on the following text.
            Each quiz should be at '{difficulty_level}' difficulty.

            Each quiz object must include:
              - quiz: string (the quiz question)
              - correct_answer: string
              - distraction_1: string
              - distraction_2: string
              - distraction_3: string
              - topic: string (short topic or category)

            Return only a JSON array of quiz objects.
            Text:
            {concatenated_text}
            """

            response = await get_quiz_prompt(prompt)
            logger.info(f"This is the response: {response}")

            try:
                raw_content = response.choices[0].message.content
                logger.info(f"This is the raw_content: {raw_content}")
                parsed = json.loads(raw_content)
                quiz_list = parsed.get("quizzes", [])
                if not isinstance(quiz_list, list):
                    logger.error(
                        f"LLM did not return 'quizzes' as a list for document {document_id}. Got: {type(quiz_list)}"
                    )
                    continue
            except json.JSONDecodeError as e:
                logger.error(
                    f"Failed to parse LLM response for document {document_id}: {e}. Raw content: {raw_content[:200]}..."
                )
                continue

            for q_data in quiz_list:
                if not isinstance(q_data, dict):
                    logger.warning(f"Skipping malformed item in quiz list: {q_data}")
                    continue

                new_quiz = Quiz(
                    chunk_id=chunks[0].id,
                    difficulty_level=difficulty_level,
                    quiz_text=q_data["quiz"],
                    correct_answer=clean_string(q_data["correct_answer"]),
                    distraction_1=clean_string(q_data["distraction_1"]),
                    distraction_2=clean_string(q_data["distraction_2"]),
                    distraction_3=clean_string(q_data["distraction_3"]),
                    topic=clean_string(q_data["topic"]),
                )
                session.add(new_quiz)

            session.commit()

    except Exception as e:
        logger.error(f"Error generating quizzes for document {document_id}: {e}")


def score_quiz_batch(
    db: Session,
    session_id: uuid.UUID,
    submission_batch: QuizSubmissionBatch,
    current_user: CurrentUser,
) -> QuizScoreSummary:
    try:
        if not submission_batch.submissions:
            return QuizScoreSummary(
                total_submitted=0, total_correct=0, score_percentage=0.0, results=[]
            )

        quiz_session = db.get(QuizSession, session_id)

        if not quiz_session:
            raise HTTPException(status_code=404, detail="QuizSession not found.")

        if quiz_session.user_id != current_user.id:
            raise HTTPException(
                status_code=403, detail="Permission denied to score this session."
            )

        submitted_ids = [sub.quiz_id for sub in submission_batch.submissions]
        submitted_answers: dict[uuid.UUID, str] = {
            sub.quiz_id: sub.selected_answer_text
            for sub in submission_batch.submissions
        }

        statement = (
            select(Quiz)
            .where(Quiz.id.in_(submitted_ids))
            .options(load_only(Quiz.id, Quiz.correct_answer))
        )

        correct_answers_map: dict[uuid.UUID, str] = {
            q.id: q.correct_answer.strip() for q in db.exec(statement).all()
        }

        missing_ids = set(submitted_ids) - set(correct_answers_map.keys())

        if missing_ids:
            raise HTTPException(
                status_code=404,
                detail=f"One or more quiz IDs were not found in the database: {list(missing_ids)}",
            )

        results: list[SingleQuizScore] = []
        total_correct = 0
        total_submitted = len(submission_batch.submissions)

        for submitted_quiz_id, submitted_text in submitted_answers.items():
            correct_text = correct_answers_map[submitted_quiz_id]

            if not submitted_text:
                raise HTTPException(
                    status_code=400,
                    detail=f"Selected answer text is missing for quiz ID {submitted_quiz_id}.",
                )

            is_correct = clean_string(submitted_text) == clean_string(correct_text)

            if is_correct:
                total_correct += 1
                feedback = "Correct! Well done."
            else:
                feedback = "Incorrect. Review the material."

            results.append(
                SingleQuizScore(
                    quiz_id=submitted_quiz_id,
                    is_correct=is_correct,
                    correct_answer_text=correct_text,
                    feedback=feedback,
                )
            )

            attempt = QuizAttempt(
                session_id=session_id,
                user_id=current_user.id,
                quiz_id=submitted_quiz_id,
                selected_answer_text=submitted_text,
                is_correct=is_correct,
                correct_answer_text=correct_text,
            )
            db.add(attempt)

        score_percentage = (
            (total_correct / total_submitted) * 100 if total_submitted > 0 else 0.0
        )

        quiz_session.total_submitted += total_submitted
        quiz_session.total_correct += total_correct
        quiz_session.total_time_seconds += submission_batch.total_time_seconds
        quiz_session.is_completed = True

        db.add(quiz_session)
        db.commit()

        return QuizScoreSummary(
            total_submitted=quiz_session.total_submitted,  # Return updated cumulative totals
            total_correct=quiz_session.total_correct,
            score_percentage=round(
                score_percentage, 2
            ),  # Note: This percentage is for the BATCH, not the whole session
            results=results,
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        logger.error(f"Error scoring quiz batch: {e}", exc_info=True)
        db.rollback()
        raise Exception("Internal error during quiz scoring.")


def get_quizzes_for_session(
    db: Session,
    id: uuid.UUID,
    current_user: CurrentUser,
    difficulty: DifficultyLevel,
) -> list[Quiz]:
    """
    Retrieves the predetermined list of Quiz objects associated with an
    existing QuizSession, ensuring the current user owns the session.
    """

    quiz_session = db.get(QuizSession, id)

    if not quiz_session:
        raise HTTPException(status_code=404, detail="Quiz session not found.")

    if quiz_session.user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Permission denied to access this session."
        )

    quiz_ids_str: list[uuid.UUID] = quiz_session.quiz_ids_json
    quiz_ids: list[uuid.UUID] = [uuid.UUID(q_id) for q_id in quiz_ids_str]

    statement = (
        select(Quiz)
        .where(Quiz.id.in_(quiz_ids), Quiz.difficulty_level == difficulty)
        .options(selectinload(Quiz.chunk))  # type: ignore[arg-type]
    )

    quizzes_raw = db.exec(statement).all()

    quiz_lookup = {}
    for r in quizzes_raw:
        quiz = r[0] if isinstance(r, tuple) else r
        quiz_lookup[quiz.id] = quiz

    ordered_quizzes: list[Quiz] = [
        quiz_lookup[q_id] for q_id in quiz_ids if q_id in quiz_lookup
    ]

    return ordered_quizzes


def fetch_and_format_quizzes(db: Session, quiz_ids: list[uuid.UUID]) -> QuizzesPublic:
    """
    Fetches a specific list of Quiz objects by ID, enforces the order, and
    formats them into QuizzesPublic, assigning a unique UUID to each choice.
    """
    if not quiz_ids:
        return QuizzesPublic(data=[], count=0)

    statement = select(Quiz).where(Quiz.id.in_(quiz_ids)).order_by(Quiz.created_at)
    quizzes = db.exec(statement).all()
    quiz_lookup = {quiz.id: quiz for quiz in quizzes}

    final_quizzes: list[Quiz] = [
        quiz_lookup[q_id] for q_id in quiz_ids if q_id in quiz_lookup
    ]

    quiz_public_list: list[QuizPublic] = []

    for quiz in final_quizzes:
        all_texts = [
            quiz.correct_answer,
            quiz.distraction_1,
            quiz.distraction_2,
            quiz.distraction_3,
        ]

        random.shuffle(all_texts)

        choices_list: list[QuizChoice] = []

        for text in all_texts:
            choice_uuid = str(uuid.uuid4())

            choices_list.append(QuizChoice(id=choice_uuid, text=text))

        public_quiz = QuizPublic(
            id=quiz.id,
            quiz_text=quiz.quiz_text,
            choices=choices_list,
        )
        quiz_public_list.append(public_quiz)

    return QuizzesPublic(data=quiz_public_list, count=len(quiz_public_list))


def select_quizzes_by_course_criteria(
    db: Session,
    course_id: uuid.UUID,
    current_user: CurrentUser,
    difficulty: DifficultyLevel,
    limit: int = 5,
) -> list[Quiz]:
    """
    Selects a set of Quizzes for a specific course and difficulty level,
    ensuring the user owns the course. This is used for NEW sessions.
    """
    statement = (
        select(Quiz)
        .join(Chunk, Quiz.chunk_id == Chunk.id)  # type: ignore
        .join(Document, Chunk.document_id == Document.id)  # type: ignore
        .join(Course, Document.course_id == Course.id)  # type: ignore
        .where(
            and_(
                Course.id == course_id,  # type: ignore
                Course.owner_id == current_user.id,  # type: ignore
                Quiz.difficulty_level == difficulty,  # type: ignore
            )
        )
        .options(selectinload(Quiz.chunk))  # type: ignore[arg-type]
        .order_by(Quiz.created_at)  # type: ignore
        .limit(limit)
    )

    quizzes_raw = db.exec(statement).all()
    # Ensure only Quiz objects are returned
    quizzes: list[Quiz] = [r[0] if isinstance(r, tuple) else r for r in quizzes_raw]
    return quizzes
