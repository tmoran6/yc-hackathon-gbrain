/**
 * Work Recorder — local analysis pipeline.
 *
 * Reads a screen-recorder session (frames + optional audio.m4a), groups frames
 * into fixed-length chunks (default 15s), samples a few frames per chunk, asks
 * Gemini what app is in use / what the user is doing / their intent, transcribes
 * audio if present, then synthesizes one reusable-workflow object.
 *
 * Zero dependencies: Node 22 built-in fetch + macOS `sips` for downscaling.
 * Run with:  node --experimental-strip-types analyze.ts [options]
 */

import { readdirSync, readFileSync, writeFileSync, statSync, existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join, basename } from "node:path";
import { homedir, tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

// ---------- types ----------

interface FrameInfo {
  file: string;
  path: string;
  index: number;
  ts: Date;
  offsetSec: number; // seconds since first frame
}

interface ChunkAnalysis {
  primary_app: string;
  apps: string[];
  action: string;
  intent: string;
  step_by_step: string[];
  ui_elements: string[];
  confidence: number;
}

interface ChunkResult {
  chunk: number;
  start_sec: number;
  end_sec: number;
  frame_count: number;
  sampled_frames: string[];
  audio_excerpt: string | null;
  analysis: ChunkAnalysis;
}

interface AudioResult {
  available: boolean;
  note?: string;
  summary?: string;
  transcript?: string;
  segments?: { start: number; end: number; text: string }[];
}

interface Workflow {
  title: string;
  trigger: string;
  apps_involved: string[];
  required_inputs: string[];
  procedure: string[];
  decision_points: string[];
  exceptions: string[];
  suggested_automations: string[];
}

interface Options {
  session: string | null;
  chunkSeconds: number;
  framesPerChunk: number;
  model: string;
  apiKey: string;
  concurrency: number;
  watch: boolean;
  idleSeconds: number;
  maxDim: number;
  jpegQuality: number;
  dryRun: boolean;
  dashboardURL: string;
  force: boolean;
}

// ---------- config / args ----------

const RECORDINGS_DIR = join(homedir(), "Movies", "ScreenRecorder");
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function loadDotEnv() {
  // Load analyzer/.env into process.env (built-in, zero-dep). Existing env wins.
  const envPath = join(import.meta.dirname, ".env");
  if (!existsSync(envPath)) return;
  try {
    process.loadEnvFile(envPath);
  } catch (e) {
    console.error(`! failed to load ${envPath}: ${String(e)}`);
  }
}

function parseArgs(): Options {
  loadDotEnv();
  const a = process.argv.slice(2);
  const get = (name: string): string | undefined => {
    const i = a.indexOf(name);
    return i >= 0 ? a[i + 1] : undefined;
  };
  const has = (name: string): boolean => a.includes(name);

  const keyFile = join(import.meta.dirname, ".gemini.key");
  const apiKey =
    get("--api-key") ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    (existsSync(keyFile) ? readFileSync(keyFile, "utf8").trim() : "");

  return {
    session: get("--session") || null,
    chunkSeconds: Number(get("--chunk-seconds") || 15),
    framesPerChunk: Number(get("--frames-per-chunk") || 4),
    model: get("--model") || process.env.GEMINI_MODEL || "gemini-2.5-flash",
    apiKey,
    concurrency: Number(get("--concurrency") || 4),
    watch: has("--watch"),
    idleSeconds: Number(get("--idle-seconds") || 8),
    maxDim: Number(get("--max-dim") || 1280),
    jpegQuality: Number(get("--jpeg-quality") || 65),
    dryRun: has("--dry-run"),
    force: has("--force"),
    dashboardURL: (
      get("--dashboard-url") ||
      process.env.DASHBOARD_URL ||
      "http://localhost:3000"
    ).replace(/\/+$/, ""),
  };
}

// ---------- session discovery ----------

function listSessions(): string[] {
  if (!existsSync(RECORDINGS_DIR)) return [];
  return readdirSync(RECORDINGS_DIR)
    .filter((d) => d.startsWith("session_"))
    .map((d) => join(RECORDINGS_DIR, d))
    .filter((p) => {
      try {
        return statSync(p).isDirectory();
      } catch {
        return false;
      }
    })
    .sort();
}

function latestSession(): string | null {
  const s = listSessions();
  return s.length ? s[s.length - 1] : null;
}

const FRAME_RE = /^frame_(\d+)_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})-(\d{3})\.png$/;

