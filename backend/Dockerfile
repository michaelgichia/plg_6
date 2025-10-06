FROM python:3.10

ENV PYTHONUNBUFFERED=1

WORKDIR /app/

# Install uv (Fast dependency manager)
COPY --from=ghcr.io/astral-sh/uv:0.5.11 /uv /uvx /bin/

ENV PATH="/app/.venv/bin:$PATH"
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Install dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project

ENV PYTHONPATH=/app

COPY ./scripts /app/scripts
COPY ./pyproject.toml ./uv.lock ./alembic.ini /app/
COPY ./app /app/app

# Sync the project (installs your code into .venv)
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync

# This script ensures migrations run before starting the app.
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Running Alembic migrations..."\n\
alembic upgrade head\n\
echo "Starting FastAPI..."\n\
fastapi run --workers 4 app/main.py --port ${PORT:-8000}\n' > /app/start.sh \
 && chmod +x /app/start.sh

# Use the new startup script
CMD ["/app/start.sh"]
