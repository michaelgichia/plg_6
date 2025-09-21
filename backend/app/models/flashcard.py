from pydantic import BaseModel


class QAItem(BaseModel):
    question: str
    answer: str
