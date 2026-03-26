-- ============================================================
-- YouTube Summarizer – initial schema
-- Run this in the Supabase SQL Editor or via psql
-- ============================================================

-- Users (owned by Better Auth)
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  name            TEXT,
  email           TEXT UNIQUE NOT NULL,
  email_verified  BOOLEAN     NOT NULL DEFAULT FALSE,
  image           TEXT,
  created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Sessions (owned by Better Auth)
CREATE TABLE IF NOT EXISTS sessions (
  id              TEXT PRIMARY KEY,
  user_id         TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token           TEXT UNIQUE NOT NULL,
  expires_at      TIMESTAMP   NOT NULL,
  ip_address      TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_token_idx   ON sessions(token);

-- Accounts (Better Auth email/password stores hashed password here)
CREATE TABLE IF NOT EXISTS accounts (
  id                        TEXT PRIMARY KEY,
  user_id                   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id                TEXT NOT NULL,
  provider_id               TEXT NOT NULL,
  access_token              TEXT,
  refresh_token             TEXT,
  access_token_expires_at   TIMESTAMP,
  refresh_token_expires_at  TIMESTAMP,
  scope                     TEXT,
  id_token                  TEXT,
  password                  TEXT,
  created_at                TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts(user_id);

-- Verifications (used by Better Auth for email/password resets etc.)
CREATE TABLE IF NOT EXISTS verifications (
  id          TEXT PRIMARY KEY,
  identifier  TEXT        NOT NULL,
  value       TEXT        NOT NULL,
  expires_at  TIMESTAMP   NOT NULL,
  created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Summaries (application data)
CREATE TABLE IF NOT EXISTS summaries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id     TEXT        NOT NULL,
  video_url    TEXT        NOT NULL,
  title        TEXT,
  thumbnail    TEXT,
  duration     TEXT,
  channel      TEXT,
  summary_data JSONB       NOT NULL,
  transcript   TEXT,
  created_at   TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS summaries_user_video_idx ON summaries(user_id, video_id);
CREATE        INDEX IF NOT EXISTS summaries_user_id_idx    ON summaries(user_id);
CREATE        INDEX IF NOT EXISTS summaries_title_fts_idx  ON summaries USING gin(to_tsvector('english', coalesce(title, '')));
