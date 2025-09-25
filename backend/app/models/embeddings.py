import uuid

from sqlmodel import Field, Relationship, SQLModel


class Chunk(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    document_id: uuid.UUID = Field(foreign_key="document.id", nullable=False)
    text_content: str
    embedding_id: str = Field(unique=True)

    document: "Document" = Relationship(back_populates="chunks")
    questions: list["Question"] = Relationship(
        back_populates="chunk", sa_relationship_kwargs={"cascade": "delete"}
    )