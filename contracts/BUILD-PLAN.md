# Build Plan — "Teach the pharmacy's brain by doing the work once"

Hackathon, submit 19:00. Target prize: gbrain.io "AI for Mom & Pops".

## What we're building

Owner records ONE pharmacy task → it becomes a GBrain skill → anyone can ask
the brain how to do that task. Demo: a new hire asks "insurance got rejected on
a refill, what do I do?" and the brain answers — because the owner did it once.

## The loop

```
screen-recorder (exists) → analyzer JSON (exists) → skill-page generator (NEW)
   → GBrain (gbrain import/embed) → "Ask your Brain" UI (NEW) → gbrain query
```

## Who does what

**Gas Town swarm (Mayor) — ALL the code, in parallel:**
- gb-1  Skill-page generator: `fixtures/analyzer-output.json` → skill-page markdown
- gb-2  API routes `/api/brain/commit` + `/api/brain/ask` (see contracts/api.md)
- gb-3  Dashboard UI: capture card, "Commit to Brain", "Ask your Brain" chat
- gb-4  Mock pharmacy ERP — polish the refill flow so it records clean
- gb-5  Brain seeding: skill template + pre-seeded pages + `gbrain` search config

**External engineers — small, important, human-only tasks:**
- Eng 1: record the real demo session with the screen-recorder (the golden take)
- Eng 2: stand up `gbrain` + API keys on the DEMO LAPTOP, verify the loop runs

**You:** orchestrate with the Mayor, own the demo script + rehearsal.

## Why nothing blocks

Every code task builds against `fixtures/` + `contracts/` — never against
another task's output. Integration (swap mocks for real wiring) is the last
45 min, handled by the Mayor.
