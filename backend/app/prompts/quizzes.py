from openai.types.chat import ChatCompletion

from app.llm_clients.openai_client import client
from app.schemas.public import DifficultyLevel


async def get_quiz_prompt(prompt: str) -> ChatCompletion:
    return await client.chat.completions.create(
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
                                    "feedback": {"type": "string"},
                                    "topic": {"type": "string"},
                                },
                                "required": [
                                    "quiz",
                                    "correct_answer",
                                    "distraction_1",
                                    "distraction_2",
                                    "distraction_3",
                                    "feedback",
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


def get_quizzes_generation_prompt(
    concatenated_text: str, difficulty_level: DifficultyLevel
) -> str:
    return f"""
            1. Task context: You are an expert quiz question generator for educational content. Your goal is to create multiple-choice questions that thoroughly test a user's understanding of the provided text.
            2. Tone context: The response must be professional, strictly formatted, and follow all JSON schema rules exactly.
            3. Background data: The text provided below contains the source material for the quiz questions.
            4. Detailed task description & rules:
              - Generate between 20 to 30 multiple-choice quizzes for the provided text.
              - Each quiz must be strictly at the '{difficulty_level}' difficulty level.
              - **Each quiz must have exactly 4 choices** (one correct answer and three distractors).
              - Ensure the **distraction choices are highly plausible**, requiring genuine understanding to be answered correctly. They should be related to the topic but demonstrably incorrect based on the text.
              - All choices (correct and incorrect) should be **full, descriptive sentences or phrases**, not just single words.
              - The primary output must be a single JSON object containing a property called 'quizzes'.

            5. Output Structure (JSON Schema Rules):
            Each object in the 'quizzes' array must include the following fields:

            - **quiz**: string (The multiple-choice question itself.)
            - **correct_answer**: string (The text of the correct choice.)
            - **distraction_1**: string (A plausible, incorrect choice.)
            - **distraction_2**: string (A plausible, incorrect choice.)
            - **distraction_3**: string (A plausible, incorrect choice.)
            - **topic**: string (A short, 2-3 word category/topic for the quiz.)
            - **feedback**: string (Specific, helpful explanation **for a user who selects an incorrect answer**. This should clarify why the correct answer is right based on the text.)

            6. Output formatting:
            Return only a single JSON object.

            Text:
            {concatenated_text}
            """
