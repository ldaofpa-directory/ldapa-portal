from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=10000)


class ChatRequest(BaseModel):
    session_id: str | None = None
    message: str = Field(min_length=1, max_length=5000)
    history: list[ChatMessage] = []


class ProviderCard(BaseModel):
    id: str
    name: str
    organization: str | None
    service_types: list[str]
    city: str
    zip_code: str | None
    cost_tier: str
    phone: str | None
    email: str | None
    website: str | None
    description: str | None
    specializations: list[str] = []
    serves_ages: list[str] = []
    insurance_accepted: bool = False
    accepts_medicaid: bool = False
    cost_notes: str | None = None


class ChatResponse(BaseModel):
    session_id: str
    response: str
    providers: list[ProviderCard]
    escalate: bool


class FeedbackRequest(BaseModel):
    message_id: str
    session_id: str
    rating: Literal["positive", "negative"]
