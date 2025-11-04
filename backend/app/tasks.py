import asyncio
import json
import logging
import random
import uuid

import tiktoken
from fastapi import HTTPException
from sqlalchemy import and_
from sqlalchemy.orm import load_only, selectinload
from sqlmodel import Session, select

from app.api.deps import CurrentUser, SessionDep
from app.models.course import Course
from app.models.embeddings import Chunk
from app.models.quizzes import Quiz, QuizAttempt, QuizSession
from app.prompts.quizzes import get_quiz_prompt, get_quizzes_generation_prompt
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

MAX_PROMPT_TOKENS = 25000
ENCODER = tiktoken.encoding_for_model("gpt-4o")


def get_token_count(text: str) -> int:
    """Helper function to count tokens using tiktoken."""
    return len(ENCODER.encode(text))


async def generate_quizzes_task(
    document_id: uuid.UUID, course_id: uuid.UUID, session: SessionDep
):
    try:
        statement = select(Chunk).where(Chunk.course_id == course_id)
        all_chunks = session.exec(statement).all()

        if not all_chunks:
            logger.warning(f"No chunks found for document {document_id}")
            return

        # We will track which chunks have been processed
        unprocessed_chunks = list(all_chunks)

        for difficulty_level in [
            DifficultyLevel.EASY,
            DifficultyLevel.MEDIUM,
            DifficultyLevel.HARD,
        ]:
            while unprocessed_chunks:
                current_batch_chunks = []
                batch_text_content = ""
                current_token_count = 0

                i = 0
                while i < len(unprocessed_chunks):
                    chunk = unprocessed_chunks[i]
                    chunk_token_count = get_token_count(chunk.text_content)

                    if current_token_count + chunk_token_count < MAX_PROMPT_TOKENS:
                        current_token_count += chunk_token_count
                        batch_text_content += chunk.text_content + "\n\n"
                        current_batch_chunks.append(chunk)
                        i += 1
                    else:
                        break  # Batch is full, stop adding chunks

                # Remove processed chunks from the front of the list
                unprocessed_chunks = unprocessed_chunks[i:]

                if not current_batch_chunks:
                    # Should only happen if the first chunk is larger than MAX_PROMPT_TOKENS
                    logger.error(
                        "A single chunk exceeds the maximum prompt token limit."
                    )
                    break

                prompt = get_quizzes_generation_prompt(
                    batch_text_content, difficulty_level
                )

                response = await get_quiz_prompt(prompt)

                try:
                    raw_content = response.choices[0].message.content
                    parsed = json.loads(raw_content)
                    quiz_list = parsed.get("quizzes", [])

                    if not isinstance(quiz_list, list):
                        logger.error(
                            f"LLM did not return 'quizzes' as a list for batch. Got: {type(quiz_list)}"
                        )
                        continue
                except json.JSONDecodeError as e:
                    logger.error(
                        f"Failed to parse LLM response for batch: {e}. Raw content: {raw_content[:200]}..."
                    )
                    continue

                # 4. Save the generated quizzes to the database
                for q_data in quiz_list:
                    if not isinstance(q_data, dict):
                        logger.warning(
                            f"Skipping malformed item in quiz list: {q_data}"
                        )
                        continue

                    new_quiz = Quiz(
                        chunk_id=current_batch_chunks[0].id,
                        correct_answer=clean_string(q_data["correct_answer"]),
                        course_id=course_id,
                        difficulty_level=difficulty_level,
                        distraction_1=clean_string(q_data["distraction_1"]),
                        distraction_2=clean_string(q_data["distraction_2"]),
                        distraction_3=clean_string(q_data["distraction_3"]),
                        document_id=document_id,
                        feedback=clean_string(q_data["feedback"]),
                        quiz_text=q_data["quiz"],
                        topic=clean_string(q_data["topic"]),
                    )
                    session.add(new_quiz)

                session.commit()
                await asyncio.sleep(15)

            unprocessed_chunks = list(all_chunks)

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
            .where(Quiz.id.in_(submitted_ids))  # type: ignore
            .options(load_only(Quiz.id, Quiz.correct_answer, Quiz.feedback))  # type: ignore
        )

        quizzes = db.exec(statement).all()

        correct_answers_map: dict[uuid.UUID, str] = {
            q.id: q.correct_answer.strip() for q in quizzes
        }

        feedback_map: dict[uuid.UUID, str] = {
            q.id: (q.feedback or "").strip() for q in quizzes
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

            feedback = feedback_map[submitted_quiz_id]

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
                feedback=feedback,
            )
            db.add(attempt)

        quiz_session.total_submitted += total_submitted
        quiz_session.total_correct += total_correct
        quiz_session.total_time_seconds += submission_batch.total_time_seconds
        overall_score_percentage = (
            (quiz_session.total_correct / quiz_session.total_submitted) * 100
            if quiz_session.total_submitted > 0
            else 0.0
        )
        quiz_session.score_percentage = round(overall_score_percentage, 1)
        quiz_session.is_completed = True

        db.add(quiz_session)
        db.commit()

        return QuizScoreSummary(
            total_submitted=quiz_session.total_submitted,
            total_correct=quiz_session.total_correct,
            score_percentage=quiz_session.score_percentage,
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

    statement = select(Quiz).where(Quiz.id.in_(quiz_ids)).order_by(Quiz.created_at)  # type: ignore
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
    quiz_attempts_statement = (
        select(QuizAttempt)
        .join(Quiz)
        .where(
            Quiz.course_id == course_id,  # type: ignore
            Quiz.difficulty_level == difficulty,  # type: ignore
            QuizAttempt.is_correct == True,  # noqa: E712
        )
        .options(load_only(QuizAttempt.quiz_id))  # type: ignore
    )

    quiz_attempts_raw = db.exec(quiz_attempts_statement).all()

    logger.info(f"Quiz attempts: {quiz_attempts_raw}")

    quizzes_statement = (
        select(Quiz)
        .join(Course)
        .where(
            and_(
                Quiz.course_id == course_id,  # type: ignore
                Course.owner_id == current_user.id,  # type: ignore
                Quiz.difficulty_level == difficulty,  # type: ignore
            )
        )
        .filter(
            Quiz.id.not_in(
                [attempt.quiz_id for attempt in quiz_attempts_raw]  # type: ignore
            )
        )
        .options(selectinload(Quiz.chunk))  # type: ignore[arg-type]
        .order_by(Quiz.created_at)  # type: ignore
        .limit(limit)
    )

    quizzes_raw = db.exec(quizzes_statement).all()
    # Ensure only Quiz objects are returned
    quizzes: list[Quiz] = [r[0] if isinstance(r, tuple) else r for r in quizzes_raw]
    return quizzes
