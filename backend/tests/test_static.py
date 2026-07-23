from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app


def test_serves_static_frontend_when_present(tmp_path: Path) -> None:
    static_dir = tmp_path / "static"
    static_dir.mkdir()
    (static_dir / "index.html").write_text("<html><body>Prelegal</body></html>")

    app = create_app(db_path=tmp_path / "app.db", static_dir=static_dir)
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200
        assert "Prelegal" in response.text

        # API routes still take priority over the static mount.
        health = client.get("/api/health")
        assert health.status_code == 200


def test_no_static_mount_when_dir_missing(tmp_path: Path) -> None:
    app = create_app(db_path=tmp_path / "app.db", static_dir=tmp_path / "missing")
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 404
