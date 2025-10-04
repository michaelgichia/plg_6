from openai.types.chat import ChatCompletion

from app.llm_clients.openai_client import client


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
