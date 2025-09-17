import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models.common import Message
from app.models.course import (
    Course,
    CourseCreate,
    CoursePublic,
    CoursesPublic,
    CourseUpdate,
)
from app.models.document import Document

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


@router.get("/{id}", response_model=CoursePublic)
def read_course(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get course by ID.
    """
    course = session.get(Course, id)
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
            "uploaded_at": doc.uploaded_at.isoformat(),
        }
        for doc in documents
    ]
