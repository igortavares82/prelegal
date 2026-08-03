"""Real authentication for Prelegal.

Passwords are hashed with PBKDF2 (see ``security.py``); sessions are opaque
tokens persisted in the ``sessions`` table and sent back by the frontend as
an ``Authorization: Bearer <token>`` header on requests that need to know
which user is asking (see ``deps.get_current_user``).
"""

import sqlite3

from fastapi import APIRouter, Depends, HTTPException

from ..db import get_db
from ..deps import get_bearer_token
from ..schemas import AuthRequest, AuthResponse, UserOut
from ..security import (
    DUMMY_PASSWORD_HASH,
    generate_session_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _create_session(conn: sqlite3.Connection, user_id: int) -> str:
    token = generate_session_token()
    conn.execute("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, user_id))
    conn.commit()
    return token


@router.post("/signup", response_model=AuthResponse)
def signup(payload: AuthRequest, conn: sqlite3.Connection = Depends(get_db)) -> AuthResponse:
    try:
        conn.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (payload.email, hash_password(payload.password)),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        # Two concurrent signups for the same email can both pass an
        # earlier existence check, so the UNIQUE constraint itself is the
        # real guard — catch it here instead of racing a SELECT-then-INSERT.
        raise HTTPException(
            status_code=409, detail="An account with that email already exists."
        )
    row = conn.execute(
        "SELECT id, email FROM users WHERE email = ?", (payload.email,)
    ).fetchone()
    token = _create_session(conn, row["id"])
    return AuthResponse(user=UserOut(id=row["id"], email=row["email"]), session_token=token)


@router.post("/login", response_model=AuthResponse)
def login(payload: AuthRequest, conn: sqlite3.Connection = Depends(get_db)) -> AuthResponse:
    row = conn.execute(
        "SELECT id, email, password_hash FROM users WHERE email = ?", (payload.email,)
    ).fetchone()
    # Always hash against something, even for an unknown email, so response
    # time doesn't leak whether that email has an account.
    password_hash = row["password_hash"] if row is not None else DUMMY_PASSWORD_HASH
    password_ok = verify_password(payload.password, password_hash)
    if row is None or not password_ok:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = _create_session(conn, row["id"])
    return AuthResponse(user=UserOut(id=row["id"], email=row["email"]), session_token=token)


@router.post("/logout", status_code=204)
def logout(
    token: str = Depends(get_bearer_token),
    conn: sqlite3.Connection = Depends(get_db),
) -> None:
    conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
    conn.commit()
