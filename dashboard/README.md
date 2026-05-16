# Footage dashboard

Tiny Next.js app + API routes for the Hackathon footage capture flow.

Stack:

- Next.js (App Router) + TypeScript
- `pg` (node-postgres) talking to Supabase Postgres over the session pooler
- Screenshots stored as `bytea` directly in the `screenshots` table (yes, we
  know, it's a hackathon)

## Upload flow

Two steps. The API only mints rows; the client writes the blob straight to
Postgres.

1. **Reserve a row.**
   ```sh
   curl -X POST http://localhost:3000/api/uploads \
     -H 'Content-Type: application/json' \
     -d '{"username":"tmoran","captured_at":"2026-05-16T18:00:00Z","content_type":"image/png"}'
   # → { "id": "b00a5276-...", "status": "pending", ... }
   ```

2. **Client writes the blob over a direct Postgres connection.** Cast `$1`
   to `bytea` so the driver doesn't try to deduce two types for one slot:
   ```sql
   UPDATE screenshots
      SET image_data   = $1::bytea,
          content_type = $2,
          byte_size    = octet_length($1::bytea),
          status       = 'uploaded',
          uploaded_at  = now()
    WHERE id = $3 AND status = 'pending';
   ```

`POST /api/uploads` body fields:

| field          | type     | required | notes                          |
| -------------- | -------- | -------- | ------------------------------ |
| `username`     | string   | yes      | free-form, no auth             |
| `captured_at`  | string   | yes      | ISO 8601                       |
| `content_type` | string   | no       | e.g. `image/png`               |
| `metadata`     | object   | no       | stored as JSONB                |

`GET /api/uploads?limit=50&username=tmoran` returns the recent rows (without
the blob).

## Local dev

```sh
cd dashboard
npm install
cp .env.example .env.local   # fill in DATABASE_URL
npm run db:init              # applies db/schema.sql
npm run dev
```

`.env.local` is already populated with the hackathon Supabase pooler string.

## Supabase notes

- We use the **session pooler** (`aws-1-us-east-1.pooler.supabase.com:5432`,
  user `postgres.<project-ref>`) because Supabase's direct connection is
  IPv6-only and breaks on most local networks and on Vercel's free tier.
- SSL is on with `rejectUnauthorized: false` — Supabase serves a cert the
  default Node trust store doesn't accept. Fine for a hackathon.

## Vercel deploy

You don't need anything custom — Next.js works out of the box. After pushing:

1. Import the repo on Vercel and set the project's **Root Directory** to
   `dashboard/`.
2. Add a project env var: `DATABASE_URL` = the same session-pooler URL.
3. Deploy. That's it.

Run `npm run db:init` once locally to apply the schema (or `psql -f
db/schema.sql ...`) — Vercel won't run migrations for you.

## Schema

See [db/schema.sql](db/schema.sql). One table, `screenshots`, with status
`pending → uploaded`.
