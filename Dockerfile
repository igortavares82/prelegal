# Stage 1: build the frontend as a static export.
# Needs the sibling `templates/` directory too — app/page.tsx reads the
# Mutual NDA templates from ../templates at build time (see
# frontend/lib/loadTemplates.ts).
FROM node:22-alpine AS frontend-builder
WORKDIR /repo
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci
COPY frontend ./frontend
COPY templates ./templates
RUN cd frontend && npm run build

# Stage 2: the FastAPI backend, serving the API and the static frontend
# export from a single process on :8000.
FROM python:3.12-slim AS backend
WORKDIR /app
RUN pip install --no-cache-dir uv

COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY backend/app ./app
COPY --from=frontend-builder /repo/frontend/out ./static

ENV PRELEGAL_DB_PATH=/app/data/app.db
ENV PRELEGAL_STATIC_DIR=/app/static
EXPOSE 8000

# Invoke uvicorn from the venv directly rather than via `uv run`, which
# would otherwise re-sync (and re-download) dependencies on every container
# start.
CMD [".venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
