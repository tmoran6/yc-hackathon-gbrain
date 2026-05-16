# skills

Reusable workflows captured from someone doing the work once.

Each page is a **skill** — a repeatable business task the company brain can be
asked about. Skills are generated from screen recordings (see `analyzer/` and
`screen-recorder/`), reviewed by the owner, then committed here. Once committed,
`gbrain` indexes them and anyone can ask the brain how the task is done.

Filename: kebab-case of the task name, e.g. `medication-refill-processing.md`.

## Page format

Skill pages follow the brain's two-section format (see `brain/README.md`):

- **Above the `---`** — the compiled skill: trigger, apps, inputs, procedure,
  decision points, exceptions, suggested automations. Rewritten as the workflow
  is refined.
- **Below the `---`** — an append-only `## Timeline` of when and how the skill
  was captured and updated. Never rewritten.

Copy `_template.md` to start a new skill page.
