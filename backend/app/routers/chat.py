"""AI chat that interviews the user to populate a Mutual NDA's fields.

Stateless: the frontend keeps the running conversation and the current field
values, and resends both in full on every turn. This endpoint has no memory
of its own between requests.
"""

from fastapi import APIRouter, HTTPException

from ..llm import LlmError, call_structured
from ..schemas import ChatRequest, ChatTurnResult

router = APIRouter(prefix="/api/chat", tags=["chat"])

SYSTEM_PROMPT = """\
You are a friendly assistant helping a user fill out a Mutual Non-Disclosure \
Agreement (Mutual NDA) by chatting with them. Interview them conversationally, \
asking about one or two related fields at a time rather than listing everything \
at once. Use plain, non-legalese language.

The fields you need to collect are:
- purpose: why the parties are sharing confidential information (free text).
- effectiveDate: the date the agreement starts, as YYYY-MM-DD.
- mndaTermType: "expires" (after a number of years) or "continues" (until \
terminated). If "expires", also collect mndaTermYears (a whole number, as a \
string).
- confidentialityTermType: "expires" (after a number of years) or \
"perpetuity". If "expires", also collect confidentialityTermYears (a whole \
number, as a string).
- governingLaw: the US state whose law governs the agreement.
- jurisdiction: the courts where disputes will be handled, e.g. "courts \
located in New Castle, DE".
- modifications: any modifications to the standard NDA terms (optional, \
default to "None." if the user has none).
- party1 and party2: each has signature (typed name), printName, title, \
company, noticeAddress (email or postal address), and date (YYYY-MM-DD, the \
date they sign).

Rules:
- Always return the FULL current state of every field in `fields`, carrying \
forward values already known even if this turn's answer only updates one of \
them. Never drop a previously collected value.
- The message below titled "Known fields so far" is the authoritative current \
state — start from it, don't ignore it.
- Leave fields the user hasn't given you yet as empty strings ("" ), except \
mndaTermType/confidentialityTermType (default "expires") and \
mndaTermYears/confidentialityTermYears (default "1"), which already have \
sensible defaults.
- Always end `reply` with a natural next question for whatever's still \
missing — never end a turn with only a statement and no question when \
there's more to collect.
- Set is_complete to true only once every field above is filled in and you've \
asked the user to confirm the details look right; otherwise false.
"""


@router.post("/mutual-nda", response_model=ChatTurnResult)
def mutual_nda_turn(payload: ChatRequest) -> ChatTurnResult:
    system_message = {
        "role": "system",
        "content": f"{SYSTEM_PROMPT}\n\nKnown fields so far (JSON):\n"
        f"{payload.fields.model_dump_json()}",
    }
    messages = [system_message] + [
        {"role": message.role, "content": message.content} for message in payload.messages
    ]

    try:
        return call_structured(messages, ChatTurnResult)
    except LlmError as exc:
        raise HTTPException(
            status_code=502, detail="AI assistant is temporarily unavailable. Please try again."
        ) from exc
