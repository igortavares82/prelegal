from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field


class AuthRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class UserOut(BaseModel):
    id: int
    email: str


class AuthResponse(BaseModel):
    user: UserOut
    session_token: str


class PartyDetails(BaseModel):
    signature: str = ""
    printName: str = ""
    title: str = ""
    company: str = ""
    noticeAddress: str = ""
    date: str = ""


class NdaFormData(BaseModel):
    """Mirrors frontend/lib/types.ts's NdaFormData field-for-field (same
    camelCase names) so the JSON crossing the API needs no translation."""

    purpose: str = ""
    effectiveDate: str = ""
    mndaTermType: Literal["expires", "continues"] = "expires"
    mndaTermYears: str = "1"
    confidentialityTermType: Literal["expires", "perpetuity"] = "expires"
    confidentialityTermYears: str = "1"
    governingLaw: str = ""
    jurisdiction: str = ""
    modifications: str = ""
    party1: PartyDetails = PartyDetails()
    party2: PartyDetails = PartyDetails()


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    fields: NdaFormData = NdaFormData()


class ChatTurnResult(BaseModel):
    reply: str
    fields: NdaFormData
    is_complete: bool


class ResolveChatRequest(BaseModel):
    messages: list[ChatMessage]


class ResolveChatResult(BaseModel):
    reply: str
    # The slug of the catalog entry the user has confirmed they want, once
    # known — null while still narrowing down which document that is.
    matched_slug: str | None = None


class GenericFieldValue(BaseModel):
    key: str
    value: str


class GenericChatLlmResult(BaseModel):
    reply: str
    fields: list[GenericFieldValue]
    is_complete: bool


class GenericChatRequest(BaseModel):
    messages: list[ChatMessage]
    field_keys: list[str]
    fields: dict[str, str] = {}


class GenericChatTurnResult(BaseModel):
    reply: str
    fields: dict[str, str]
    is_complete: bool


class DocumentIn(BaseModel):
    """A document the user has chosen to save, keyed by catalog slug.

    ``data`` is either an ``NdaFormData``-shaped object (mutual-nda) or a
    flat field-key/value map (every other document type) — opaque to the
    backend either way, since only the frontend's fill functions know how to
    turn it back into document text.
    """

    document_slug: str
    title: str
    data: dict[str, Any]


class DocumentSummary(BaseModel):
    id: int
    document_slug: str
    title: str
    created_at: str


class DocumentOut(DocumentSummary):
    data: dict[str, Any]
