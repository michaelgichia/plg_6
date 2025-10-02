# Copilot Instructions for StudyCompanion

## Project Overview
- **Monorepo** with `backend/` (FastAPI, SQLModel, PostgreSQL) and `frontend/` (Next.js, TypeScript, Tailwind CSS).
- Uses **Docker Compose** for local development and production orchestration.
- **Backend**: Python, FastAPI, SQLModel ORM, JWT auth, email recovery, Pytest for tests, Traefik for proxying.
- **Frontend**: Next.js app, auto-generated API client, modern React/TypeScript patterns.

## Key Workflows
- **Backend setup**: From `backend/`, run `uv sync` to install Python deps, then `source .venv/bin/activate`.
- **Run all services**: `docker compose up` (see `docker-compose.override.yml` for local-only changes).
- **Backend live reload**: Code changes in `backend/app/` auto-reload via Docker Compose override.
- **Testing**: Run backend tests with `pytest` (or via VS Code Python test tab).
- **Frontend dev**: From `frontend/`, use `pnpm dev` (or `npm run dev`, `yarn dev`).

## Project Conventions & Patterns
- **Backend models**: Located in `backend/app/models/`, use SQLModel and Pydantic patterns. Example: see `document.py` for model, status enum, and timestamp fields with UTC-aware defaults.
- **API endpoints**: In `backend/app/api/`, organized by resource.
- **CRUD logic**: In `backend/app/crud.py` and related files.
- **Frontend API**: Uses auto-generated client in `frontend/src/client/`.
- **Styling**: Tailwind CSS, see `frontend/postcss.config.mjs` and `tailwind.config.js`.
- **Testing scripts**: See `backend/scripts/test.sh` and `frontend/package.json` scripts.

## Integration & Cross-Component
- **Database**: PostgreSQL, configured via Docker Compose.
- **Reverse proxy**: Traefik, see `docker-compose.traefik.yml`.
- **Email**: Password recovery via backend, see backend config.
- **Client generation**: OpenAPI-based, see `frontend/openapi-ts.config.ts`.

## Tips for AI Agents
- Always check for Docker Compose overrides for local workflow changes.
- Use VS Code debug/test configs for Python backend.
- Follow existing model/API/CRUD separation for backend features.
- For new API endpoints, update OpenAPI spec and regenerate frontend client.
- Use UTC for all timestamps (see `document.py`).
- Reference `README.md` files in root, backend, and frontend for more details.

---

*Last updated: 2025-09-22. Please update this file if project structure or workflows change.*
