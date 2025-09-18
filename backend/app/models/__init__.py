from sqlmodel import SQLModel

# Explicitly import all model files so they register their tables
from .common import *  # noqa: F403, if you have base mixins here
from .course import Course  # noqa: F401
from .document import Document  # noqa: F401
from .item import Item  # noqa: F401
from .user import User  # noqa: F401

__all__ = ["SQLModel", "User", "Item", "Course", "Document"]