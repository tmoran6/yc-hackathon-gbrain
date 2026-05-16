/**
 * to-skill-page — bridge from analyzer output to a GBrain skill page.
 *
 * The analyzer (analyze.ts) emits an `analysis.json` describing a recorded work
 * session: per-chunk `steps`, a synthesized `workflow`, and `clarifying_questions`.
 * This module turns that JSON into a GBrain markdown page.
 *
 * GBrain page format (see brain/README.md): two sections separated by `---`.
 *   - Above the line — compiled truth: the current, rewritable view of the skill.
 *   - Below the line — timeline: an append-only evidence log, never rewritten.
 *
 * Zero dependencies: Node 22 built-ins only.
 * Run with:  node --experimental-strip-types to-skill-page.ts <analysis.json> [--out page.md]
 */

import { readFileSync, writeFileSync } from "node:fs";

// ---------- types (mirror analyze.ts output) ----------

export interface Workflow {
  title: string;
  trigger: string;
  apps_involved: string[];
  required_inputs: string[];
  procedure: string[];
  decision_points: string[];
  exceptions: string[];
  suggested_automations: string[];
}

export interface ChunkAnalysis {
  primary_app: string;
  apps: string[];
  action: string;
  intent: string;
  step_by_step: string[];
  ui_elements: string[];
  confidence: number;
}

export interface ChunkResult {
  chunk: number;
  start_sec: number;
  end_sec: number;
  frame_count: number;
  sampled_frames: string[];
  audio_excerpt: string | null;
  analysis: ChunkAnalysis;
}

export interface ClarifyingQuestion {
  id: string;
  question: string;
  why: string;
}

export interface AudioResult {
  available: boolean;
  note?: string;
  summary?: string;
  transcript?: string;
}

export interface AnalyzerOutput {
  generated_at?: string;
  model?: string;
  session?: string;
  session_path?: string;
  duration_sec?: number;
  chunk_seconds?: number;
  frame_count?: number;
  audio?: AudioResult;
  steps?: ChunkResult[];
  workflow: Workflow;
  clarifying_questions?: ClarifyingQuestion[];
}

// ---------- helpers ----------