function readFrames(sessionDir: string): FrameInfo[] {
  const frames: FrameInfo[] = [];
  for (const file of readdirSync(sessionDir)) {
    const m = FRAME_RE.exec(file);
    if (!m) continue;
    const [, idx, Y, Mo, D, H, Mi, S, ms] = m;
    const ts = new Date(
      Number(Y),
      Number(Mo) - 1,
      Number(D),
      Number(H),
      Number(Mi),
      Number(S),
      Number(ms),
    );
    frames.push({ file, path: join(sessionDir, file), index: Number(idx), ts, offsetSec: 0 });
  }
  frames.sort((x, y) => x.index - y.index);
  if (frames.length) {
    const t0 = frames[0].ts.getTime();
    for (const f of frames) f.offsetSec = (f.ts.getTime() - t0) / 1000;
  }
  return frames;
}

function groupIntoChunks(frames: FrameInfo[], chunkSeconds: number): FrameInfo[][] {
  const chunks: FrameInfo[][] = [];
  for (const f of frames) {
    const ci = Math.floor(f.offsetSec / chunkSeconds);
    (chunks[ci] ||= []).push(f);
  }
  // collapse holes (sparse arrays) into a dense list
  return chunks.filter((c) => c && c.length);
}

function pickEvenly<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr;
  const out: T[] = [];
  for (let i = 0; i < n; i++) {
    out.push(arr[Math.round((i * (arr.length - 1)) / (n - 1))]);
  }
  return out;
}

// ---------- image downscale (macOS sips, no deps) ----------

function frameToJpegBase64(srcPath: string, tmpDir: string, maxDim: number, quality: number): string {
  const out = join(tmpDir, basename(srcPath).replace(/\.png$/, "") + ".jpg");
  try {
    execFileSync(
      "sips",
      ["-s", "format", "jpeg", "-s", "formatOptions", String(quality), "-Z", String(maxDim), srcPath, "--out", out],
      { stdio: "ignore" },
    );
    return readFileSync(out).toString("base64");
  } catch {
    // fall back to the raw PNG if sips is unavailable
    return readFileSync(srcPath).toString("base64");
  }
}

// ---------- Gemini call ----------

async function geminiJSON(
  opts: Options,
  parts: unknown[],
  schema: unknown,
  retries = 3,
): Promise<any> {
  const url = `${GEMINI_BASE}/${opts.model}:generateContent?key=${opts.apiKey}`;
  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  };

  let lastErr = "";
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        lastErr = `HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`;
        if (res.status === 429 || res.status >= 500) {
          await sleep(1000 * (attempt + 1) ** 2);
          continue;
        }
        throw new Error(lastErr);
      }
      const data: any = await res.json();
      const cand = data?.candidates?.[0];
      const text: string | undefined = cand?.content?.parts?.map((p: any) => p.text).join("") ?? undefined;
      if (!text) {
        lastErr = `no text in response (finishReason=${cand?.finishReason}, block=${JSON.stringify(data?.promptFeedback ?? {})})`;
        await sleep(800 * (attempt + 1));
        continue;
      }
      return JSON.parse(stripFences(text));
    } catch (e) {
      lastErr = String(e);
      await sleep(800 * (attempt + 1));
    }
  }
  throw new Error(`Gemini call failed after retries: ${lastErr}`);
}

