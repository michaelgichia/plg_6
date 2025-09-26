import logging
import uuid
import json

import openai
from sqlmodel import select

from app.api.deps import SessionDep
from app.models.embeddings import Chunk
from app.models.questions import Question
from app.schemas.public import DifficultyLevel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def generate_questions_task(document_id: uuid.UUID, session: SessionDep):
    """
    Background task to generate a bank of quiz questions from a document.
    """
    try:
        # 1. Retrieve the document's chunks from the database
        statement = select(Chunk).where(Chunk.document_id == document_id)
        chunks = session.exec(statement).all()

        if not chunks:
            # Handle case where no chunks are found
            return

        # 2. Iterate through difficulty levels and generate questions
        for difficulty_level in [
            DifficultyLevel.EASY,
            DifficultyLevel.MEDIUM,
            DifficultyLevel.HARD,
        ]:
            # This is a conceptual example; you'd likely use Pinecone's client
            # to retrieve embeddings and text. For simplicity, we use the chunks
            # directly from the database here.
            # 3. Create a prompt for the LLM
            # The prompt needs to guide the LLM to generate the correct format.
            prompt = f"""
            Generate a set of multiple-choice questions based on the following text chunks.
            The questions should be at a '{difficulty_level}' difficulty level.

            For each question, provide:
            1. The question text.
            2. The single correct answer.
            3. Three plausible but incorrect distractions.

            Format the response as a JSON array of objects, where each object has keys:
            'question', 'correct_answer', 'distraction_1', 'distraction_2', 'distraction_3', 'topic'.

            Text Chunks:
            """

            # Concatenate chunks into the prompt, up to a token limit
            # This is a critical step for RAG
            concatenated_text = " ".join([chunk.text_content for chunk in chunks])
            prompt += concatenated_text

            # 4. Call the LLM to generate the questions
            response = await openai.AsyncOpenAI().chat.completions.create(
                model="gpt-4o",  # or another suitable model
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are a quiz generator."},
                    {"role": "user", "content": prompt},
                ],
            )
            print("LLM Response:", response)  # Debugging line to inspect the response
        # 5. Parse the LLM's JSON response
        raw_json_string = response.choices[0].message.content
        try:
            data = json.loads(raw_json_string) # Use 'data' instead of the list name initially
        except json.JSONDecodeError as e:
            logger.error(f"LLM returned invalid JSON for document {document_id}: {raw_json_string[:200]}... Error: {e}")
            return

        # --- NEW LOGIC HERE ---
        if isinstance(data, dict) and "questions" in data:
            # Case A: LLM wrapped the array in a {"questions": [...]} key
            final_question_list = data["questions"]
        elif isinstance(data, list):
            # Case B: LLM returned the array directly (ideal case)
            final_question_list = data
        else:
            # Case C: Unexpected/malformed structure
            logger.error(f"LLM returned unexpected JSON structure for document {document_id}.")
            return

        # 6. Save the generated questions to the database
        # We now iterate over the correctly extracted list: final_question_list
        for q_data in final_question_list:

            # 🚨 Final check: Ensure q_data is a dictionary before accessing its keys
            if not isinstance(q_data, dict):
                logger.warning(f"Skipping malformed item in question list: {q_data}")
                continue

            print("Processing question data:", q_data)

            new_question = Question(
                chunk_id=chunks[0].id, # Using the UUID directly from the SQLModel object
                difficulty_level=difficulty_level,
                question_text=q_data["question"],
                correct_answer=q_data["correct_answer"],
                distraction_1=q_data["distraction_1"],
                distraction_2=q_data["distraction_2"],
                distraction_3=q_data["distraction_3"],
                topic=q_data["topic"],
            )
            session.add(new_question)

        session.commit()


    except Exception as e:
        # Log the error and potentially update document status
        logger.error(f"Error generating questions for document {document_id}: {e}")