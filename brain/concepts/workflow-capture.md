---
title: Workflow Capture
type: note
tags: [workflow, capture, schema]
---

# Workflow Capture

A **captured workflow** is a real procedure, observed by the [[work-recorder]]
while a human did the task, then confirmed by that human in the dashboard
review screen. It is not a hypothesis or a draft — every page in this brain
typed `workflow` was reviewed and signed off before it landed.

## Where they live

All captured workflows live in `concepts/` with `type: workflow` in the
frontmatter. One page per workflow (not per recording). Re-recording the same
workflow updates the above-the-line and appends a timeline entry below.

## Page shape

Each workflow page has the same sections:

- **Trigger** — what kicks the work off (an email, a clock time, a phone call).
- **Apps involved** — every distinct app/website touched during the work.
- **Required inputs** — what the operator needs in hand before starting.
- **Procedure** — ordered, deduplicated steps. Reflects the way the work
  was actually done, not the idealized version.
- **Decision points** — branches where the operator chose between paths
  (insurance denied → escalate, in-stock → fulfill).
- **Exceptions** — failure modes and edge cases that need a human or break
  the happy path.
- **Suggested automations** — concrete agents that could take over part
  of the flow.
- **Operator notes** — Q&A the operator filled in to cover what the
  recording alone couldn't show (hidden criteria, frequency, handoffs).

The above-the-line is compiled truth, kept current. The below-the-line
timeline is append-only — every confirmation adds a dated entry, never
rewrites history.

## How agents should use these

1. **Before doing routine work**, search for a matching workflow first.
   The procedure reflects the way this operator actually does it, not
   the textbook way.
2. **Pay attention to decision points and exceptions** — those are where
   the operator's judgment lives, and where naive automation will fail.
3. **Operator notes are gold** — they hold the criteria and tradeoffs
   the operator couldn't fit into the procedure steps.
4. **Suggested automations are leads, not specs** — they're the agent
   shape the recording implied, but the human reviewer didn't necessarily
   approve them as ready to ship.

## Related

- [[work-recorder]] — the system that captures these workflows.

---

## Timeline

- 2026-05-16: Seeded as the canonical reference for `type: workflow` pages.
