"""Database abstraction supporting both SQLite (dev) and PostgreSQL (prod).

Set DATABASE_URL to a postgres:// URI to use PostgreSQL.
Otherwise, falls back to SQLite at DATABASE_PATH.
"""
from __future__ import annotations

import logging
import os
import re
from contextlib import asynccontextmanager

from app.config import DATABASE_PATH

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "")

# Detect engine
_USE_PG = DATABASE_URL.startswith("postgres")


# ---------------------------------------------------------------------------
# Unified DB wrapper — exposes the same interface regardless of backend
# ---------------------------------------------------------------------------

class DB:
    """Thin wrapper around aiosqlite or asyncpg connections."""

    def __init__(self, conn, is_pg: bool):
        self._conn = conn
        self._is_pg = is_pg

    @staticmethod
    def _sqlite_to_pg_placeholders(sql: str) -> str:
        """Convert ? placeholders to $1, $2, ... for asyncpg."""
        parts = sql.split("?")
        if len(parts) == 1:
            return sql
        result = parts[0]
        for i, part in enumerate(parts[1:], start=1):
            result += f"${i}" + part
        return result

    @staticmethod
    def _adapt_sql(sql: str, is_pg: bool) -> str:
        """Rewrite SQLite-specific SQL for PostgreSQL."""
        if not is_pg:
            return sql
        s = sql
        # Timestamp columns are TEXT in the schema (SQLite compat). PG has no
        # implicit cast between TEXT and TIMESTAMPTZ, so a range comparison of a
        # text column against datetime('now' ...) must cast the column first.
        # Only range operators — `=` is overloaded for assignment (UPDATE SET)
        # and its RHS already coerces to TEXT on assignment.
        # Must run BEFORE the bare datetime('now') rewrites below.
        cmp_op = r"(>=|<=|>|<)"
        col_ref = r"(\w+(?:\.\w+)?)"
        s = re.sub(
            rf"{col_ref}\s*{cmp_op}\s*datetime\('now',\s*'(-?\d+)\s+days?'\)",
            r"\1::timestamptz \2 CURRENT_TIMESTAMP + INTERVAL '\3 days'",
            s,
            flags=re.IGNORECASE,
        )
        s = re.sub(
            rf"{col_ref}\s*{cmp_op}\s*datetime\('now'\)",
            r"\1::timestamptz \2 CURRENT_TIMESTAMP",
            s,
            flags=re.IGNORECASE,
        )
        # datetime('now') → CURRENT_TIMESTAMP (remaining assignment/DEFAULT uses)
        s = re.sub(r"datetime\('now'\)", "CURRENT_TIMESTAMP", s, flags=re.IGNORECASE)
        # datetime('now', 'N days') — SQLite signs the magnitude, so use '+' in PG
        # to preserve sign: datetime('now','-7 days') → CURRENT_TIMESTAMP + INTERVAL '-7 days'
        s = re.sub(
            r"datetime\('now',\s*'(-?\d+)\s+days?'\)",
            r"CURRENT_TIMESTAMP + INTERVAL '\1 days'",
            s,
            flags=re.IGNORECASE,
        )
        # date('now') → CURRENT_DATE
        s = re.sub(r"date\('now'\)", "CURRENT_DATE", s, flags=re.IGNORECASE)
        # date(col) → col::date  (cast)
        s = re.sub(r"\bdate\((\w+)\)", r"\1::date", s, flags=re.IGNORECASE)
        # ? → $N
        s = DB._sqlite_to_pg_placeholders(s)
        return s

    async def execute(self, sql: str, params: tuple | list = ()):
        sql = self._adapt_sql(sql, self._is_pg)
        if self._is_pg:
            return await self._conn.execute(sql, *params)
        return await self._conn.execute(sql, params)

    async def executemany(self, sql: str, params_list: list):
        sql = self._adapt_sql(sql, self._is_pg)
        if self._is_pg:
            await self._conn.executemany(sql, params_list)
        else:
            await self._conn.executemany(sql, params_list)

    async def executescript(self, script: str):
        if self._is_pg:
            await self._conn.execute(script)
        else:
            await self._conn.executescript(script)

    async def fetch(self, sql: str, params: tuple | list = ()) -> list[dict]:
        sql = self._adapt_sql(sql, self._is_pg)
        if self._is_pg:
            rows = await self._conn.fetch(sql, *params)
            return [dict(r) for r in rows]
        cursor = await self._conn.execute(sql, params)
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]

    async def fetchone(self, sql: str, params: tuple | list = ()) -> dict | None:
        sql = self._adapt_sql(sql, self._is_pg)
        if self._is_pg:
            row = await self._conn.fetchrow(sql, *params)
            return dict(row) if row else None
        cursor = await self._conn.execute(sql, params)
        row = await cursor.fetchone()
        return dict(row) if row else None

    async def fetchval(self, sql: str, params: tuple | list = ()):
        sql = self._adapt_sql(sql, self._is_pg)
        if self._is_pg:
            return await self._conn.fetchval(sql, *params)
        cursor = await self._conn.execute(sql, params)
        row = await cursor.fetchone()
        return row[0] if row else None

    async def commit(self):
        if not self._is_pg:
            await self._conn.commit()
        # asyncpg auto-commits outside transactions

    async def close(self):
        if self._is_pg:
            await self._conn.close()
        else:
            await self._conn.close()


