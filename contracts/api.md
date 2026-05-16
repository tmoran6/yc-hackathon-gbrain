# API Contract — Dashboard ↔ GBrain

Frozen interface. Engineer 1 (UI) and Engineer 2 (routes) both build against
this. Do not change without telling both owners.

Base: the Next.js dashboard (`dashboard/`, runs on `localhost:3000`).

---

## POST /api/brain/commit

Saves a captured skill page into GBrain.

**Request body** (JSON):
```json
{
  "slug": "medication-refill-processing",
  "skillPage": "<full GBrain skill-page markdown — see fixtures/skill-page.md>"
}
```

**Behavior:**
1. Write `skillPage` to `brain/skills/<slug>.md`.
2. Run `gbrain import brain/ --no-embed` then `gbrain embed --stale`.

**Response** (JSON, 200):
```json
{ "ok": true, "slug": "medication-refill-processing", "imported": true }
```

On failure: `{ "ok": false, "error": "<message>" }` with status 500.

---

## POST /api/brain/ask

Asks GBrain a plain-English question; answer comes from committed skills.

**Request body** (JSON):
```json
{ "question": "A patient needs a refill but their insurance was rejected — what do I do?" }
```

**Behavior — IMPORTANT, do NOT use `gbrain query` for the answer.**
`gbrain query`/`ask` synthesis is broken in this environment (hangs 40–120s,
never completes). Use this PROVEN path instead — see `contracts/ask-reference.mjs`
for a working, tested implementation (~8s total, correct answers):

1. **Retrieve** (robust hybrid vector+keyword, capped):
   `timeout 8 gbrain query "<question>" --limit 5 2>/dev/null || true`
   Parse the first line matching `^\[<score>\]  (skills/<slug>)` to get the slug.
   (We cap it because retrieval lines emit at ~4s, then synthesis hangs — we
   discard the hang.)
2. **Get the page:** `gbrain get "<slug>"` — fast, returns full markdown.
3. **Synthesize** with a direct Anthropic API call (`claude-sonnet-4-6`),
   system prompt = "answer using ONLY this skill page", **stream the response**
   to the client.

**Response:** `Content-Type: text/plain; charset=utf-8`, **streamed** (chunked).
The body is the answer text as it is produced. UI renders it incrementally.

On failure: status 500, body = error message.

---

## Mock for Engineer 1 (use until integration)

Until Engineer 2's routes land, point `fetch()` at these local mock routes
returning canned data so the UI is fully testable standalone:

- `POST /api/brain/commit` → `{ "ok": true, "slug": "medication-refill-processing", "imported": true }`
- `POST /api/brain/ask` → stream the answer text from `fixtures/skill-page.md`'s
  exception section, a few words at a time.
