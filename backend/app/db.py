"""SQLite access for the Prelegal backend.

The database is recreated from scratch on every app startup (see
``init_db``) — there is no migration story yet, this is foundation-only.
"""

import sqlite3
from pathlib import Path
from typing import Iterator

from fastapi import Request


def init_db(db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    db_path.unlink(missing_ok=True)
    conn = sqlite3.connect(db_path)
    try:
        conn.execute(
            """
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def get_connection(db_path: Path) -> sqlite3.Connection:
    # A single request's sync dependency (setup, endpoint body, teardown) can
    # each be dispatched to a different threadpool worker thread, so this
    # connection must not enforce sqlite3's default same-thread check.
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def get_db(request: Request) -> Iterator[sqlite3.Connection]:
    conn = get_connection(request.app.state.db_path)
    try:
        yield conn
    finally:
        conn.close()
