import pytest
from pydantic import BaseModel

from app.llm import LlmError, call_structured


class Greeting(BaseModel):
    text: str


class FakeMessage:
    def __init__(self, content: str) -> None:
        self.content = content


class FakeChoice:
    def __init__(self, content: str) -> None:
        self.message = FakeMessage(content)


class FakeResponse:
    def __init__(self, content: str) -> None:
        self.choices = [FakeChoice(content)]


def test_call_structured_parses_response(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "app.llm.completion", lambda **kwargs: FakeResponse('{"text": "hello"}')
    )

    result = call_structured([{"role": "user", "content": "hi"}], Greeting)

    assert result == Greeting(text="hello")


def test_call_structured_wraps_provider_errors(monkeypatch: pytest.MonkeyPatch) -> None:
    def raise_error(**kwargs):
        raise RuntimeError("provider unavailable")

    monkeypatch.setattr("app.llm.completion", raise_error)

    with pytest.raises(LlmError):
        call_structured([{"role": "user", "content": "hi"}], Greeting)


def test_call_structured_wraps_malformed_output(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.llm.completion", lambda **kwargs: FakeResponse("not json"))

    with pytest.raises(LlmError):
        call_structured([{"role": "user", "content": "hi"}], Greeting)
