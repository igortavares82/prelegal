"""AI chat that figures out which catalog document type the user wants.

Runs before either document-filling pipeline (Mutual NDA's dedicated one, or
the generic one for the other document types). Stateless, same pattern as
chat.py: the frontend resends the full conversation every turn.
"""

from fastapi import APIRouter, Depends, HTTPException

from ..catalog import CatalogEntry, get_catalog, selectable_entries
from ..llm import LlmError, call_structured
from ..schemas import ResolveChatRequest, ResolveChatResult

router = APIRouter(prefix="/api/chat", tags=["chat"])


def build_system_prompt(entries: list[CatalogEntry]) -> str:
    catalog_lines = "\n".join(f'- slug "{entry.slug}": {entry.name} — {entry.description}' for entry in entries)
    return f"""\
You are a friendly assistant helping a user figure out which legal document \
they need, then handing them off to fill it in. We can generate exactly \
these document types:

{catalog_lines}

Interview the user conversationally to figure out which one they want. Ask a \
clarifying question whenever it's genuinely unclear which document fits —  \
never guess silently.

If what they describe doesn't match any of these documents, say plainly that \
we can't generate that, then propose the closest match from the list above \
by name and briefly explain why it's the closest fit. Ask them to confirm \
before proceeding.

Rules:
- Set matched_slug to the slug of the confirmed document only once the user \
has clearly indicated (including accepting a proposed closest match) which \
one they want. Otherwise leave it null.
- Always end `reply` with a question when matched_slug is still null — never \
leave the user without a clear next step to answer.
- Once matched_slug is set, `reply` should be a short, friendly transition \
line (e.g. confirming what you'll help them build next), not another \
question.
"""


@router.post("/resolve", response_model=ResolveChatResult)
def resolve_turn(
    payload: ResolveChatRequest,
    catalog: list[CatalogEntry] = Depends(get_catalog),
) -> ResolveChatResult:
    entries = selectable_entries(catalog)
    system_message = {"role": "system", "content": build_system_prompt(entries)}
    messages = [system_message] + [
        {"role": message.role, "content": message.content} for message in payload.messages
    ]

    try:
        result = call_structured(messages, ResolveChatResult)
    except LlmError as exc:
        raise HTTPException(
            status_code=502, detail="AI assistant is temporarily unavailable. Please try again."
        ) from exc

    known_slugs = {entry.slug for entry in entries}
    if result.matched_slug is not None and result.matched_slug not in known_slugs:
        # Hallucinated slug — don't let it through, treat as still unresolved.
        result = ResolveChatResult(reply=result.reply, matched_slug=None)

    return result
