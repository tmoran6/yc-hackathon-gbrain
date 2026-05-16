# Integrating Workflow Analysis Into gbrain

How the Work Recorder / Brainseed pipeline (see [IDEATION.md](IDEATION.md)) plugs into gbrain. Companion to the standalone [brain/README.md](brain/README.md) setup guide.

## The mental model

Treat gbrain as the **workflow library + similarity engine + agent learning loop** that sits *downstream* of the local analysis pipeline. The existing pieces stay as-is:

- `screen-recorder/` (Swift) — captures screen + audio, transcribes via ElevenLabs
- `dashboard/` (Next.js + Supabase) — session viewer
- *(new)* Local analyzer — segments a session into a structured workflow via a local LLM (mlx / ollama / similar)
- *(new)* gbrain — stores workflows as markdown, finds similar past ones, extracts which apps / people / decisions are involved, surfaces patterns over time

The "workflow analysis is local" constraint maps cleanly to this split:

- **Local-only**: screen frames, raw video, the LLM that converts frames → workflow description
- **Cloud-OK**: the workflow markdown itself (steps, app names, decisions) — this is what gbrain embeds and indexes. Raw frames never leave the laptop.

## What flows into gbrain

After local analysis spits out a structured workflow, write it as a markdown page:

```markdown
brain/workflows/morning-prep-2026-05-16.md
---
title: Morning Prep
captured: 2026-05-16T07:14:00Z
session_id: rec_abc123
apps: [pos-square, shopify, slack]
actor: maria
---

## Steps
1. Open POS dashboard
2. Check yesterday's sales by item
...

## Decision points
- If inventory < 20% of weekly avg → order from supplier
...

---

## Timeline
- 2026-05-16: First capture (rec_abc123, 4m32s recording)
- 2026-05-18: Second capture confirmed steps 1-6, step 7 differed (rec_def456)
```

That follows gbrain's two-layer pattern (compiled truth above `---`, append-only timeline below). New schema directories to add: `brain/workflows/`, `brain/apps/`, optionally `brain/skills/` (one page per generated GStack skill).

## What gbrain gives you for free

Things you'd otherwise have to build:

1. **"Have I seen this workflow before?"** — vector search across past workflows. Two recordings of "morning prep" cluster; you propose a merge instead of creating duplicate skills.
2. **Entity graph** — every workflow page gets auto-linked to the apps / people it mentions. Query: "every workflow that touches Shopify" or "every workflow Maria does."
3. **Cross-workflow patterns** — nightly "dream cycle" can detect "every time refill workflow runs, insurance check follows" → propose composition.
4. **Skill grounding** — generated GStack skills cite the workflow pages, which cite the source recordings. Auditable end-to-end.
5. **Confidence over time** — 5 recordings of the same workflow = high confidence, propose promotion to autonomous skill. 1 recording = draft.

## What gbrain doesn't help with

- The hard part: local LLM segmentation of video + transcript into structured steps. That's the moat — gbrain just stores the output.
- Real-time UI feedback during recording — gbrain is batch.
- Multi-user shared state during the hackathon — PGLite is per-laptop; cross-user would need the Supabase / `gbrain serve --http` topology (see [brain/README.md](brain/README.md)).

## The main tradeoff

gbrain is opinionated about slugs, MECE filing, page format, and the two-layer pattern. If you treat it as "just a vector DB" you'll fight it. If you write workflow pages in its native format from the start (LLM-suggested slug, dedup check before create, two-layer pages), it'll do the heavy lifting. Cost is ~30 min of designing the page schema upfront.

The alternative is Supabase Postgres + pgvector + a custom workflow table. Less ceremony, but you'd reimplement the entity graph, timeline pattern, dedup, and cross-workflow pattern detection yourself.

## Concrete next steps

1. Decide the workflow page schema — frontmatter fields, section structure, dedup/merge rules.
2. Add `brain/workflows/`, `brain/apps/`, `brain/skills/` with resolver READMEs.
3. Write a small `analyzer → brain page` writer (~50 lines, Python or Node) that local analysis calls after segmenting a session.
4. Have the dashboard query gbrain (via `gbrain serve --http` MCP or shell out to the CLI) to surface "similar workflows" and "captured workflows" lists.
