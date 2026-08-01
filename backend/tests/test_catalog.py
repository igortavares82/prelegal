import json
from pathlib import Path

from app.catalog import CatalogEntry, load_catalog, selectable_entries


def write_catalog(tmp_path: Path, entries: list[dict]) -> Path:
    path = tmp_path / "catalog.json"
    path.write_text(json.dumps(entries))
    return path


def test_load_catalog_parses_entries(tmp_path: Path) -> None:
    path = write_catalog(
        tmp_path,
        [
            {"name": "Doc A", "description": "desc", "filename": "templates/a.md", "slug": "doc-a"},
            {"name": "Doc B", "description": "desc", "filename": "templates/b.md"},
        ],
    )

    catalog = load_catalog(path)

    assert catalog == [
        CatalogEntry(name="Doc A", description="desc", filename="templates/a.md", slug="doc-a"),
        CatalogEntry(name="Doc B", description="desc", filename="templates/b.md", slug=None),
    ]


def test_selectable_entries_excludes_entries_without_a_slug(tmp_path: Path) -> None:
    path = write_catalog(
        tmp_path,
        [
            {"name": "Doc A", "description": "desc", "filename": "templates/a.md", "slug": "doc-a"},
            {"name": "Cover Page", "description": "desc", "filename": "templates/a-cover.md"},
        ],
    )
    catalog = load_catalog(path)

    selectable = selectable_entries(catalog)

    assert [entry.slug for entry in selectable] == ["doc-a"]


def test_real_catalog_has_eleven_selectable_document_types() -> None:
    repo_root = Path(__file__).resolve().parent.parent.parent
    catalog = load_catalog(repo_root / "catalog.json")

    selectable = selectable_entries(catalog)

    assert len(selectable) == 11
    assert len(selectable) == len({entry.slug for entry in selectable})
    assert "mutual-nda" in {entry.slug for entry in selectable}
