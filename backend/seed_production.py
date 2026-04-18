"""One-time script to seed Railway PostgreSQL with provider data from local CSV.

Usage:
    export DATABASE_URL="postgresql://postgres:PASSWORD@HOST:PORT/railway"
    python seed_production.py

Or get DATABASE_URL from Railway dashboard → Variables tab.
"""
import asyncio
import os
import sys

# Add parent to path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.csv_importer import parse_csv


async def main():
    database_url = os.getenv("DATABASE_URL", "")
    if not database_url.startswith("postgres"):
        print("ERROR: Set DATABASE_URL to your Railway PostgreSQL connection string.")
        print('  export DATABASE_URL="postgresql://postgres:PASSWORD@HOST:PORT/railway"')
        sys.exit(1)

    import asyncpg
    url = database_url.replace("postgres://", "postgresql://", 1)
    conn = await asyncpg.connect(url)

    # Check current count
    count = await conn.fetchval("SELECT COUNT(*) FROM providers")
    if count > 0:
        print(f"Database already has {count} providers. Skipping seed.")
        print("To force re-seed, run: DELETE FROM providers; in the Railway DB console first.")
        await conn.close()
        return

    # Find CSV
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_candidates = []
    for d in [base_dir, os.path.dirname(os.path.abspath(__file__))]:
        if os.path.isdir(d):
            csv_candidates.extend(
                os.path.join(d, f)
                for f in os.listdir(d)
                if f.endswith(".csv") and "export_members" in f.lower()
            )

    if not csv_candidates:
        print("ERROR: No export_members*.csv file found in project root or backend/")
        sys.exit(1)

    csv_path = csv_candidates[0]
    print(f"Reading CSV: {csv_path}")

    with open(csv_path, encoding="utf-8-sig") as f:
        content = f.read()

    result = parse_csv(content)
    providers = result["valid"]
    print(f"Parsed {len(providers)} valid providers ({len(result['warnings'])} warnings, {len(result['errors'])} errors)")

    if not providers:
        print("No valid providers to import.")
        await conn.close()
        return

    # Insert providers
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
    placeholders = ", ".join(f"${i}" for i in range(1, len(columns) + 1))
    col_names = ", ".join(columns)
    sql = f"INSERT INTO providers ({col_names}) VALUES ({placeholders})"

    imported = 0
    async with conn.transaction():
        for p in providers:
            values = [p.get(col) for col in columns]
            await conn.execute(sql, *values)
            imported += 1
            if imported % 500 == 0:
                print(f"  ...imported {imported}/{len(providers)}")

    print(f"Done! Imported {imported} providers into production database.")
    await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
