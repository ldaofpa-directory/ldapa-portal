from __future__ import annotations

import json
import time
import uuid
from collections import defaultdict
from fastapi import APIRouter, HTTPException
from app.database import get_db
from app.models.chat import ChatRequest, ChatResponse, FeedbackRequest, ProviderCard
from app.services.llm import extract_filters, generate_response
from app.services.provider_search import search_providers, format_provider_context

router = APIRouter(prefix="/api", tags=["chat"])

# Simple in-memory rate limiter: {ip_or_session: [timestamps]}
_rate_limits: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_MAX = 30  # max requests
RATE_LIMIT_WINDOW = 60  # per 60 seconds


def _check_rate_limit(key: str) -> None:
    now = time.monotonic()
    timestamps = _rate_limits[key]
    # Remove expired entries
    _rate_limits[key] = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]
    if len(_rate_limits[key]) >= RATE_LIMIT_MAX:
        raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
    _rate_limits[key].append(now)


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    _check_rate_limit(request.session_id or "anon")

    db = await get_db()
    try:
        # Create or retrieve session
        session_id = request.session_id
        if not session_id:
            session_id = str(uuid.uuid4())
            await db.execute(
                "INSERT INTO chat_sessions (id) VALUES (?)", (session_id,)
            )
            await db.commit()

        # Build conversation history
        history = [{"role": m.role, "content": m.content} for m in request.history]
        history.append({"role": "user", "content": request.message})

        # Call 1: Extract filters
        filters = await extract_filters(history)

        # Check for escalation or insufficient info
        escalate = filters.get("escalate", False)
        needs_more_info = filters.get("needs_more_info", False)
        providers_data = []
        provider_cards = []

        if escalate:
            # Mark session as escalated
            await db.execute(
                "UPDATE chat_sessions SET escalated = 1 WHERE id = ?", (session_id,)
            )
        elif needs_more_info:
            # Skip provider search — LLM will ask follow-up questions
            pass
        elif filters.get("needs_providers", False):
            # Query database for matching providers (reuse existing db connection)
            providers_data = await search_providers(filters, db=db)
            provider_cards = [
                ProviderCard(
                    id=p["id"],
                    name=p["name"],
                    organization=p.get("organization"),
                    service_types=p.get("service_types", []),
                    city=p.get("city", ""),
                    zip_code=p.get("zip_code"),
                    cost_tier=p.get("cost_tier", "standard"),
                    phone=p.get("phone"),
                    email=p.get("email"),
                    website=p.get("website"),
                    description=p.get("description"),
                    specializations=p.get("specializations", []),
                    serves_ages=p.get("serves_ages", []),
                    insurance_accepted=p.get("insurance_accepted", False),
                    accepts_medicaid=p.get("accepts_medicaid", False),
                    cost_notes=p.get("cost_notes"),
                )
                for p in providers_data
            ]

        # Call 2: Generate response
        if escalate:
            provider_context = "_ESCALATE_"
        elif needs_more_info:
            provider_context = "Need more information from the user before searching. Ask follow-up questions."
        elif not filters.get("needs_providers", False):
            provider_context = "No provider search needed. The user is asking a general question — answer it directly."
        else:
            provider_context = format_provider_context(providers_data)
        response_text = await generate_response(history, provider_context)

        # Update location if extracted
        location = filters.get("location", {})
        if location.get("city") or location.get("zip"):
            location_json = json.dumps({k: v for k, v in location.items() if v})
            await db.execute(
                "UPDATE chat_sessions SET user_location = ? WHERE id = ?",
                (location_json, session_id),
            )

        # Store messages
        user_msg_id = str(uuid.uuid4())
        assistant_msg_id = str(uuid.uuid4())
        provider_ids = json.dumps([p.id for p in provider_cards])

        await db.execute(
            "INSERT INTO chat_messages (id, session_id, role, content) VALUES (?, ?, 'user', ?)",
            (user_msg_id, session_id, request.message),
        )
        await db.execute(
            "INSERT INTO chat_messages (id, session_id, role, content, providers_shown) VALUES (?, ?, 'assistant', ?, ?)",
            (assistant_msg_id, session_id, response_text, provider_ids),
        )

        # Update session stats
        await db.execute(
            """UPDATE chat_sessions SET
                message_count = message_count + 2,
                last_message_at = datetime('now')
            WHERE id = ?""",
            (session_id,),
        )
        await db.commit()

        return ChatResponse(
            session_id=session_id,
            response=response_text,
            providers=provider_cards,
            escalate=escalate,
        )
    finally:
        await db.close()


@router.post("/feedback")
async def submit_feedback(request: FeedbackRequest):
    db = await get_db()
    try:
        feedback_id = str(uuid.uuid4())
        await db.execute(
            "INSERT INTO chat_feedback (id, message_id, session_id, rating) VALUES (?, ?, ?, ?)",
            (feedback_id, request.message_id, request.session_id, request.rating),
        )
        await db.commit()
        return {"success": True}
    finally:
        await db.close()


@router.get("/health")
async def health():
    return {"status": "ok"}
