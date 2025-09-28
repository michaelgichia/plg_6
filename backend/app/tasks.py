import json
import logging
import random
import uuid

import openai
from sqlalchemy import and_
from sqlalchemy.orm import load_only, selectinload
from sqlmodel import Session, select

from app.api.deps import CurrentUser, SessionDep
from app.models.course import Course
from app.models.document import Document
from app.models.embeddings import Chunk
from app.models.quizzes import Quiz, QuizAttempt, QuizSession
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
        # 1. Retrieve the document's chunks from the database
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
            # 2. Build prompt
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

            # 3. Call the LLM with strict schema enforcement
            client = openai.AsyncOpenAI()
            response = await client.chat.completions.create(
                model="gpt-4o",
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "quiz_list",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "quizzes": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "quiz": {"type": "string"},
                                            "correct_answer": {"type": "string"},
                                            "distraction_1": {"type": "string"},
                                            "distraction_2": {"type": "string"},
                                            "distraction_3": {"type": "string"},
                                            "topic": {"type": "string"},
                                        },
                                        "required": [
                                            "quiz",
                                            "correct_answer",
                                            "distraction_1",
                                            "distraction_2",
                                            "distraction_3",
                                            "topic",
                                        ],
                                        "additionalProperties": False,
                                    },
                                }
                            },
                            "required": ["quizzes"],
                            "additionalProperties": False,
                        },
                    },
                },
                messages=[
                    {
                        "role": "system",
                        "content": "You are a quiz generator. Only output valid JSON.",
                    },
                    {"role": "user", "content": prompt},
                ],
            )

            # 4. Parse structured JSON directly
            try:
                raw_content = response.choices[0].message.content
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

            # 5. Save quizzes to DB
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
    course_id: uuid.UUID,
    submission_batch: QuizSubmissionBatch,
    current_user: CurrentUser,
) -> QuizScoreSummary:
    """
    Retrieves correct answers for a batch of quiz IDs and scores them.
    """
    try:
        if not submission_batch.submissions:
            return QuizScoreSummary(
                total_submitted=0, total_correct=0, score_percentage=0.0, results=[]
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

        results: list[SingleQuizScore] = []
        total_correct = 0

        quiz_session = QuizSession(
            user_id=current_user.id,
            course_id=course_id,
            total_time_seconds=submission_batch.total_time_seconds,
            total_submitted=len(submission_batch.submissions),
            total_correct=0,
        )
        db.add(quiz_session)
        db.flush()

        session_id_to_use = quiz_session.id

        for submitted_quiz_id, submitted_text in submitted_answers.items():
            correct_text = correct_answers_map.get(submitted_quiz_id)

            if not correct_text:
                results.append(
                    SingleQuizScore(
                        quiz_id=submitted_quiz_id,
                        is_correct=False,
                        correct_answer_text="N/A",
                        feedback="Quiz ID not found in database.",
                    )
                )
                continue

            is_correct = submitted_text.strip() == correct_text

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
                session_id=session_id_to_use,
                user_id=current_user.id,
                quiz_id=submitted_quiz_id,
                selected_answer_text=submitted_text,
                is_correct=is_correct,
                correct_answer_text=correct_text,
            )
            db.add(attempt)

        total_submitted = len(submission_batch.submissions)
        score_percentage = (
            (total_correct / total_submitted) * 100 if total_submitted > 0 else 0.0
        )

        quiz_session.total_correct = total_correct
        db.add(quiz_session)
        db.commit()

        return QuizScoreSummary(
            total_submitted=total_submitted,
            total_correct=total_correct,
            score_percentage=round(score_percentage, 2),
            results=results,
        )
    except Exception as e:
        logger.error(f"Error scoring quiz batch: {e}")
        db.rollback()
        raise


def get_new_quizzes_for_course(
    db: Session,
    course_id: uuid.UUID,
    current_user: CurrentUser,
    difficulty: DifficultyLevel,
    limit: int = 5,
) -> list[Quiz]:
    """
    Selects a random or ordered set of Quizzes for a specific course
    and difficulty level, ensuring the user owns the course.
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
        .order_by(Quiz.created_at)
        .limit(limit)
    )

    quizzes = db.exec(statement).all()

    return list(quizzes)


def fetch_and_format_quizzes(db: Session, quiz_ids: list[uuid.UUID]) -> QuizzesPublic:
    """
    Fetches a specific list of Quiz objects by ID, enforces the order, and
    formats them into QuizzesPublic, assigning a unique UUID to each choice.
    """
    if not quiz_ids:
        return QuizzesPublic(data=[], count=0)

    # 1. Fetch the Quizzes using the list of IDs (Logic remains the same)
    statement = select(Quiz).where(Quiz.id.in_(quiz_ids)).order_by(Quiz.created_at)
    quizzes = db.exec(statement).all()

    # 2. Re-sort the fetched quizzes based on the input `quiz_ids` list (Logic remains the same)
    quiz_lookup = {quiz.id: quiz for quiz in quizzes}
    final_quizzes: list[Quiz] = [
        quiz_lookup[q_id] for q_id in quiz_ids if q_id in quiz_lookup
    ]

    # 3. Format the final, ordered list into the public schema
    quiz_public_list: list[QuizPublic] = []

    for quiz in final_quizzes:
        # Collect all answer texts
        all_texts = [
            quiz.correct_answer,
            quiz.distraction_1,
            quiz.distraction_2,
            quiz.distraction_3,
        ]

        # Randomize the order of the options
        random.shuffle(all_texts)

        # 💡 CHANGE: Create the list of QuizChoice objects with UUIDs as IDs
        choices_list: list[QuizChoice] = []

        for text in all_texts:
            # Generate a new, unique UUID for the choice ID and convert it to a string
            choice_uuid = str(uuid.uuid4())

            choices_list.append(QuizChoice(id=choice_uuid, text=text))

        # Instantiate the public model
        public_quiz = QuizPublic(
            id=quiz.id,
            quiz_text=quiz.quiz_text,
            choices=choices_list,
        )
        quiz_public_list.append(public_quiz)

    # 4. Package and return
    return QuizzesPublic(data=quiz_public_list, count=len(quiz_public_list))
