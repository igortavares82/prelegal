# Prelegal backend

FastAPI service that serves the API and (in the built container) the
statically-exported frontend, all from a single process on port 8000.

## Getting started

```bash
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

## Testing

```bash
uv run pytest
```

## Notes

- The SQLite database (`data/app.db` by default, override with
  `PRELEGAL_DB_PATH`) is dropped and recreated on every startup — there's no
  migration story yet, this is foundation-only.
- `/api/auth/signup` and `/api/auth/login` currently upsert a user by email
  with no password verification and no persisted session — a stand-in so the
  frontend's login screen has a real endpoint to call before real auth
  lands.
- Static frontend files are served from `static/` (override with
  `PRELEGAL_STATIC_DIR`); see the root `Dockerfile` for how that directory is
  populated from the frontend's static export.
