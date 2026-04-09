-- LDAPA Intelligent Portal Database Schema
-- Compatible with both SQLite (dev) and PostgreSQL (production/Supabase)

-- ============================================
-- PROVIDERS
-- ============================================
CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    name TEXT NOT NULL,                    -- "first_name last_name"
    listing_type TEXT,                     -- 'Individual' or 'Company'
    profession_name TEXT NOT NULL,         -- 'Tutor','Health_Professional','Lawyer','School','Advocate'
    services TEXT,                         -- sub-services: "Therapist,Doctor=>Psychiatrist"
    training TEXT,                         -- methodology/certs: "Wilson Language", "Orton-Gillingham"
    credentials TEXT,                      -- license numbers
    license TEXT,                          -- license type

    -- Location
    address TEXT,
    city TEXT,
    state TEXT DEFAULT 'PA',
    state_code TEXT DEFAULT 'PA',
    zip_code TEXT,
    lat REAL,
    lon REAL,

    -- Ages & grades
    age_range_served TEXT,                -- "Adults, Teens" or "4-65"
    grades_offered TEXT,                  -- school-only: "Grades 1-8"

    -- Pricing & insurance
    price_per_visit TEXT,                 -- "$150 - $250"
    sliding_scale INTEGER DEFAULT 0,
    insurance_accepted TEXT,              -- "Aetna, Cigna, Highmark"

    -- Specialty flags
    ld_adhd_specialty INTEGER DEFAULT 0,
    learning_difference_support INTEGER DEFAULT 0,
    adhd_support INTEGER DEFAULT 0,

    -- School-specific
    student_body_type TEXT,
    total_size TEXT,
    average_class_size TEXT,
    religion TEXT,

    -- Contact
    phone TEXT,
    email TEXT,
    website TEXT,
    profile_url TEXT,

    -- Admin/meta
    verification_status TEXT NOT NULL DEFAULT 'unverified',
    last_verified_at TEXT,
    staff_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_providers_city ON providers (city);
CREATE INDEX IF NOT EXISTS idx_providers_zip ON providers (zip_code);
CREATE INDEX IF NOT EXISTS idx_providers_state ON providers (state_code);
CREATE INDEX IF NOT EXISTS idx_providers_status ON providers (verification_status);
CREATE INDEX IF NOT EXISTS idx_providers_profession ON providers (profession_name);

-- ============================================
-- CHAT SESSIONS (anonymous)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    user_location TEXT,                   -- JSON: { city, zip } or null
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_message_at TEXT NOT NULL DEFAULT (datetime('now')),
    message_count INTEGER NOT NULL DEFAULT 0,
    escalated INTEGER NOT NULL DEFAULT 0
);

-- ============================================
-- CHAT MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL,                    -- 'user' or 'assistant'
    content TEXT NOT NULL,
    providers_shown TEXT DEFAULT '[]',     -- JSON array of provider IDs
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages (session_id, created_at);

-- ============================================
-- CHAT FEEDBACK
-- ============================================
CREATE TABLE IF NOT EXISTS chat_feedback (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    rating TEXT NOT NULL,                  -- 'up' or 'down'
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_feedback_session ON chat_feedback (session_id);

-- ============================================
-- ADMIN USERS
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
