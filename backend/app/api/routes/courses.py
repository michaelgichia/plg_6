import json
import uuid
from http import HTTPStatus
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import selectinload
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models.common import Message
from app.models.course import (
    Course,
    CourseCreate,
    CourseUpdate,
    QAItem,
)
from app.models.document import Document
from app.schemas.public import CoursePublic, CoursesPublic, DocumentPublic

from langchain_pinecone import PineconeVectorStore
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain


INDEX_NAME = "developer-quickstart-py"
MODEL = "gpt-4o-mini"
EMBEDDINGS = OpenAIEmbeddings()
PROMPT = """You are an assistant for question-answering tasks.
Use the following retrieved context to generate as many as possible flashcard self-test questions (more than 20) in the JSON template provided below. 
Do not find questions outside the provided context, return an empty array if you can't find. Do not use any external knowledge or information not present in the context.

template: [{"question": "the question", "answer": "the answer to the question"}]
"""


class CourseWithDocuments(CoursePublic):
    documents: list[DocumentPublic] = []


router = APIRouter(prefix="/courses", tags=["courses"])

@router.get("/", response_model=CoursesPublic)
def read_courses(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve courses.
    """

    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(Course)
        count = session.exec(count_statement).one()
        statement = select(Course).offset(skip).limit(limit)
        courses = session.exec(statement).all()
    else:
        count_statement = (
            select(func.count())
            .select_from(Course)
            .where(Course.owner_id == current_user.id)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(Course)
            .where(Course.owner_id == current_user.id)
            .offset(skip)
            .limit(limit)
        )
        courses = session.exec(statement).all()

    return CoursesPublic(data=courses, count=count)  # type: ignore

@router.get("/{id}", response_model=CourseWithDocuments)
def read_course(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get course by ID, including its documents.
    """
    statement = (
        select(Course).where(Course.id == id).options(selectinload(Course.documents))
    )
    course = session.exec(statement).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if not current_user.is_superuser and (course.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    return course

@router.post("/", response_model=CoursePublic)
def create_course(
    *, session: SessionDep, current_user: CurrentUser, course_in: CourseCreate
) -> Any:
    """
    Create new course.
    """
    course = Course.model_validate(course_in, update={"owner_id": current_user.id})
    course.updated_at = datetime.now(timezone.utc)
    session.add(course)
    session.commit()
    session.refresh(course)
    return course

@router.put("/{id}", response_model=CoursePublic)
def update_course(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    course_in: CourseUpdate,
) -> Any:
    """
    Update an course.
    """
    course = session.get(Course, id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if not current_user.is_superuser and (course.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    course_data = course_in.model_dump(exclude_unset=True)

    for key, value in course_data.items():
        setattr(course, key, value)
    session.add(course)
    session.commit()
    session.refresh(course)
    return course

@router.delete("/{id}", response_model=Message)
def delete_course(
    *, session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """
    Delete an course.
    """
    course = session.get(Course, id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if not current_user.is_superuser and (course.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    session.delete(course)
    session.commit()
    return {"message": "Course deleted successfully"}

@router.get("/{course_id}/documents", response_model=list[dict[str, Any]])
async def list_documents(
    course_id: str, session: SessionDep = SessionDep(), skip: int = 0, limit: int = 100
) -> list[dict[str, Any]]:
    """
    List documents for a specific course.
    """
    statement = (
        select(Document)
        .where(Document.course_id == course_id)
        .offset(skip)
        .limit(limit)
    )
    documents = session.exec(statement).all()
    return [
        {
            "id": str(doc.id),
            "filename": doc.filename,
            "chunk_count": doc.chunk_count,
            "status": doc.status,
            "updated_at": doc.updated_at.isoformat(),
        }
        for doc in documents
    ]


@router.get("/{course_id}/flashcards", response_model=list[QAItem])
def generate_flashcards_by_course_id(session: SessionDep, current_user: CurrentUser, course_id: uuid.UUID) -> list[QAItem]:
    """
    Generate flashcards via course ID
    """
    statement = (
        select(Course).where(Course.id == course_id).options(selectinload(Course.documents))
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
    try:
        vectorstore = PineconeVectorStore.from_existing_index(
            index_name=INDEX_NAME,
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
