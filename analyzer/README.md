# Work Recorder — Analyzer

Turns a screen-recorder session into a structured workflow JSON, locally.

```
frames + audio.m4a  ─►  15s chunks  ─►  Gemini (vision + audio)  ─►  analysis.json
```

Per chunk you get: **which app**, **what they're doing**, **the intent**, and a
**step-by-step**. Then it synthesizes one reusable workflow (trigger, inputs,
procedure, decision points, exceptions, suggested automations).

Zero dependencies — Node 22's built-in `fetch` + macOS `sips` for downscaling.
No `npm install`, no `tsx`.

## Setup (once)

Get a Gemini key at https://aistudio.google.com/apikey, then either:

```sh
export GEMINI_API_KEY=your_key
# or:
echo "your_key" > analyzer/.gemini.key   # gitignored
```

## Demo flow (with the Swift app running)

```sh
cd analyzer

# 1. Start watching BEFORE you record
npm run watch

# 2. In the menu-bar app: Log In → Start Recording → do the task → Stop Recording
#    Analysis auto-runs ~8s after frames stop, prints the workflow,
#    and writes analysis.json into the session folder + analyzer/out/.
```

Or analyze a finished recording on demand:

```sh
npm run analyze                       # newest session
npm run analyze -- --session ~/Movies/ScreenRecorder/session_2026-05-16_11-53-52
```

## Auto-push to Supabase

Run the analyzer as a long-lived watcher (the "server" — no per-recording
command needed):

```sh
cd analyzer
npm run watch          # stays running; analyzes + pushes every recording
```

End-to-end on every recording:

1. Screen-recorder registers the session with the dashboard, gets a
   `session_id`, and writes it into the recording folder as `session.json`.
2. ~8s after frames stop, the watcher analyzes the session.
3. It reads `session.json` and `POST`s the result to
   `DASHBOARD_URL/api/sessions/<session_id>/analysis`, which upserts one row
   into the Supabase `analysis` table (FK → `sessions.id`, JSON `result`).

`DASHBOARD_URL` defaults to `http://localhost:3000`; override in
`analyzer/.env` or with `--dashboard-url`. Requires the Next.js dashboard
running (the recorder already needs it to register sessions). If `session.json`
is missing (older recordings), analysis still runs locally — the push is just
skipped.

## Options

| flag | default | meaning |
|---|---|---|
| `--session <dir>` | newest | which recording to analyze |
| `--chunk-seconds <n>` | `15` | step length |
| `--frames-per-chunk <n>` | `4` | frames sampled per step (sent to the model) |
| `--model <id>` | `gemini-2.5-flash` | Gemini model (`gemini-2.5-pro` for deeper reasoning) |
| `--concurrency <n>` | `4` | parallel chunk requests |
| `--idle-seconds <n>` | `8` | watch mode: analyze after frames stop this long |
| `--max-dim <px>` | `1280` | frame downscale long edge |
| `--jpeg-quality <n>` | `65` | frame JPEG quality |
| `--watch` | off | watch for the active session, auto-analyze on stop |

## Output

`analysis.json` (also copied to `analyzer/out/<session>.analysis.json`):

```jsonc
{
  "session": "session_2026-05-16_11-53-52",
  "duration_sec": 37.4,
  "audio": { "available": false, "note": "no audio.m4a in session" },
  "steps": [
    {
      "chunk": 0,
      "start_sec": 0, "end_sec": 14.8,
      "analysis": {
        "primary_app": "Google Chrome",
        "apps": ["Google Chrome", "Gmail"],
        "action": "Reading and replying to a customer email",
        "intent": "Respond to a catering inquiry",
        "step_by_step": ["Opened Gmail", "Clicked the inquiry", "Started a reply"],
        "ui_elements": ["Compose button", "Reply box"],
        "confidence": 0.82
      }
    }
  ],
  "workflow": {
    "title": "Respond to catering inquiry",
    "trigger": "New catering email arrives",
    "apps_involved": ["Gmail"],
    "required_inputs": ["Customer email", "Menu/pricing"],
    "procedure": ["..."],
    "decision_points": ["..."],
    "exceptions": ["..."],
    "suggested_automations": ["Draft-reply agent", "..."]
  }
}
```
