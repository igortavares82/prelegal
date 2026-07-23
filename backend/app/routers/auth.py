"""Fake auth for the V1 foundation.

There is no password verification and no persisted session yet — signing up
and logging in both just upsert a user row by email and hand back a token,
so the frontend has a real round trip to build the login screen against
before real authentication lands.
"""

import secrets
import sqlite3

from fastapi import APIRouter, Depends

from ..db import get_db
from ..schemas import AuthRequest, AuthResponse, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _upsert_user(conn: sqlite3.Connection, email: str) -> UserOut:
    conn.execute(
        "INSERT INTO users (email) VALUES (?) ON CONFLICT(email) DO NOTHING",
        (email,),
    )
    conn.commit()
    row = conn.execute(
        "SELECT id, email FROM users WHERE email = ?", (email,)
    ).fetchone()
    return UserOut(id=row["id"], email=row["email"])


@router.post("/signup", response_model=AuthResponse)
def signup(
    payload: AuthRequest, conn: sqlite3.Connection = Depends(get_db)
) -> AuthResponse:
    user = _upsert_user(conn, payload.email)
    return AuthResponse(user=user, session_token=secrets.token_urlsafe(16))


@router.post("/login", response_model=AuthResponse)
def login(
    payload: AuthRequest, conn: sqlite3.Connection = Depends(get_db)
) -> AuthResponse:
    user = _upsert_user(conn, payload.email)
    return AuthResponse(user=user, session_token=secrets.token_urlsafe(16))
