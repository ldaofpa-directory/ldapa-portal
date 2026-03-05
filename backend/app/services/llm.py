from __future__ import annotations

import json
import logging
import re

from openai import AsyncOpenAI
from app.config import OPENAI_API_KEY, LLM_MODEL
from app.prompts.filter_extraction import FILTER_EXTRACTION_PROMPT
from app.prompts.response_generation import RESPONSE_GENERATION_PROMPT

logger = logging.getLogger(__name__)

# Singleton client — reuses HTTP connection pool across requests
_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI | None:
    global _client
    if not OPENAI_API_KEY:
        return None
    if _client is None:
        _client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    return _client


VALID_SERVICE_TYPES = {"evaluator", "tutor", "advocate", "therapist", "school_psychologist", "clinic", "support_group", "nonprofit_org"}
VALID_SPECIALIZATIONS = {"dyslexia", "adhd", "dyscalculia", "dysgraphia", "general_ld", "adult_ld", "iep_504", "workplace_accommodations"}
VALID_COST_TIERS = {"free", "sliding_scale", "low_cost", "standard"}
VALID_AGE_GROUPS = {"children", "adolescents", "adults"}


def _validate_filters(raw: dict) -> dict:
    """Validate and coerce LLM-extracted filters to expected types."""
    return {
        "service_types": [s for s in raw.get("service_types", []) or [] if s in VALID_SERVICE_TYPES],
        "specializations": [s for s in raw.get("specializations", []) or [] if s in VALID_SPECIALIZATIONS],
        "cost_tier": [s for s in raw.get("cost_tier", []) or [] if s in VALID_COST_TIERS],
        "location": {
            "city": raw.get("location", {}).get("city") if isinstance(raw.get("location"), dict) else None,
            "zip": raw.get("location", {}).get("zip") if isinstance(raw.get("location"), dict) else None,
        },
        "age_group": [s for s in raw.get("age_group", []) or [] if s in VALID_AGE_GROUPS],
        "needs_providers": bool(raw.get("needs_providers", False)),
        "needs_more_info": bool(raw.get("needs_more_info", False)),
        "escalate": bool(raw.get("escalate", False)),
        "search_text": str(raw.get("search_text", ""))[:200],
    }


async def extract_filters(conversation_history: list[dict]) -> dict:
    client = get_client()
    if not client:
        return _fallback_filter_extraction(conversation_history)

    input_messages = [
        {"role": "developer", "content": FILTER_EXTRACTION_PROMPT},
        *[{"role": msg["role"], "content": msg["content"]} for msg in conversation_history],
    ]

    try:
        response = await client.responses.create(
            model=LLM_MODEL,
            input=input_messages,
            reasoning={"effort": "low"},
            text={"format": {"type": "json_object"}},
        )
        text = response.output_text.strip()
        raw = json.loads(text)
        return _validate_filters(raw)
    except Exception:
        logger.exception("Filter extraction failed")
        return _fallback_filter_extraction(conversation_history)


async def generate_response(
    conversation_history: list[dict], provider_context: str
) -> str:
    client = get_client()
    if not client:
        return _fallback_response(conversation_history, provider_context)

    system_prompt = RESPONSE_GENERATION_PROMPT.format(
        provider_context=provider_context
    )

    input_messages = [
        {"role": "developer", "content": system_prompt},
        *[{"role": msg["role"], "content": msg["content"]} for msg in conversation_history],
    ]

    try:
        response = await client.responses.create(
            model=LLM_MODEL,
            input=input_messages,
            reasoning={"effort": "low"},
        )
        return response.output_text
    except Exception:
        logger.exception("Response generation failed")
        return _fallback_response(conversation_history, provider_context)


