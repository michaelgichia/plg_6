from sqlmodel import Session

from app import crud
from app.models.course import Course, CourseCreate
from app.tests.utils.user import create_random_user
from app.tests.utils.utils import random_lower_string


def create_random_course(db: Session) -> Course:
    user = create_random_user(db)
    owner_id = user.id
    assert owner_id is not None
    name = random_lower_string()
    description = random_lower_string()
    course_in = CourseCreate(name=name, description=description)
    return crud.create_course(session=db, course_in=course_in, owner_id=owner_id)
