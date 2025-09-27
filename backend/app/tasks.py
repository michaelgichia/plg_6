import json
import logging
import uuid

from app.utils import clean_string
import openai
from sqlmodel import select

from app.api.deps import SessionDep
from app.models.embeddings import Chunk
from app.models.quizzes import Quiz
from app.schemas.public import DifficultyLevel

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
                                            "topic": {"type": "string"}
                                        },
                                        "required": [
                                            "quiz",
                                            "correct_answer",
                                            "distraction_1",
                                            "distraction_2",
                                            "distraction_3",
                                            "topic"
                                        ],
                                        "additionalProperties": False
                                    }
                                }
                            },
                            "required": ["quizzes"],
                            "additionalProperties": False
                        }
                    }
                },
                messages=[
                    {"role": "system", "content": "You are a quiz generator. Only output valid JSON."},
                    {"role": "user", "content": prompt},
                ],
            )

            # 4. Parse structured JSON directly
            try:
                raw_content = response.choices[0].message.content
                parsed = json.loads(raw_content)
                quiz_list = parsed.get("quizzes", [])
                if not isinstance(quiz_list, list):
                    logger.error(f"LLM did not return 'quizzes' as a list for document {document_id}. Got: {type(quiz_list)}")
                    continue
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse LLM response for document {document_id}: {e}. Raw content: {raw_content[:200]}...")
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