function stripFences(s: string): string {
  const t = s.trim();
  if (t.startsWith("```")) return t.replace(/^```[a-z]*\n?/i, "").replace(/```$/, "").trim();
  return t;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------- prompts / schemas ----------

const CHUNK_SCHEMA = {
  type: "object",
  properties: {
    primary_app: { type: "string" },
    apps: { type: "array", items: { type: "string" } },
    action: { type: "string" },
    intent: { type: "string" },
    step_by_step: { type: "array", items: { type: "string" } },
    ui_elements: { type: "array", items: { type: "string" } },
    confidence: { type: "number" },
  },
  required: ["primary_app", "apps", "action", "intent", "step_by_step", "ui_elements", "confidence"],
};

function chunkPrompt(chunkIdx: number, startSec: number, endSec: number, audioExcerpt: string | null): string {
  return [
    `You are analyzing a screen recording of someone doing real work.`,
    `These are sequential screenshots from chunk #${chunkIdx} covering ${startSec.toFixed(0)}s–${endSec.toFixed(0)}s of the session (captured at ~2 fps, sampled).`,
    audioExcerpt ? `Narration heard during this chunk: """${audioExcerpt}"""` : ``,
    ``,
    `Return ONLY JSON with:`,
    `- primary_app: the main application in focus (e.g. "Google Chrome", "Slack", "Toast POS"). Read window titles/UI to be specific.`,
    `- apps: every distinct app/website visible across these frames.`,
    `- action: concretely what the user is doing right now in this chunk (1–2 sentences).`,
    `- intent: the goal behind it — why they are doing this, what outcome they want.`,
    `- step_by_step: ordered granular steps observed within this chunk (clicks, typing, navigation).`,
    `- ui_elements: notable buttons/fields/screens that matter for reproducing the task.`,
    `- confidence: 0–1, how sure you are.`,
    `Be specific and grounded in what is actually visible. Do not invent steps you cannot see.`,
  ]
    .filter(Boolean)
    .join("\n");
}

const AUDIO_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    transcript: { type: "string" },
    segments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          start: { type: "number" },
          end: { type: "number" },
          text: { type: "string" },
        },
        required: ["start", "end", "text"],
      },
    },
  },
  required: ["summary", "transcript", "segments"],
};

const WORKFLOW_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    trigger: { type: "string" },
    apps_involved: { type: "array", items: { type: "string" } },
    required_inputs: { type: "array", items: { type: "string" } },
    procedure: { type: "array", items: { type: "string" } },
    decision_points: { type: "array", items: { type: "string" } },
    exceptions: { type: "array", items: { type: "string" } },
    suggested_automations: { type: "array", items: { type: "string" } },
  },
  required: [
    "title",
    "trigger",
    "apps_involved",
    "required_inputs",
    "procedure",
    "decision_points",
    "exceptions",
    "suggested_automations",
  ],
};

// ---------- audio ----------

async function analyzeAudio(opts: Options, sessionDir: string): Promise<AudioResult> {
  const audioPath = join(sessionDir, "audio.m4a");
  if (!existsSync(audioPath)) return { available: false, note: "no audio.m4a in session" };

  const sizeMB = statSync(audioPath).size / (1024 * 1024);
  if (sizeMB > 18) {
    return { available: false, note: `audio too large for inline (${sizeMB.toFixed(1)}MB); needs Gemini Files API` };
  }

  const b64 = readFileSync(audioPath).toString("base64");
  const parts = [
    {
      text:
        "Transcribe this work-session narration. Return JSON: summary (what the person explained they were doing), " +
        "transcript (full text), segments (array of {start,end,text} in seconds relative to audio start). " +
        "If silent/no speech, return empty transcript and a note in summary.",
    },
    { inline_data: { mime_type: "audio/mp4", data: b64 } },
  ];
  try {
    const r = await geminiJSON(opts, parts, AUDIO_SCHEMA);
    return {
      available: true,
      summary: r.summary,
      transcript: r.transcript,
      segments: r.segments ?? [],
    };
  } catch (e) {
    return { available: false, note: `audio analysis failed: ${String(e)}` };
  }
}

function audioForChunk(audio: AudioResult, startSec: number, endSec: number): string | null {
  if (!audio.available || !audio.segments?.length) return null;
  const hit = audio.segments
    .filter((s) => s.end >= startSec && s.start <= endSec)
    .map((s) => s.text.trim())
    .filter(Boolean)
    .join(" ");
  return hit || null;
}

