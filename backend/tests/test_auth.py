from pathlib import Path

from fastapi.testclient import TestClient

from app.db import get_connection


def test_login_creates_user(client: TestClient, db_path: Path) -> None:
    response = client.post(
        "/api/auth/login", json={"email": "new@example.com", "password": "anything"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["user"]["email"] == "new@example.com"
    assert body["session_token"]

    conn = get_connection(db_path)
    row = conn.execute(
        "SELECT email FROM users WHERE email = ?", ("new@example.com",)
    ).fetchone()
    conn.close()
    assert row is not None


def test_login_upserts_same_user_on_repeat(client: TestClient) -> None:
    first = client.post(
        "/api/auth/login", json={"email": "same@example.com", "password": "one"}
    ).json()
    second = client.post(
        "/api/auth/login", json={"email": "same@example.com", "password": "two"}
    ).json()

    assert first["user"]["id"] == second["user"]["id"]
    # Session tokens are per-request, not tied to a real session yet.
    assert first["session_token"] != second["session_token"]


def test_signup_then_login_same_user(client: TestClient) -> None:
    signup = client.post(
        "/api/auth/signup", json={"email": "s@example.com", "password": "pw"}
    ).json()
    login = client.post(
        "/api/auth/login", json={"email": "s@example.com", "password": "pw"}
    ).json()

    assert signup["user"]["id"] == login["user"]["id"]


def test_login_rejects_invalid_email(client: TestClient) -> None:
    response = client.post(
        "/api/auth/login", json={"email": "not-an-email", "password": "pw"}
    )
    assert response.status_code == 422


def test_db_recreated_fresh_on_each_app_startup(db_path: Path) -> None:
    from app.main import create_app

    app1 = create_app(db_path=db_path, static_dir=Path("/nonexistent"))
    with TestClient(app1) as c1:
        c1.post("/api/auth/login", json={"email": "gone@example.com", "password": "pw"})

    # A second app instance against the same db_path simulates the container
    # being brought up again: the users table should be wiped.
    app2 = create_app(db_path=db_path, static_dir=Path("/nonexistent"))
    with TestClient(app2) as c2:
        conn = get_connection(db_path)
        row = conn.execute(
            "SELECT email FROM users WHERE email = ?", ("gone@example.com",)
        ).fetchone()
        conn.close()
        assert row is None