# ---------------------------------------------------------------------------
# Connection factories
# ---------------------------------------------------------------------------

_pg_pool = None


async def _get_pg_pool():
    global _pg_pool
    if _pg_pool is None:
        import asyncpg
        url = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        _pg_pool = await asyncpg.create_pool(url, min_size=2, max_size=10)
    return _pg_pool


async def get_db() -> DB:
    if _USE_PG:
        pool = await _get_pg_pool()
        conn = await pool.acquire()
        return DB(conn, is_pg=True)
    else:
        import aiosqlite
        conn = await aiosqlite.connect(DATABASE_PATH)
        conn.row_factory = aiosqlite.Row
        await conn.execute("PRAGMA journal_mode=WAL")
        await conn.execute("PRAGMA foreign_keys=ON")
        return DB(conn, is_pg=False)


async def release_db(db: DB):
    """Release a PG connection back to the pool, or close SQLite."""
    if db._is_pg:
        pool = await _get_pg_pool()
        await pool.release(db._conn)
    else:
        await db._conn.close()


# ---------------------------------------------------------------------------
# Schema & seed initialization
# ---------------------------------------------------------------------------

def _adapt_schema_for_pg(schema: str) -> str:
    """Convert SQLite schema DDL to PostgreSQL-compatible DDL."""
    s = schema
    # datetime('now') → CURRENT_TIMESTAMP
    s = re.sub(r"datetime\('now'\)", "CURRENT_TIMESTAMP", s, flags=re.IGNORECASE)
    # INTEGER NOT NULL DEFAULT 0 for booleans → keep as INTEGER (works in PG)
    return s


