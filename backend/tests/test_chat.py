import pytest
from fastapi.testclient import TestClient

from app.llm import LlmError
from app.schemas import ChatTurnResult, NdaFormData


def test_mutual_nda_turn_returns_llm_result(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    expected = ChatTurnResult(
        reply="Got it, what's the effective date?",
        fields=NdaFormData(purpose="Evaluating a partnership"),
        is_complete=False,
    )
    captured_messages = []

    def fake_call_structured(messages, response_format):
        captured_messages.extend(messages)
        assert response_format is ChatTurnResult
        return expected

    monkeypatch.setattr("app.routers.chat.call_structured", fake_call_structured)

    response = client.post(
        "/api/chat/mutual-nda",
        json={
            "messages": [{"role": "user", "content": "It's for evaluating a partnership"}],
            "fields": {},
        },
    )

    assert response.status_code == 200
    assert response.json() == expected.model_dump()
    # System prompt is prepended, then the client's messages follow in order.
    assert captured_messages[0]["role"] == "system"
    assert captured_messages[1] == {
        "role": "user",
        "content": "It's for evaluating a partnership",
    }


def test_mutual_nda_turn_passes_current_fields_to_llm(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    captured_messages = []

    def fake_call_structured(messages, response_format):
        captured_messages.extend(messages)
        return ChatTurnResult(reply="ok", fields=NdaFormData(), is_complete=False)

    monkeypatch.setattr("app.routers.chat.call_structured", fake_call_structured)

    client.post(
        "/api/chat/mutual-nda",
        json={
            "messages": [{"role": "user", "content": "change governing law to Delaware"}],
            "fields": {"purpose": "Evaluating a partnership", "governingLaw": "California"},
        },
    )

    system_content = captured_messages[0]["content"]
    assert "Evaluating a partnership" in system_content
    assert "California" in system_content


def test_mutual_nda_turn_returns_502_on_llm_failure(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def raise_error(messages, response_format):
        raise LlmError("boom")

    monkeypatch.setattr("app.routers.chat.call_structured", raise_error)

    response = client.post(
        "/api/chat/mutual-nda",
        json={"messages": [{"role": "user", "content": "hi"}], "fields": {}},
    )

    assert response.status_code == 502
