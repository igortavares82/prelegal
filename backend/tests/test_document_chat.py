import pytest
from fastapi.testclient import TestClient

from app.llm import LlmError
from app.schemas import GenericChatLlmResult, GenericFieldValue


def test_document_turn_returns_merged_fields(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    captured_messages = []

    def fake_call_structured(messages, response_format):
        captured_messages.extend(messages)
        assert response_format is GenericChatLlmResult
        return GenericChatLlmResult(
            reply="Got it, what's the Effective Date?",
            fields=[GenericFieldValue(key="Customer", value="Acme Corp")],
            is_complete=False,
        )

    monkeypatch.setattr("app.routers.document_chat.call_structured", fake_call_structured)

    response = client.post(
        "/api/chat/document/csa",
        json={
            "messages": [{"role": "user", "content": "Acme Corp is the customer"}],
            "field_keys": ["Customer", "Effective Date"],
            "fields": {},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["fields"] == {"Customer": "Acme Corp", "Effective Date": ""}
    assert body["is_complete"] is False
    assert captured_messages[0]["role"] == "system"
    assert "Cloud Service Agreement" in captured_messages[0]["content"]


def test_document_turn_never_drops_a_previously_known_value(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fake_call_structured(messages, response_format):
        # LLM only returns one field this turn; the other must still survive.
        return GenericChatLlmResult(
            reply="ok",
            fields=[GenericFieldValue(key="Effective Date", value="2026-08-01")],
            is_complete=False,
        )

    monkeypatch.setattr("app.routers.document_chat.call_structured", fake_call_structured)

    response = client.post(
        "/api/chat/document/csa",
        json={
            "messages": [{"role": "user", "content": "start on Aug 1"}],
            "field_keys": ["Customer", "Effective Date"],
            "fields": {"Customer": "Acme Corp"},
        },
    )

    assert response.json()["fields"] == {"Customer": "Acme Corp", "Effective Date": "2026-08-01"}


def test_document_turn_drops_a_hallucinated_field_key(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fake_call_structured(messages, response_format):
        return GenericChatLlmResult(
            reply="ok",
            fields=[GenericFieldValue(key="Not A Real Field", value="whatever")],
            is_complete=False,
        )

    monkeypatch.setattr("app.routers.document_chat.call_structured", fake_call_structured)

    response = client.post(
        "/api/chat/document/csa",
        json={
            "messages": [{"role": "user", "content": "hi"}],
            "field_keys": ["Customer"],
            "fields": {},
        },
    )

    assert response.json()["fields"] == {"Customer": ""}


def test_document_turn_recomputes_is_complete_rather_than_trusting_the_llm(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fake_call_structured(messages, response_format):
        # LLM claims complete, but a field is still blank.
        return GenericChatLlmResult(reply="All done!", fields=[], is_complete=True)

    monkeypatch.setattr("app.routers.document_chat.call_structured", fake_call_structured)

    response = client.post(
        "/api/chat/document/csa",
        json={
            "messages": [{"role": "user", "content": "hi"}],
            "field_keys": ["Customer"],
            "fields": {},
        },
    )

    assert response.json()["is_complete"] is False


def test_document_turn_404s_for_an_unknown_document_slug(client: TestClient) -> None:
    response = client.post(
        "/api/chat/document/not-a-real-doc",
        json={"messages": [], "field_keys": [], "fields": {}},
    )

    assert response.status_code == 404


def test_document_turn_404s_for_mutual_nda_which_has_its_own_endpoint(client: TestClient) -> None:
    response = client.post(
        "/api/chat/document/mutual-nda",
        json={"messages": [], "field_keys": [], "fields": {}},
    )

    assert response.status_code == 404


def test_document_turn_returns_502_on_llm_failure(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def raise_error(messages, response_format):
        raise LlmError("boom")

    monkeypatch.setattr("app.routers.document_chat.call_structured", raise_error)

    response = client.post(
        "/api/chat/document/csa",
        json={"messages": [{"role": "user", "content": "hi"}], "field_keys": ["Customer"], "fields": {}},
    )

    assert response.status_code == 502
