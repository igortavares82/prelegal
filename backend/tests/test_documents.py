from fastapi.testclient import TestClient


def _signup(client: TestClient, email: str = "doc-user@example.com") -> str:
    response = client.post(
        "/api/auth/signup", json={"email": email, "password": "correct-horse"}
    )
    return response.json()["session_token"]


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_save_document_requires_authentication(client: TestClient) -> None:
    response = client.post(
        "/api/documents",
        json={"document_slug": "mutual-nda", "title": "Draft", "data": {}},
    )
    assert response.status_code == 401


def test_save_and_fetch_a_document(client: TestClient) -> None:
    token = _signup(client)
    save = client.post(
        "/api/documents",
        json={
            "document_slug": "mutual-nda",
            "title": "Acme MNDA",
            "data": {"purpose": "Evaluating a partnership"},
        },
        headers=_auth_headers(token),
    )
    assert save.status_code == 200
    body = save.json()
    assert body["document_slug"] == "mutual-nda"
    assert body["title"] == "Acme MNDA"
    assert body["data"] == {"purpose": "Evaluating a partnership"}

    fetched = client.get(f"/api/documents/{body['id']}", headers=_auth_headers(token))
    assert fetched.status_code == 200
    assert fetched.json() == body


def test_save_document_rejects_an_unknown_slug(client: TestClient) -> None:
    token = _signup(client)
    response = client.post(
        "/api/documents",
        json={"document_slug": "not-a-real-doc", "title": "Draft", "data": {}},
        headers=_auth_headers(token),
    )
    assert response.status_code == 400


def test_list_documents_returns_only_the_current_users_documents_newest_first(
    client: TestClient,
) -> None:
    token_a = _signup(client, "a@example.com")
    token_b = _signup(client, "b@example.com")

    client.post(
        "/api/documents",
        json={"document_slug": "mutual-nda", "title": "A's first", "data": {}},
        headers=_auth_headers(token_a),
    )
    client.post(
        "/api/documents",
        json={"document_slug": "csa", "title": "A's second", "data": {}},
        headers=_auth_headers(token_a),
    )
    client.post(
        "/api/documents",
        json={"document_slug": "csa", "title": "B's document", "data": {}},
        headers=_auth_headers(token_b),
    )

    response = client.get("/api/documents", headers=_auth_headers(token_a))
    assert response.status_code == 200
    titles = [doc["title"] for doc in response.json()]
    assert titles == ["A's second", "A's first"]


def test_get_document_404s_for_another_users_document(client: TestClient) -> None:
    token_a = _signup(client, "owner@example.com")
    token_b = _signup(client, "other@example.com")

    save = client.post(
        "/api/documents",
        json={"document_slug": "mutual-nda", "title": "Owner's doc", "data": {}},
        headers=_auth_headers(token_a),
    )
    document_id = save.json()["id"]

    response = client.get(f"/api/documents/{document_id}", headers=_auth_headers(token_b))
    assert response.status_code == 404


def test_get_document_404s_for_a_nonexistent_id(client: TestClient) -> None:
    token = _signup(client)
    response = client.get("/api/documents/999999", headers=_auth_headers(token))
    assert response.status_code == 404