/** Trim, drop empties, and de-duplicate a string list. */
function clean(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const s = String(raw ?? "").trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function str(v: unknown, fallback = ""): string {
  const s = String(v ?? "").trim();
  return s || fallback;
}

/** Render a bullet list, or an italic placeholder when empty. */
function bullets(items: string[], empty = "_None recorded._"): string {
  return items.length ? items.map((s) => `- ${s}`).join("\n") : empty;
}

/** Render a numbered list, or an italic placeholder when empty. */
function numbered(items: string[], empty = "_None recorded._"): string {
  return items.length ? items.map((s, i) => `${i + 1}. ${s}`).join("\n") : empty;
}

/** Format a chunk window like `0–14.8s`. */
function window(step: ChunkResult): string {
  const a = Number(step.start_sec ?? 0);
  const b = Number(step.end_sec ?? 0);
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  return `${fmt(a)}–${fmt(b)}s`;
}

/** Date portion of an ISO timestamp, or today's date if missing/invalid. */
function dateOf(iso: unknown): string {
  const d = iso ? new Date(String(iso)) : new Date();
  return (isNaN(d.getTime()) ? new Date() : d).toISOString().slice(0, 10);
}

// ---------- section builders ----------

function compiledTruth(o: AnalyzerOutput): string {
  const w = o.workflow;
  const title = str(w?.title, "Untitled workflow");
  const trigger = str(w?.trigger, "_Not captured._");
  const apps = clean(w?.apps_involved);
  const lines: string[] = [];

  lines.push(`# ${title}`);
  lines.push("");
  lines.push(
    "> Skill captured from observed work. Compiled truth above the line, " +
      "append-only evidence below it. Review and refine before turning into agents.",
  );
  lines.push("");
  lines.push(`**Trigger:** ${trigger}`);
  lines.push(`**Apps involved:** ${apps.length ? apps.join(", ") : "_None captured._"}`);
  lines.push("**Status:** Draft — pending operator review");
  lines.push("");
  lines.push("## Required inputs");
  lines.push("");
  lines.push(bullets(clean(w?.required_inputs)));
  lines.push("");
  lines.push("## Procedure");
  lines.push("");
  lines.push(numbered(clean(w?.procedure)));
  lines.push("");
  lines.push("## Decision points");
  lines.push("");
  lines.push(bullets(clean(w?.decision_points)));
  lines.push("");
  lines.push("## Exceptions");
  lines.push("");
  lines.push(bullets(clean(w?.exceptions)));
  lines.push("");
  lines.push("## Suggested automations");
  lines.push("");
  lines.push(bullets(clean(w?.suggested_automations)));

  return lines.join("\n");
}

function timeline(o: AnalyzerOutput): string {
  const date = dateOf(o.generated_at);
  const lines: string[] = [];

  lines.push("## Timeline");
  lines.push("");

  // Capture entry header.
  const session = str(o.session, "unknown session");
  const meta: string[] = [];
  if (o.duration_sec != null) meta.push(`${Number(o.duration_sec).toFixed(1)}s recording`);
  if (o.frame_count != null) meta.push(`${o.frame_count} frames`);
  if (o.model) meta.push(`model ${o.model}`);
  const metaStr = meta.length ? ` (${meta.join(", ")})` : "";

  lines.push(`### ${date} — Captured from screen recording`);
  lines.push("");
  lines.push(`Source session \`${session}\`${metaStr}.`);

  // Narration, if any.
  if (o.audio?.available && o.audio.summary) {
    lines.push("");
    lines.push(`**Narration:** ${str(o.audio.summary)}`);
  }

  // Observed steps, one per chunk.
  const steps = Array.isArray(o.steps) ? o.steps : [];
  if (steps.length) {
    lines.push("");
    lines.push("#### Observed steps");
    lines.push("");
    for (const step of steps) {
      const a = step.analysis ?? ({} as ChunkAnalysis);
      const app = str(a.primary_app, "Unknown app");
      const action = str(a.action, "(no action recorded)");
      const conf =
        typeof a.confidence === "number"
          ? ` _(confidence ${Math.round(a.confidence * 100)}%)_`
          : "";
      lines.push(`- **${window(step)} — ${app}:** ${action}${conf}`);
      for (const sub of clean(a.step_by_step)) {
        lines.push(`  - ${sub}`);
      }
    }
  }

  // Clarifying questions raised during review.
  const questions = Array.isArray(o.clarifying_questions) ? o.clarifying_questions : [];
  if (questions.length) {
    lines.push("");
    lines.push("#### Clarifying questions for the operator");
    lines.push("");
    for (const q of questions) {
      const question = str(q.question);
      if (!question) continue;
      const why = str(q.why);
      lines.push(`- ${question}${why ? ` — _${why}_` : ""}`);
    }
  }

  return lines.join("\n");
}

// ---------- public API ----------

/**
 * Convert an analyzer output object into a GBrain skill-page markdown string.
 * Throws if the input has no `workflow` object.
 */
export function toSkillPage(output: AnalyzerOutput): string {
  if (!output || typeof output !== "object" || !output.workflow) {
    throw new Error("analyzer output is missing the required `workflow` object");
  }
  return `${compiledTruth(output)}\n\n---\n\n${timeline(output)}\n`;
}

/** Parse an analyzer JSON file and render its skill page. */
export function skillPageFromFile(path: string): string {
  const raw = readFileSync(path, "utf8");
  let parsed: AnalyzerOutput;
  try {
    parsed = JSON.parse(raw) as AnalyzerOutput;
  } catch (e) {
    throw new Error(`could not parse JSON from ${path}: ${String(e)}`);
  }
  return toSkillPage(parsed);
}

// ---------- CLI ----------

function main(): void {
  const args = process.argv.slice(2);
  const positional = args.filter((a) => !a.startsWith("--"));
  const outIdx = args.indexOf("--out");
  const outPath = outIdx >= 0 ? args[outIdx + 1] : undefined;
  const input = positional[0];

  if (!input) {
    console.error(
      "usage: node --experimental-strip-types to-skill-page.ts <analysis.json> [--out page.md]",
    );
    process.exit(1);
  }

  const page = skillPageFromFile(input);

  if (outPath) {
    writeFileSync(outPath, page);
    console.error(`✓ skill page written to ${outPath}`);
  } else {
    process.stdout.write(page);
  }
}

// Run only when invoked directly, not when imported.
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (e) {
    console.error(`! ${String(e)}`);
    process.exit(1);
  }
}
