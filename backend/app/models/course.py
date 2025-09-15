import uuid

from sqlmodel import Field, Relationship, SQLModel

from app.models.user import User


# shared properties
class CourseBase(SQLModel):
  name: str = Field(min_length=3, max_length=255)
  description: str | None =  Field(default=None, max_length=1020)

# Properties to receive on item creation
class CourseCreate(CourseBase):
  pass

# Properties to receive on item update
class CourseUpdate(CourseBase):
  name: str | None = Field(default=None, min_length=3, max_length=255)  # type: ignore
  description: str | None = Field(default=None, max_length=1020)  # type: ignore

# Database model, database table inferred from class name
class Course(CourseBase, table=True):
  id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
  owner_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
  owner: User | None = Relationship(back_populates="courses")

class CoursePublic(CourseBase):
  id: uuid.UUID
  owner_id: uuid.UUID

class CoursesPublic(SQLModel):
  data: list[CoursePublic]
  count: int
