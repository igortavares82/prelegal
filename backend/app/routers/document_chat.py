"""AI chat that interviews the user to populate a generic document's fields.

Covers every catalog document type except the Mutual NDA, which keeps its
own dedicated pipeline (routers/chat.py) — see PL-6. Stateless, same pattern
as chat.py: the frontend resends the full conversation and current field
values every turn; this endpoint has no memory of its own.

The field list for a document type is derived by the frontend from the
template text (see frontend/lib/genericFields.ts) and sent as `field_keys`
on every request, so the backend never needs template file access.
"""

from fastapi import APIRouter, Depends, HTTPException

from ..catalog import CatalogEntry, get_catalog, selectable_entries
from ..llm import LlmError, call_structured
from ..schemas import GenericChatLlmResult, GenericChatRequest, GenericChatTurnResult

router = APIRouter(prefix="/api/chat", tags=["chat"])


def build_system_prompt(document_name: str, field_keys: list[str], known_fields: dict[str, str]) -> str:
    field_lines = "\n".join(f"- {key}" for key in field_keys)
    known_fields_json = ", ".join(f'"{key}": "{known_fields.get(key, "")}"' for key in field_keys)
    return f"""\
You are a friendly assistant helping a user fill out a {document_name} by \
chatting with them. Interview them conversationally, asking about one or two \
related fields at a time rather than listing everything at once. Use plain, \
non-legalese language.

The fields you need to collect are:
{field_lines}

Rules:
- Return every field listed above in `fields`, carrying forward values \
already known even if this turn's answer only updates one of them. Never \
drop a previously collected value.
- The "Known fields so far" state below is authoritative — start from it, \
don't ignore it.
- Leave fields the user hasn't given you yet as empty strings ("").
- Always end `reply` with a natural next question for whatever's still \
missing — never end a turn with only a statement and no question when \
there's more to collect.
- Set is_complete to true only once every field above is filled in and \
you've asked the user to confirm the details look right; otherwise false.

Known fields so far (JSON): {{{known_fields_json}}}
"""


@router.post("/document/{document_slug}", response_model=GenericChatTurnResult)
def document_turn(
    document_slug: str,
    payload: GenericChatRequest,
    catalog: list[CatalogEntry] = Depends(get_catalog),
) -> GenericChatTurnResult:
    entries = {entry.slug: entry for entry in selectable_entries(catalog)}
    entry = entries.get(document_slug)
    if entry is None or document_slug == "mutual-nda":
        raise HTTPException(status_code=404, detail="Unknown document type.")

    field_keys = payload.field_keys
    known_fields = {key: payload.fields.get(key, "") for key in field_keys}

    system_message = {
        "role": "system",
        "content": build_system_prompt(entry.name, field_keys, known_fields),
    }
    messages = [system_message] + [
        {"role": message.role, "content": message.content} for message in payload.messages
    ]

    try:
        llm_result = call_structured(messages, GenericChatLlmResult)
    except LlmError as exc:
        raise HTTPException(
            status_code=502, detail="AI assistant is temporarily unavailable. Please try again."
        ) from exc

    # Defensive merge: only accept keys we actually asked about, and never
    # drop a previously known value just because the model omitted it.
    merged_fields = dict(known_fields)
    for field in llm_result.fields:
        if field.key in merged_fields:
            merged_fields[field.key] = field.value

    is_complete = llm_result.is_complete and all(merged_fields[key].strip() for key in field_keys)

    return GenericChatTurnResult(reply=llm_result.reply, fields=merged_fields, is_complete=is_complete)
