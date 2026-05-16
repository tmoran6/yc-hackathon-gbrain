-- Screenshots / footage uploaded by clients.
--
-- Flow:
--   1. Client POSTs to /api/uploads with { username, captured_at } and gets
--      back an id. Row is created with status='pending', image_data=NULL.
--   2. Client connects directly to Postgres and writes the blob:
--        UPDATE screenshots
--           SET image_data = $1,
--               content_type = $2,
--               byte_size = octet_length($1),
--               status = 'uploaded',
--               uploaded_at = now()
--         WHERE id = $3 AND status = 'pending';
--
-- bytea is not ideal for huge blobs but is fine for hackathon-scale frames.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS screenshots (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  username      text        NOT NULL,
  captured_at   timestamptz NOT NULL,
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'uploaded', 'failed')),
  content_type  text,
  byte_size     integer,
  image_data    bytea,
  metadata      jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  uploaded_at   timestamptz
);

CREATE INDEX IF NOT EXISTS screenshots_username_captured_at_idx
  ON screenshots (username, captured_at DESC);

CREATE INDEX IF NOT EXISTS screenshots_status_idx
  ON screenshots (status);
