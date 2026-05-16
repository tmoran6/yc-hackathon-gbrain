# Footage dashboard

Tiny Next.js app + API routes for the Hackathon footage capture flow.

Stack:

- Next.js (App Router) + TypeScript
- `pg` (node-postgres) talking to Supabase Postgres over the session pooler
- Supabase Storage for screenshot frames and transcript chunks (clients
  upload directly — the API only mints session rows)

## Upload flow

Three steps. The API mints a session and hands the client the Storage
coordinates; the client then uploads each file straight to Supabase Storage.

1. **Register a session.**
   ```sh
   curl -X POST http://localhost:3000/api/sessions \
     -H 'Content-Type: application/json' \
     -d '{"username":"tmoran"}'
   # → {
   #     "id": "b00a5276-...",
   #     "username": "tmoran",
   #     "status": "active",
   #     "started_at": "...",
   #     "storage": {
   #       "url": "https://<project>.supabase.co",
   #       "key": "<anon-or-service-role-key>",
   #       "bucket": "recordings",
   #       "screenshots_prefix": "b00a5276-.../screenshots/",
   #       "transcripts_prefix": "b00a5276-.../transcripts/"
   #     }
   #   }
   ```

2. **Upload a screenshot directly to Supabase Storage.**
   ```sh
   curl -X POST \
     "$SUPABASE_URL/storage/v1/object/recordings/$SESSION_ID/screenshots/frame_000000.png" \
     -H "Authorization: Bearer $SUPABASE_KEY" \
     -H 'Content-Type: image/png' \
     --data-binary @frame_000000.png
   ```

3. **Upload a transcript chunk directly to Supabase Storage.**
   ```sh
   curl -X POST \
     "$SUPABASE_URL/storage/v1/object/recordings/$SESSION_ID/transcripts/chunk_0000.txt" \
     -H "Authorization: Bearer $SUPABASE_KEY" \
     -H 'Content-Type: text/plain' \
     --data-binary @chunk_0000.txt
   ```

4. **End the session.**
   ```sh
   curl -X POST http://localhost:3000/api/sessions/$SESSION_ID/end
   ```

`POST /api/sessions` body fields:

| field      | type   | required | notes              |
| ---------- | ------ | -------- | ------------------ |
| `username` | string | yes      | free-form, no auth |
| `metadata` | object | no       | stored as JSONB    |

`GET /api/sessions?limit=50&username=tmoran` lists recent sessions.

## Local dev

```sh
cd dashboard
npm install
cp .env.example .env.local   # fill in DATABASE_URL + SUPABASE_*
npm run db:init              # applies db/schema.sql
npm run dev
```

## Supabase notes

- Postgres uses the **session pooler**
  (`aws-1-us-east-1.pooler.supabase.com:5432`, user `postgres.<project-ref>`)
  because the direct connection is IPv6-only and breaks on most local networks
  and on Vercel's free tier.
- SSL is on with `rejectUnauthorized: false` — Supabase serves a cert the
  default Node trust store doesn't accept. Fine for a hackathon.
- Create the storage bucket once (default name: `recordings`). Easiest is
  the Supabase dashboard → Storage → New bucket → public. For a hackathon
  the simplest setup is a **public** bucket; if you'd rather keep it private,
  use the service role key for `SUPABASE_ANON_KEY` so the client uploads
  authenticate as the service role.

## Vercel deploy

1. Import the repo on Vercel and set **Root Directory** to `dashboard/`.
2. Add env vars: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
   `SUPABASE_BUCKET`.
3. Deploy.

Run `npm run db:init` once locally to apply the schema (or `psql -f
db/schema.sql ...`) — Vercel won't run migrations for you.

## Schema

See [db/schema.sql](db/schema.sql). One table, `sessions`, with status
`active → ended`.
