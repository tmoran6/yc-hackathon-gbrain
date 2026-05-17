# g-eyes — landing

Standalone marketing site. No framework, no build step. Three files:

- `index.html` — structure & copy
- `styles.css` — design system tokens (mirrors `/DESIGN.md`)
- `app.js` — the cinematic hero scene + motion

## Run it

```bash
# from repo root
cd landing && python3 -m http.server 4173
# open http://localhost:4173
```

Or any static server (`npx serve`, Caddy, Vercel/Netlify — just deploy the
folder).

## The signature scene

The hero canvas runs a 5-act loop:

1. **Record** — a procedurally-drawn 1998 pharmacy ERP, cursor working the
   refill queue.
2. **See** — an iris/scan sweep recognises the pattern.
3. **Shatter** — the screen breaks into a particle field.
4. **Generate** — the meaningful pixels reassemble into a company-brain graph.
5. **Alive** — the iris core blinks, knowledge pulses to the centre, skills
   are labelled.

`prefers-reduced-motion` renders the final brain state statically (no
particles, no loop). Pauses when off-screen or the tab is hidden.

Design rules live in `/DESIGN.md` and `/CLAUDE.md`. Don't deviate without
updating them.