// ---------- pipeline ----------

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

async function analyzeSession(opts: Options, sessionDir: string) {
  const name = basename(sessionDir);
  const frames = readFrames(sessionDir);
  if (!frames.length) throw new Error(`no frames found in ${sessionDir}`);

  const durationSec = frames[frames.length - 1].offsetSec;
  console.log(`\n▶ Session: ${name}`);
  console.log(`  frames: ${frames.length}  duration: ${durationSec.toFixed(1)}s  chunk: ${opts.chunkSeconds}s`);

  console.log(`  → analyzing audio…`);
  const audio = await analyzeAudio(opts, sessionDir);
  console.log(`    audio: ${audio.available ? "transcribed" : audio.note}`);

  const chunks = groupIntoChunks(frames, opts.chunkSeconds);
  console.log(`  → ${chunks.length} chunks, calling Gemini (${opts.model}, concurrency ${opts.concurrency})…`);

  const tmpDir = mkdtempSync(join(tmpdir(), "wr-frames-"));
  let results: ChunkResult[];
  try {
    results = await mapPool(chunks, opts.concurrency, async (chunkFrames, i) => {
      const startSec = chunkFrames[0].offsetSec;
      const endSec = chunkFrames[chunkFrames.length - 1].offsetSec;
      const sampled = pickEvenly(chunkFrames, opts.framesPerChunk);
      const audioExcerpt = audioForChunk(audio, startSec, endSec);

      const parts: unknown[] = [{ text: chunkPrompt(i, startSec, endSec, audioExcerpt) }];
      for (const f of sampled) {
        parts.push({
          inline_data: {
            mime_type: "image/jpeg",
            data: frameToJpegBase64(f.path, tmpDir, opts.maxDim, opts.jpegQuality),
          },
        });
      }

      const analysis = (await geminiJSON(opts, parts, CHUNK_SCHEMA)) as ChunkAnalysis;
      process.stdout.write(`    ✓ chunk ${i} (${startSec.toFixed(0)}–${endSec.toFixed(0)}s): ${analysis.primary_app} — ${analysis.action}\n`);
      return {
        chunk: i,
        start_sec: Number(startSec.toFixed(2)),
        end_sec: Number(endSec.toFixed(2)),
        frame_count: chunkFrames.length,
        sampled_frames: sampled.map((f) => f.file),
        audio_excerpt: audioExcerpt,
        analysis,
      } as ChunkResult;
    });
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log(`  → synthesizing reusable workflow…`);
  const workflow = await synthesizeWorkflow(opts, results, audio);

  const output = {
    generated_at: new Date().toISOString(),
    model: opts.model,
    session: name,
    session_path: sessionDir,
    duration_sec: Number(durationSec.toFixed(2)),
    chunk_seconds: opts.chunkSeconds,
    frame_count: frames.length,
    audio,
    steps: results,
    workflow,
  };

  const sessionOut = join(sessionDir, "analysis.json");
  const repoOut = join(import.meta.dirname, "out", `${name}.analysis.json`);
  mkdirSync(join(import.meta.dirname, "out"), { recursive: true });
  writeFileSync(sessionOut, JSON.stringify(output, null, 2));
  writeFileSync(repoOut, JSON.stringify(output, null, 2));

  printSummary(output);
  console.log(`\n✓ Written:\n  ${sessionOut}\n  ${repoOut}\n`);

  await pushAnalysis(opts, sessionDir, output);
  return output;
}

// Push the analysis to the dashboard, which upserts it into the Supabase
// `analysis` table keyed by the session_id the screen-recorder wrote into
// session.json. Best-effort: a failure here never fails the local analysis.
async function pushAnalysis(opts: Options, sessionDir: string, output: unknown) {
  const manifestPath = join(sessionDir, "session.json");
  if (!existsSync(manifestPath)) {
    console.log(
      `  ⓘ no session.json in ${basename(sessionDir)} — skipping dashboard push`,
    );
    console.log(
      `    (the screen-recorder writes it after it registers the session)`,
    );
    return;
  }

  let sessionId: string | undefined;
  try {
    sessionId = JSON.parse(readFileSync(manifestPath, "utf8"))?.session_id;
  } catch (e) {
    console.error(`  ✗ could not parse ${manifestPath}: ${String(e)}`);
    return;
  }
  if (!sessionId) {
    console.error(`  ✗ session.json has no session_id — skipping push`);
    return;
  }

  const url = `${opts.dashboardURL}/api/sessions/${sessionId}/analysis`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ recording: basename(sessionDir), result: output }),
    });
    if (!res.ok) {
      console.error(
        `  ✗ dashboard push failed HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`,
      );
      return;
    }
    const row: any = await res.json().catch(() => ({}));
    console.log(
      `  ✓ pushed analysis → Supabase (analysis ${row.id ?? "ok"}) for session ${sessionId}`,
    );
  } catch (e) {
    console.error(
      `  ✗ dashboard push error: ${String(e)} — is the dashboard running at ${opts.dashboardURL}?`,
    );
  }
}