def _fallback_filter_extraction(conversation_history: list[dict]) -> dict:
    """Simple keyword-based filter extraction when no LLM is available."""
    last_message = conversation_history[-1]["content"].lower() if conversation_history else ""
    all_text = " ".join(m["content"].lower() for m in conversation_history)

    filters = {
        "service_types": [],
        "specializations": [],
        "cost_tier": [],
        "location": {"city": None, "zip": None},
        "age_group": [],
        "needs_providers": False,
        "needs_more_info": False,
        "escalate": False,
        "search_text": "",
    }

    # Service types
    service_keywords = {
        "evaluator": ["evaluation", "evaluate", "assessed", "assessment", "testing"],
        "tutor": ["tutor", "tutoring", "reading help", "math help"],
        "advocate": ["advocate", "advocacy", "iep meeting", "school meeting"],
        "therapist": ["therapy", "therapist", "counseling", "counselor"],
        "support_group": ["support group", "parent group", "community"],
    }
    for stype, keywords in service_keywords.items():
        if any(k in all_text for k in keywords):
            filters["service_types"].append(stype)

    # Specializations
    spec_keywords = {
        "dyslexia": ["dyslexia", "reading disability", "reading difficulties", "struggling with reading"],
        "adhd": ["adhd", "attention deficit", "focus", "attention"],
        "dyscalculia": ["dyscalculia", "math disability", "math difficulties"],
        "general_ld": ["learning disability", "learning difficulties", "struggling in school"],
        "adult_ld": ["adult", "workplace", "college"],
        "iep_504": ["iep", "504", "accommodation"],
    }
    for spec, keywords in spec_keywords.items():
        if any(k in all_text for k in keywords):
            filters["specializations"].append(spec)

    # Age groups
    if any(w in all_text for w in ["child", "kid", "son", "daughter", "elementary", "grade"]):
        filters["age_group"].append("children")
    if any(w in all_text for w in ["teen", "adolescent", "high school", "middle school"]):
        filters["age_group"].append("adolescents")
    if any(w in all_text for w in ["adult", "myself", "i have", "i think i", "workplace"]):
        filters["age_group"].append("adults")

    # Cost
    if any(w in all_text for w in ["free", "no cost", "affordable", "cheap", "low cost", "can't afford"]):
        filters["cost_tier"] = ["free", "sliding_scale", "low_cost"]

    # Location - look for PA cities
    pa_cities = ["pittsburgh", "philadelphia", "erie", "harrisburg", "allentown", "state college", "washington"]
    for city in pa_cities:
        if city in all_text:
            filters["location"]["city"] = city.title()
            break

    # Zip code
    zip_match = re.search(r"\b(\d{5})\b", all_text)
    if zip_match:
        filters["location"]["zip"] = zip_match.group(1)

    # Needs providers
    if filters["service_types"] or filters["specializations"] or any(
        w in last_message for w in ["find", "recommend", "help", "need", "looking for", "where"]
    ):
        filters["needs_providers"] = True

    # Escalation
    if any(w in last_message for w in ["crisis", "self-harm", "suicide", "abuse", "emergency"]):
        filters["escalate"] = True

    filters["search_text"] = last_message[:100]

    # If we couldn't extract any meaningful filters, ask for more info
    has_useful_filters = (
        filters["service_types"]
        or filters["specializations"]
        or filters["age_group"]
        or filters["location"]["city"]
        or filters["location"]["zip"]
    )
    filters["needs_more_info"] = filters["needs_providers"] and not has_useful_filters

    return filters


def _fallback_response(conversation_history: list[dict], provider_context: str) -> str:
    """Basic response when no LLM is available."""
    is_first = len(conversation_history) <= 1

    if provider_context == "_ESCALATE_":
        response = (
            "I can see you're going through a really difficult time, and I want to make sure you get the right support. "
            "Please reach out to LDAPA directly at their main office, or if this is an emergency, please call 911 or the "
            "988 Suicide & Crisis Lifeline (call or text 988). You're not alone, and help is available."
        )
    elif provider_context and provider_context.strip() and provider_context != "No matching providers found in the directory.":
        response = "Thank you for reaching out! Based on what you've told me, here are some resources that might help.\n\n[PROVIDERS]\n\nWould you like to know more about any of these providers, or is there something else I can help you with?"
    else:
        response = "Thank you for reaching out to LDAPA! I'd love to help you find the right support. Could you tell me a bit more about what you're looking for? For example:\n\n- Are you looking for an evaluation, tutoring, therapy, or advocacy help?\n- What area of Pennsylvania are you in?\n- Is this for a child, teen, or adult?\n\nThe more details you share, the better I can help match you with the right resources."

    if is_first:
        response += "\n\nJust so you know — I provide general information to help you get started, not professional diagnosis or legal advice. For specific guidance, connecting with a qualified professional is always a good idea."

    return response