async def init_db():
    db = await get_db()
    try:
        # Look for schema.sql in multiple locations (local dev vs deployed)
        _base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        candidates = [
            os.path.join(_base, "..", "database", "schema.sql"),  # repo root: database/schema.sql
            os.path.join(_base, "schema.sql"),                     # backend/schema.sql (deployed)
            os.path.join(_base, "database", "schema.sql"),         # backend/database/schema.sql
        ]
        schema_path = next((p for p in candidates if os.path.exists(p)), candidates[0])
        with open(schema_path) as f:
            schema = f.read()

        if _USE_PG:
            schema = _adapt_schema_for_pg(schema)

        await db.executescript(schema)
        await db.commit()

        # Check if seed data needed
        count = await db.fetchval("SELECT COUNT(*) FROM providers")
        if count == 0:
            csv_imported = await _import_csv_seed(db)
            if not csv_imported:
                seed_path = os.path.join(os.path.dirname(schema_path), "seed.sql")
                if os.path.exists(seed_path):
                    with open(seed_path) as f:
                        seed_sql = f.read()
                    if _USE_PG:
                        seed_sql = seed_sql.replace("INSERT OR IGNORE", "INSERT")
                        # Add ON CONFLICT DO NOTHING
                        seed_sql = seed_sql.replace(
                            "VALUES",
                            "VALUES",
                        )
                    await db.executescript(seed_sql)
                    await db.commit()

        # Seed / rotate the canonical admin user. Idempotent: removes legacy
        # rows from previous email schemes, then upserts the canonical admin
        # by primary key so a redeploy carries new credentials through.
        legacy_emails = ("admin@ldapa.org", "admin@ldaofpa.org")
        admin_id = "admin1"
        admin_email = "directory@ldaofpa.org"
        admin_hash = "$2b$12$uf4EEBXQGRweGjCmvcvATewhzhY.MI3GTftMFg5RnwXMHA03iwxYi"
        admin_name = "LDA of PA Admin"

        for legacy in legacy_emails:
            await db.execute(
                "DELETE FROM admin_users WHERE email = ?", (legacy,)
            )

        if _USE_PG:
            await db.execute(
                """INSERT INTO admin_users (id, email, password_hash, name)
                   VALUES ($1, $2, $3, $4)
                   ON CONFLICT (id) DO UPDATE SET
                     email = EXCLUDED.email,
                     password_hash = EXCLUDED.password_hash,
                     name = EXCLUDED.name""",
                (admin_id, admin_email, admin_hash, admin_name),
            )
        else:
            await db.execute(
                """INSERT OR REPLACE INTO admin_users
                   (id, email, password_hash, name)
                   VALUES (?, ?, ?, ?)""",
                (admin_id, admin_email, admin_hash, admin_name),
            )
        await db.commit()
    finally:
        await release_db(db)


async def _import_csv_seed(db: DB) -> bool:
    """Import providers from the LDAPA directory CSV export if available."""
    from app.services.csv_importer import parse_csv

    # Look for CSV in repo root (local dev) and backend dir (deployed)
    _base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    search_dirs = [
        os.path.join(_base, ".."),  # repo root
        _base,                       # backend/
    ]
    csv_candidates = []
    for d in search_dirs:
        d = os.path.abspath(d)
        if os.path.isdir(d):
            csv_candidates.extend(
                os.path.join(d, f)
                for f in os.listdir(d)
                if f.endswith(".csv") and "export_members" in f.lower()
            )

    if not csv_candidates:
        return False

    csv_path = csv_candidates[0]
    logger.info("Importing providers from %s", csv_path)

    with open(csv_path, encoding="utf-8-sig") as f:
        content = f.read()

    result = parse_csv(content)
    providers = result["valid"]

    if not providers:
        logger.warning("CSV parsed but no valid providers found. Errors: %s", result["errors"][:10])
        return False

    columns = [
        "id", "first_name", "last_name", "name", "listing_type", "profession_name",
        "services", "training", "credentials", "license",
        "address", "city", "state", "state_code", "zip_code", "lat", "lon",
        "age_range_served", "grades_offered",
        "price_per_visit", "sliding_scale", "insurance_accepted",
        "ld_adhd_specialty", "learning_difference_support", "adhd_support",
        "student_body_type", "total_size", "average_class_size", "religion",
        "phone", "email", "website", "profile_url",
    ]

    if _USE_PG:
        placeholders = ", ".join(f"${i}" for i in range(1, len(columns) + 1))
    else:
        placeholders = ", ".join("?" for _ in columns)
    col_names = ", ".join(columns)

    for p in providers:
        values = tuple(p.get(col) for col in columns)
        await db.execute(
            f"INSERT INTO providers ({col_names}) VALUES ({placeholders})",
            values,
        )

    await db.commit()
    logger.info("Imported %d providers (%d warnings, %d errors)",
                len(providers), len(result["warnings"]), len(result["errors"]))
    return True
