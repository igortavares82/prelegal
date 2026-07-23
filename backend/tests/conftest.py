from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def db_path(tmp_path: Path) -> Path:
    return tmp_path / "test.db"


@pytest.fixture
def client(db_path: Path) -> TestClient:
    # No static_dir on disk in tests, so the app runs API-only (no mount).
    app = create_app(db_path=db_path, static_dir=Path("/nonexistent"))
    with TestClient(app) as test_client:
        yield test_client
