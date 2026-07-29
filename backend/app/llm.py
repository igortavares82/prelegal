"""Thin wrapper around the LiteLLM/OpenRouter/Cerebras call used for AI chat.

Kept separate from any one feature's router so the LLM call itself can be
mocked in tests without needing to know about prompt content.
"""

from litellm import completion
from pydantic import BaseModel

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}


class LlmError(Exception):
    """Raised when the LLM call fails or returns output that doesn't match the schema."""


def call_structured[T: BaseModel](messages: list[dict[str, str]], response_format: type[T]) -> T:
    try:
        response = completion(
            model=MODEL,
            messages=messages,
            response_format=response_format,
            reasoning_effort="low",
            extra_body=EXTRA_BODY,
        )
        content = response.choices[0].message.content
        return response_format.model_validate_json(content)
    except Exception as exc:
        raise LlmError(str(exc)) from exc
