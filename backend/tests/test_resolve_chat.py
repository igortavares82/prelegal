import pytest
from fastapi.testclient import TestClient

from app.llm import LlmError
from app.schemas import ResolveChatResult


def test_resolve_turn_returns_llm_result(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    expected = ResolveChatResult(reply="Got it, you need a CSA.", matched_slug="csa")
    captured_messages = []

    def fake_call_structured(messages, response_format):
        captured_messages.extend(messages)
        assert response_format is ResolveChatResult
        return expected

    monkeypatch.setattr("app.routers.resolve_chat.call_structured", fake_call_structured)

    response = client.post(
        "/api/chat/resolve",
        json={"messages": [{"role": "user", "content": "I need to let a vendor use my cloud service"}]},
    )

    assert response.status_code == 200
    assert response.json() == expected.model_dump()
    assert captured_messages[0]["role"] == "system"
    assert "csa" in captured_messages[0]["content"]
    assert "Cloud Service Agreement" in captured_messages[0]["content"]


def test_resolve_turn_lists_every_selectable_catalog_entry_in_the_prompt(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    captured_messages = []

    def fake_call_structured(messages, response_format):
        captured_messages.extend(messages)
        return ResolveChatResult(reply="Which document do you need?", matched_slug=None)

    monkeypatch.setattr("app.routers.resolve_chat.call_structured", fake_call_structured)

    client.post("/api/chat/resolve", json={"messages": [{"role": "user", "content": "hi"}]})

    system_content = captured_messages[0]["content"]
    for slug in ["mutual-nda", "csa", "dpa", "psa", "sla", "baa", "ai-addendum"]:
        assert f'"{slug}"' in system_content
    # The cover page entry isn't itself a selectable document type.
    assert "Cover Page" not in system_content


def test_resolve_turn_coerces_a_hallucinated_slug_to_unresolved(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fake_call_structured(messages, response_format):
        return ResolveChatResult(reply="Here you go!", matched_slug="not-a-real-slug")

    monkeypatch.setattr("app.routers.resolve_chat.call_structured", fake_call_structured)

    response = client.post("/api/chat/resolve", json={"messages": [{"role": "user", "content": "hi"}]})

    assert response.status_code == 200
    assert response.json()["matched_slug"] is None


def test_resolve_turn_returns_502_on_llm_failure(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def raise_error(messages, response_format):
        raise LlmError("boom")

    monkeypatch.setattr("app.routers.resolve_chat.call_structured", raise_error)

    response = client.post("/api/chat/resolve", json={"messages": [{"role": "user", "content": "hi"}]})

    assert response.status_code == 502
