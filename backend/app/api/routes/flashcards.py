import json
import uuid
from typing import List
from http import HTTPStatus

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select
from sqlalchemy.orm import selectinload

from langchain_pinecone import PineconeVectorStore
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain

from app.api.deps import CurrentUser, SessionDep
from app.models.flashcard import QAItem
from app.models.course import Course
from app.models.document import Document

router = APIRouter(prefix="/flashcards", tags=["flashcards"])

MODEL = "gpt-4o-mini"
EMBEDDINGS = OpenAIEmbeddings()
PROMPT = """You are an assistant for question-answering tasks.
Use the following retrieved context to generate as many as possible flashcard self-test questions (more than 20) in the JSON template provided below. 
Do not find questions outside the provided context, return an empty array if you can't find. Do not use any external knowledge or information not present in the context.

template: [{"question": "the question", "answer": "the answer to the question"}]
"""


@router.get("/course/{id}", response_model=List[QAItem])
def generate_flashcards_by_course_id(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> List[QAItem]:
    """
    Generate flashcards via course ID
    """
    statement = (
        select(Course).where(Course.id == id).options(selectinload(Course.documents))
    )
    course = session.exec(statement).first()
    if not course:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND,
            detail="Course not found",
        )
    if not current_user.is_superuser and (course.owner_id != current_user.id):
        raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail="Not enough permissions")
    # Connect to an existing Pinecone index
    index_name = "developer-quickstart-py"
    try:
        vectorstore = PineconeVectorStore.from_existing_index(
            index_name=index_name,
            embedding=EMBEDDINGS,
            text_key="text"
        )
    except ValueError:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND,
            detail="Document index can not be retrieved",
        )
    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 5},
        filter={"course_id": course.id}
    )
    llm = ChatOpenAI(temperature=0.7, model_name=MODEL)
    memory = ConversationBufferMemory(memory_key="chat_history", return_meessage=True)
    conversation_chain = ConversationalRetrievalChain.from_llm(llm=llm, retriever=retriever, memory=memory)
    result = conversation_chain.invoke({"question": PROMPT})
    try:
        return json.loads(result["answer"])
    except Exception as exc:
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            detail="Flashcards could not be returned",
        )
