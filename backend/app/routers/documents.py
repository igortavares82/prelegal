"""Documents a user has explicitly chosen to save (PL-7).

Each save is its own row — there's no update/versioning story yet, so
reopening a saved document and saving again just creates another row. This
matches the project's ephemeral-DB convention: nothing here is meant to be
durable across container restarts, only across the current session.
"""

import json
import sqlite3

from fastapi import APIRouter, Depends, HTTPException

from ..catalog import CatalogEntry, get_catalog, selectable_entries
from ..db import get_db
from ..deps import get_current_user
from ..schemas import DocumentIn, DocumentOut, DocumentSummary, UserOut

router = APIRouter(prefix="/api/documents", tags=["documents"])


def _to_document_out(row: sqlite3.Row) -> DocumentOut:
    return DocumentOut(
        id=row["id"],
        document_slug=row["document_slug"],
        title=row["title"],
        data=json.loads(row["data"]),
        created_at=row["created_at"],
    )


@router.post("", response_model=DocumentOut)
def save_document(
    payload: DocumentIn,
    user: UserOut = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db),
    catalog: list[CatalogEntry] = Depends(get_catalog),
) -> DocumentOut:
    valid_slugs = {entry.slug for entry in selectable_entries(catalog)}
    if payload.document_slug not in valid_slugs:
        raise HTTPException(status_code=400, detail="Unknown document type.")

    cursor = conn.execute(
        "INSERT INTO documents (user_id, document_slug, title, data) VALUES (?, ?, ?, ?)",
        (user.id, payload.document_slug, payload.title, json.dumps(payload.data)),
    )
    conn.commit()
    row = conn.execute(
        "SELECT id, document_slug, title, data, created_at FROM documents WHERE id = ?",
        (cursor.lastrowid,),
    ).fetchone()
    return _to_document_out(row)


@router.get("", response_model=list[DocumentSummary])
def list_documents(
    user: UserOut = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db),
) -> list[DocumentSummary]:
    rows = conn.execute(
        "SELECT id, document_slug, title, created_at FROM documents"
        " WHERE user_id = ? ORDER BY id DESC",
        (user.id,),
    ).fetchall()
    return [
        DocumentSummary(
            id=row["id"],
            document_slug=row["document_slug"],
            title=row["title"],
            created_at=row["created_at"],
        )
        for row in rows
    ]


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(
    document_id: int,
    user: UserOut = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db),
) -> DocumentOut:
    row = conn.execute(
        "SELECT id, document_slug, title, data, created_at FROM documents"
        " WHERE id = ? AND user_id = ?",
        (document_id, user.id),
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Document not found.")
    return _to_document_out(row)
