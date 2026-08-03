"""FastAPI dependencies for authenticating requests via session tokens."""

import sqlite3

from fastapi import Depends, Header, HTTPException

from .db import get_db
from .schemas import UserOut


def get_bearer_token(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return authorization.removeprefix("Bearer ").strip()


def get_current_user(
    token: str = Depends(get_bearer_token),
    conn: sqlite3.Connection = Depends(get_db),
) -> UserOut:
    row = conn.execute(
        """
        SELECT users.id, users.email
        FROM sessions
        JOIN users ON users.id = sessions.user_id
        WHERE sessions.token = ?
        """,
        (token,),
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=401, detail="Invalid or expired session.")
    return UserOut(id=row["id"], email=row["email"])