async function synthesizeWorkflow(opts: Options, results: ChunkResult[], audio: AudioResult): Promise<Workflow> {
  const digest = results.map((r) => ({
    chunk: r.chunk,
    window: `${r.start_sec}-${r.end_sec}s`,
    app: r.analysis.primary_app,
    action: r.analysis.action,
    intent: r.analysis.intent,
    steps: r.analysis.step_by_step,
  }));
  const parts = [
    {
      text: [
        "Below is a step-by-step analysis of a recorded work session (one entry per ~15s chunk).",
        audio.available && audio.summary ? `Narration summary: ${audio.summary}` : "",
        "",
        JSON.stringify(digest, null, 2),
        "",
        "Synthesize ONE reusable workflow that captures this task so it could be turned into an automation/skill.",
        "Return JSON: title, trigger (what kicks this off), apps_involved, required_inputs,",
        "procedure (clean ordered steps, deduplicated across chunks), decision_points (branches/conditions),",
        "exceptions (what can go wrong / needs a human), suggested_automations (concrete agents that could do parts of this).",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
  return (await geminiJSON(opts, parts, WORKFLOW_SCHEMA)) as Workflow;
}

function printSummary(o: any) {
  console.log(`\n────────── WORKFLOW: ${o.workflow.title} ──────────`);
  console.log(`Trigger: ${o.workflow.trigger}`);
  console.log(`Apps: ${o.workflow.apps_involved.join(", ")}`);
  console.log(`\nProcedure:`);
  o.workflow.procedure.forEach((s: string, i: number) => console.log(`  ${i + 1}. ${s}`));
  if (o.workflow.decision_points.length) {
    console.log(`\nDecision points:`);
    o.workflow.decision_points.forEach((s: string) => console.log(`  • ${s}`));
  }
  if (o.workflow.suggested_automations.length) {
    console.log(`\nSuggested automations:`);
    o.workflow.suggested_automations.forEach((s: string) => console.log(`  • ${s}`));
  }
}

// ---------- watch mode ----------

async function watchAndAnalyze(opts: Options) {
  console.log(`👀 Watch mode — waiting for an active recording session in ${RECORDINGS_DIR}`);
  console.log(`   (start/stop the recording in the Swift menu-bar app; analysis runs ${opts.idleSeconds}s after frames stop)`);
  console.log(`   on stop: analyze → POST ${opts.dashboardURL}/api/sessions/<id>/analysis → Supabase analysis table`);

  const analyzed = new Set<string>();
  let lastCount = -1;
  let idleTicks = 0;

  for (;;) {
    const sessionDir = opts.session || latestSession();
    if (sessionDir && !analyzed.has(sessionDir)) {
      const frames = existsSync(sessionDir)
        ? readdirSync(sessionDir).filter((f) => FRAME_RE.test(f)).length
        : 0;

      if (frames > 0 && frames === lastCount) {
        idleTicks++;
        if (idleTicks * 2 >= opts.idleSeconds) {
          console.log(`\n⏹ Recording idle (${frames} frames). Analyzing ${basename(sessionDir)}…`);
          try {
            await analyzeSession(opts, sessionDir);
          } catch (e) {
            console.error(`✗ analysis failed: ${String(e)}`);
          }
          analyzed.add(sessionDir);
          lastCount = -1;
          idleTicks = 0;
        }
      } else {
        if (frames !== lastCount && frames > 0) {
          process.stdout.write(`\r   recording… ${frames} frames captured   `);
        }
        idleTicks = 0;
        lastCount = frames;
      }
    }
    await sleep(2000);
  }
}

// ---------- main ----------

function dryRun(sessionDir: string, opts: Options) {
  const name = basename(sessionDir);
  const frames = readFrames(sessionDir);
  if (!frames.length) {
    console.error(`✗ no frames found in ${sessionDir}`);
    process.exit(1);
  }
  const chunks = groupIntoChunks(frames, opts.chunkSeconds);
  const dur = frames[frames.length - 1].offsetSec;
  console.log(`\n▶ DRY RUN — ${name}`);
  console.log(`  frames: ${frames.length}  duration: ${dur.toFixed(1)}s  chunk: ${opts.chunkSeconds}s`);
  console.log(`  audio.m4a: ${existsSync(join(sessionDir, "audio.m4a")) ? "present" : "none"}`);
  console.log(`  ${chunks.length} chunks (sampling ${opts.framesPerChunk} frames/chunk):`);
  chunks.forEach((c, i) => {
    const s = c[0].offsetSec;
    const e = c[c.length - 1].offsetSec;
    const sampled = pickEvenly(c, opts.framesPerChunk).map((f) => f.index);
    console.log(`    chunk ${i}: ${s.toFixed(1)}–${e.toFixed(1)}s  (${c.length} frames)  → send frames ${sampled.join(", ")}`);
  });
  console.log(`\n(no API calls made — drop --dry-run to run the real analysis)\n`);
}

async function main() {
  const opts = parseArgs();

  if (opts.dryRun) {
    const sd = opts.session || latestSession();
    if (!sd) {
      console.error(`✗ No session found in ${RECORDINGS_DIR}`);
      process.exit(1);
    }
    dryRun(sd, opts);
    return;
  }

  if (!opts.apiKey) {
    console.error(
      [
        "✗ No Gemini API key found.",
        "Provide it one of these ways:",
        "  • analyzer/.env  ->  GEMINI_API_KEY=your_key",
        "  • export GEMINI_API_KEY=your_key",
        "  • pass --api-key your_key",
        "Get a key at https://aistudio.google.com/apikey",
      ].join("\n"),
    );
    process.exit(1);
  }

  if (opts.watch) {
    await watchAndAnalyze(opts);
    return;
  }

  if (opts.session) {
    await analyzeSession(opts, opts.session);
    return;
  }

  const sessions = listSessions();
  if (!sessions.length) {
    console.error(`✗ No sessions found. Record something with the Swift app, or pass --session <dir>.`);
    console.error(`  Looked in: ${RECORDINGS_DIR}`);
    process.exit(1);
  }

  const pending = opts.force
    ? sessions
    : sessions.filter((d) => !existsSync(join(d, "analysis.json")));
  const skipped = sessions.length - pending.length;

  console.log(`Found ${sessions.length} session(s)${skipped ? ` — skipping ${skipped} already analyzed (use --force to re-run)` : ""}.`);
  if (!pending.length) {
    console.log(`Nothing to do.`);
    return;
  }

  let failed = 0;
  for (let i = 0; i < pending.length; i++) {
    const dir = pending[i];
    console.log(`\n[${i + 1}/${pending.length}] ${basename(dir)}`);
    try {
      await analyzeSession(opts, dir);
    } catch (e) {
      failed++;
      console.error(`✗ Failed on ${basename(dir)}: ${(e as Error).message}`);
    }
  }
  if (failed) {
    console.error(`\n${failed} session(s) failed.`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
