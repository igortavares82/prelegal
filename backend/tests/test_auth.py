from pathlib import Path

from fastapi.testclient import TestClient

from app.db import get_connection


def test_signup_creates_user_with_hashed_password(client: TestClient, db_path: Path) -> None:
    response = client.post(
        "/api/auth/signup",
        json={"email": "new@example.com", "password": "correct-horse"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["user"]["email"] == "new@example.com"
    assert body["session_token"]

    conn = get_connection(db_path)
    row = conn.execute(
        "SELECT email, password_hash FROM users WHERE email = ?", ("new@example.com",)
    ).fetchone()
    conn.close()
    assert row is not None
    assert row["password_hash"] != "correct-horse"


def test_signup_rejects_a_duplicate_email(client: TestClient) -> None:
    client.post(
        "/api/auth/signup", json={"email": "dup@example.com", "password": "correct-horse"}
    )
    response = client.post(
        "/api/auth/signup", json={"email": "dup@example.com", "password": "another-pw"}
    )
    assert response.status_code == 409


def test_signup_rejects_a_short_password(client: TestClient) -> None:
    response = client.post(
        "/api/auth/signup", json={"email": "short@example.com", "password": "short"}
    )
    assert response.status_code == 422


def test_login_succeeds_with_the_correct_password(client: TestClient) -> None:
    client.post(
        "/api/auth/signup", json={"email": "s@example.com", "password": "correct-horse"}
    )
    response = client.post(
        "/api/auth/login", json={"email": "s@example.com", "password": "correct-horse"}
    )
    assert response.status_code == 200
    assert response.json()["user"]["email"] == "s@example.com"


def test_login_rejects_the_wrong_password(client: TestClient) -> None:
    client.post(
        "/api/auth/signup", json={"email": "s2@example.com", "password": "correct-horse"}
    )
    response = client.post(
        "/api/auth/login", json={"email": "s2@example.com", "password": "wrong-password"}
    )
    assert response.status_code == 401


def test_login_rejects_an_unknown_email(client: TestClient) -> None:
    response = client.post(
        "/api/auth/login", json={"email": "ghost@example.com", "password": "correct-horse"}
    )
    assert response.status_code == 401


def test_login_rejects_invalid_email(client: TestClient) -> None:
    response = client.post(
        "/api/auth/login", json={"email": "not-an-email", "password": "correct-horse"}
    )
    assert response.status_code == 422


def test_login_issues_a_fresh_token_each_time(client: TestClient) -> None:
    client.post(
        "/api/auth/signup", json={"email": "same@example.com", "password": "correct-horse"}
    )
    first = client.post(
        "/api/auth/login", json={"email": "same@example.com", "password": "correct-horse"}
    ).json()
    second = client.post(
        "/api/auth/login", json={"email": "same@example.com", "password": "correct-horse"}
    ).json()

    assert first["user"]["id"] == second["user"]["id"]
    assert first["session_token"] != second["session_token"]


def test_logout_invalidates_the_session(client: TestClient) -> None:
    signup = client.post(
        "/api/auth/signup", json={"email": "logout@example.com", "password": "correct-horse"}
    ).json()
    token = signup["session_token"]

    protected = client.get("/api/documents", headers={"Authorization": f"Bearer {token}"})
    assert protected.status_code == 200

    logout = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout.status_code == 204

    protected_again = client.get(
        "/api/documents", headers={"Authorization": f"Bearer {token}"}
    )
    assert protected_again.status_code == 401


def test_db_recreated_fresh_on_each_app_startup(db_path: Path) -> None:
    from app.main import create_app

    app1 = create_app(db_path=db_path, static_dir=Path("/nonexistent"))
    with TestClient(app1) as c1:
        c1.post(
            "/api/auth/signup", json={"email": "gone@example.com", "password": "correct-horse"}
        )

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
