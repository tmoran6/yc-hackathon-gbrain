---
title: Work Recorder
type: project
tags: [work-recorder, capture, gbrain]
---

# Work Recorder

The system that watches a non-technical operator do real work once, turns it
into a reusable [[workflow-capture]], and files it into this brain so agents
can later run the same work.

The premise: small businesses don't write SOPs, prompts, or automations —
they do the work. So the tool does the SOP-writing by observation, the
operator only ever has to confirm and fill in gaps.

## Pipeline

```
Screen Recorder (Swift menu-bar app)
    ↓ frames + audio + session.json
Analyzer (TypeScript + Gemini 2.5)
    ↓ 15s-chunked analysis + synthesized workflow + clarifying questions
Dashboard (Next.js + Supabase)
    ↓ operator review + edits + Q&A answers + "Confirm"
brain/concepts/<slug>.md   ← this brain
    ↓ ./brain/sync.sh
GBrain (PGLite, hybrid search + graph)
    ↓ MCP / CLI / dashboard
Any agent can query and execute the workflow
```

## Components

- **`screen-recorder/`** — Swift menu-bar app. Captures frames at ~2fps,
  optional mic audio, writes `session.json` after registering with the
  dashboard.
- **`analyzer/`** — Node 22, zero-dep. Watches for new recordings, sends
  chunks to Gemini for vision+audio analysis, synthesizes one workflow
  object with trigger/procedure/decisions/exceptions/suggested-automations
  plus 3–6 clarifying questions for the operator.
- **`dashboard/`** — Next.js. Surfaces every session and its draft
  workflow. Operator edits inline, answers the clarifying questions,
  then clicks **Confirm workflow** (or **Discard**). On confirm, the
  merged workflow is written to `brain/concepts/<slug>.md` and a
  background `./brain/sync.sh` re-indexes gbrain.
- **`brain/`** — this directory. GBrain-shaped markdown brain. Source
  of truth is the markdown; the PGLite index at `brain/.gbrain/` is
  per-user, regenerable, gitignored.

## What's in the brain so far

Captured workflows accumulate in `concepts/` as more recordings get
confirmed. The auto-extracted entity graph populates `people/`,
`companies/`, and links between them as those entities appear in real
workflows — no manual curation needed.

## Related

- [[workflow-capture]] — page shape and how to read the captured workflows.

---

## Timeline

- 2026-05-16: Seeded as the top-level orientation page for this project.
