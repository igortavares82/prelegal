from typing import Literal

from pydantic import BaseModel, EmailStr


class AuthRequest(BaseModel):
    email: EmailStr
    password: str


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
