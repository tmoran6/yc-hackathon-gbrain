-- Recording sessions. Each click of "Start Recording" mints a new session row.
--
-- Flow:
--   1. Client POSTs to /api/sessions with { username } and gets back a session
--      id plus the Supabase Storage coordinates (url, key, bucket, prefixes).
--   2. Client uploads PNG frames directly to Supabase Storage at
--        <bucket>/<session_id>/screenshots/<seq>.png
--   3. Client uploads transcript chunks directly to Supabase Storage at
--        <bucket>/<session_id>/transcripts/<index>.txt
--   4. Client POSTs to /api/sessions/<id>/end when stopping.
--
-- No per-file rows in Postgres — the file list lives in Storage. Hackathon.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS screenshots;

CREATE TABLE IF NOT EXISTS sessions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  username    text        NOT NULL,
  status      text        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'ended')),
  started_at  timestamptz NOT NULL DEFAULT now(),
  ended_at    timestamptz,
  metadata    jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_username_started_at_idx
  ON sessions (username, started_at DESC);

CREATE INDEX IF NOT EXISTS sessions_status_idx
  ON sessions (status);

-- Analysis results from the local analyzer (Gemini-based).
-- One row per session (PK on session_id). `result` is the raw analyzer JSON;
-- `edits` overlays user edits made in the dashboard review screen.
CREATE TABLE IF NOT EXISTS analysis (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid        NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  recording     text,
  result        jsonb       NOT NULL,
  edits         jsonb       NOT NULL DEFAULT '{}'::jsonb,
  review_state  text        NOT NULL DEFAULT 'user_review'
                            CHECK (review_state IN ('user_review', 'confirmed', 'discarded')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Idempotent column adds for pre-existing analysis tables that pre-date the
-- review-state / edits columns.
ALTER TABLE analysis
  ADD COLUMN IF NOT EXISTS edits        jsonb       NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE analysis
  ADD COLUMN IF NOT EXISTS review_state text        NOT NULL DEFAULT 'user_review';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'analysis_review_state_check'
  ) THEN
    ALTER TABLE analysis
      ADD CONSTRAINT analysis_review_state_check
      CHECK (review_state IN ('user_review', 'confirmed', 'discarded'));
  END IF;
END$$;
