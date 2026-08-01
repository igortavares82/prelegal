"""Loads catalog.json — the source of truth for which legal document types
this app can generate, and their names/descriptions/slugs.
"""

import json
from pathlib import Path

from fastapi import Request
from pydantic import BaseModel


class CatalogEntry(BaseModel):
    name: str
    description: str
    filename: str
    slug: str | None = None


def load_catalog(path: Path) -> list[CatalogEntry]:
    data = json.loads(path.read_text())
    return [CatalogEntry.model_validate(entry) for entry in data]


def selectable_entries(catalog: list[CatalogEntry]) -> list[CatalogEntry]:
    """Catalog entries that are themselves a document a user can request.

    Excludes entries like the Mutual NDA Cover Page, which exists in the
    catalog as documentation of a companion file but isn't something a user
    asks for on its own.
    """
    return [entry for entry in catalog if entry.slug is not None]


def get_catalog(request: Request) -> list[CatalogEntry]:
    return request.app.state.catalog
