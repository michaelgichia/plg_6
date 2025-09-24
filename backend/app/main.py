import sentry_sdk
from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware

from app.api.main import api_router
from app.core.config import settings
from app.models.course import CoursePublic, CoursesPublic

try:
    from app.models.document import DocumentPublic
    from app.models.chat import Chat, ChatPublic
except ImportError:
    DocumentPublic = None
    ChatPublic = None
    Chat = None


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
)

# Set all CORS enabled origins
if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

CoursePublic.model_rebuild()
CoursesPublic.model_rebuild()
if DocumentPublic:
    DocumentPublic.model_rebuild()
if Chat and ChatPublic:
    Chat.model_rebuild()
    ChatPublic.model_rebuild()

app.include_router(api_router, prefix=settings.API_V1_STR)
