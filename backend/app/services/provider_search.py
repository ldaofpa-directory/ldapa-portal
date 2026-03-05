from __future__ import annotations

import json
from app.database import get_db


def _escape_like(value: str) -> str:
    """Escape special LIKE pattern characters."""
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


async def search_providers(filters: dict, db=None) -> list[dict]:
    close_db = db is None
    if db is None:
        db = await get_db()
    try:
        conditions = ["p.is_deleted = 0", "p.verification_status = 'verified'"]
        params = []

        # Service types filter
        if filters.get("service_types"):
            service_conditions = []
            for st in filters["service_types"]:
                service_conditions.append("p.service_types LIKE ?")
                params.append(f"%{st}%")
            conditions.append(f"({' OR '.join(service_conditions)})")

        # Specializations filter
        if filters.get("specializations"):
            spec_conditions = []
            for sp in filters["specializations"]:
                spec_conditions.append("p.specializations LIKE ?")
                params.append(f"%{sp}%")
            conditions.append(f"({' OR '.join(spec_conditions)})")

        # Cost tier filter
        if filters.get("cost_tier"):
            cost_placeholders = ",".join("?" for _ in filters["cost_tier"])
            conditions.append(f"p.cost_tier IN ({cost_placeholders})")
            params.extend(filters["cost_tier"])

        # Age group filter
        if filters.get("age_group"):
            age_conditions = []
            for ag in filters["age_group"]:
                age_conditions.append("p.serves_ages LIKE ?")
                params.append(f"%{ag}%")
            conditions.append(f"({' OR '.join(age_conditions)})")

        # Location filter
        location = filters.get("location", {})
        if location.get("city"):
            conditions.append("LOWER(p.city) = LOWER(?)")
            params.append(location["city"])
        if location.get("zip"):
            conditions.append("p.zip_code = ?")
            params.append(location["zip"])

        where_clause = " AND ".join(conditions)

        # Build relevance scoring with search text
        search_text = filters.get("search_text", "")
        order_clause = "p.name ASC"
        if search_text:
            order_clause = """
                CASE
                    WHEN LOWER(p.name) LIKE LOWER(?) ESCAPE '\\' THEN 1
                    WHEN LOWER(p.description) LIKE LOWER(?) ESCAPE '\\' THEN 2
                    WHEN LOWER(p.organization) LIKE LOWER(?) ESCAPE '\\' THEN 3
                    ELSE 4
                END, p.name ASC
            """
            search_param = f"%{_escape_like(search_text)}%"
            params.extend([search_param, search_param, search_param])

        query = f"""
            SELECT p.* FROM providers p
            WHERE {where_clause}
            ORDER BY {order_clause}
            LIMIT 5
        """

        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()

        providers = []
        for row in rows:
            providers.append(_row_to_dict(row))

        return providers
    finally:
        if close_db:
            await db.close()


async def get_all_providers(
    search: str = "",
    status: str = "",
    service_type: str = "",
    city: str = "",
    page: int = 1,
    per_page: int = 20,
    include_deleted: bool = False,
) -> tuple[list[dict], int]:
    db = await get_db()
    try:
        conditions = []
        params = []

        if not include_deleted:
            conditions.append("p.is_deleted = 0")

        if status:
            conditions.append("p.verification_status = ?")
            params.append(status)

        if service_type:
            conditions.append("p.service_types LIKE ?")
            params.append(f"%{service_type}%")

        if city:
            conditions.append("LOWER(p.city) LIKE LOWER(?)")
            params.append(f"%{city}%")

        if search:
            conditions.append(
                "(LOWER(p.name) LIKE LOWER(?) OR LOWER(p.organization) LIKE LOWER(?) OR LOWER(p.description) LIKE LOWER(?))"
            )
            params.extend([f"%{search}%"] * 3)

        where_clause = " AND ".join(conditions) if conditions else "1=1"
        offset = (page - 1) * per_page

        count_query = f"SELECT COUNT(*) FROM providers p WHERE {where_clause}"
        cursor = await db.execute(count_query, params)
        row = await cursor.fetchone()
        total = row[0]

        query = f"""
            SELECT p.* FROM providers p
            WHERE {where_clause}
            ORDER BY p.updated_at DESC
            LIMIT ? OFFSET ?
        """
        params.extend([per_page, offset])

        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()

        providers = [_row_to_dict(row) for row in rows]
        return providers, total
    finally:
        await db.close()


async def get_provider_by_id(provider_id: str) -> dict | None:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM providers WHERE id = ? AND is_deleted = 0", (provider_id,)
        )
        row = await cursor.fetchone()
        if row:
            return _row_to_dict(row)
        return None
    finally:
        await db.close()


def _row_to_dict(row) -> dict:
    d = dict(row)
    # Parse JSON arrays
    for field in ["service_types", "specializations", "serves_ages"]:
        if isinstance(d.get(field), str):
            try:
                d[field] = json.loads(d[field])
            except (json.JSONDecodeError, TypeError):
                d[field] = []
    # Convert booleans
    for field in ["insurance_accepted", "accepts_medicaid", "is_deleted"]:
        if field in d:
            d[field] = bool(d[field])
    return d


def format_provider_context(providers: list[dict]) -> str:
    if not providers:
        return "No matching providers found in the directory."

    lines = []
    for p in providers:
        parts = [f"- {p['name']}"]
        if p.get("organization"):
            parts.append(f"  Organization: {p['organization']}")
        parts.append(f"  Services: {', '.join(p.get('service_types', []))}")
        if p.get("specializations"):
            parts.append(f"  Specializations: {', '.join(p['specializations'])}")
        parts.append(f"  Location: {p.get('city', '')}, {p.get('state', 'PA')} {p.get('zip_code', '')}")
        parts.append(f"  Cost: {p.get('cost_tier', 'unknown')}")
        if p.get("insurance_accepted"):
            parts.append("  Accepts insurance")
        if p.get("accepts_medicaid"):
            parts.append("  Accepts Medicaid")
        if p.get("phone"):
            parts.append(f"  Phone: {p['phone']}")
        if p.get("website"):
            parts.append(f"  Website: {p['website']}")
        if p.get("description"):
            parts.append(f"  Description: {p['description'][:200]}")
        lines.append("\n".join(parts))

    return "\n\n".join(lines)
