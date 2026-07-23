import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .db import init_db
from .routers import auth

BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BACKEND_DIR / "data" / "app.db"
DEFAULT_STATIC_DIR = BACKEND_DIR / "static"


def create_app(db_path: Path | None = None, static_dir: Path | None = None) -> FastAPI:
    db_path = db_path or Path(os.environ.get("PRELEGAL_DB_PATH", DEFAULT_DB_PATH))
    static_dir = static_dir or Path(
        os.environ.get("PRELEGAL_STATIC_DIR", DEFAULT_STATIC_DIR)
    )

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        init_db(app.state.db_path)
        yield

    app = FastAPI(title="Prelegal API", lifespan=lifespan)
    app.state.db_path = db_path

    # Only needed so `next dev` on :3000 can call this API directly during
    # local development; the built container serves both from :8000.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router)

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    if static_dir.exists():
        app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

    return app


app = create_app()
