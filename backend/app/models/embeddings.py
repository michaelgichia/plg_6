import uuid
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.document import Document
    from app.models.questions import Question


class ChunkBase(SQLModel):
    text_content: str
    embedding_id: str = Field(unique=True)
    document_id: uuid.UUID


class ChunkCreate(ChunkBase):
    pass

class ChunkUpdate(SQLModel):
    text_content: str | None = None
    embedding_id: str | None = None
    document_id: uuid.UUID | None = None

class Chunk(ChunkBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    document_id: uuid.UUID = Field(foreign_key="document.id", nullable=False)

    document: "Document" = Relationship(back_populates="chunks")
    questions: list["Question"] = Relationship(
        back_populates="chunk", sa_relationship_kwargs={"cascade": "delete"}
    )