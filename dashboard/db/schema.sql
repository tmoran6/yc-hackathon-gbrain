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
