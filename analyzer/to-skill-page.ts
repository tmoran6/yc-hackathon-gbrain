/**
 * Skill-page generator.
 *
 * Converts the analyzer's JSON output into a GBrain skill-page markdown file.
 *
 * Usage (exported function):
 *   import { toSkillPage } from "./to-skill-page.ts";
 *   const md = toSkillPage(analyzerOutput);
 *
 * Usage (CLI):
 *   node --experimental-strip-types analyzer/to-skill-page.ts <path-to-analyzer-output.json>
 *
 * Zero dependencies — Node 22 built-in only.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------- types ----------

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

interface AnalyzerOutput {
  generated_at: string;
  model: string;
  session: string;
  session_path: string;
  duration_sec: number;
  chunk_seconds?: number;
  frame_count: number;
  audio?: {
    summary?: string;
    available?: boolean;
    note?: string;
  };
  steps?: Array<{
    chunk: number;
    app?: string;
    doing?: string;
    intent?: string;
    analysis?: {
      primary_app?: string;
      action?: string;
      intent?: string;
    };
  }>;
  workflow: Workflow;
  clarifying_questions?: Array<{
    id: string;
    question: string;
    why: string;
  }>;
}

// ---------- helpers ----------

/**
 * Formats a date string (ISO 8601 or similar) as YYYY-MM-DD.
 * Falls back to the raw value if parsing fails.
 */
function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return iso;
  }
}

/**
 * Parses an exception string into a bolded label + body.
 *
 * Expected input formats:
 *   "Insurance is rejected: contact the prescriber..."
 *   "Refill is too early: tell the patient..."
 *   "No refills remaining: fax or message..."
 *
 * Splits on the first ": " and bolds the label portion.
 * If there is no ": ", the entire string is returned as-is (no label).
 */
function formatException(raw: string): string {
  const colonIdx = raw.indexOf(": ");
  if (colonIdx === -1) {
    // No colon separator — treat the whole thing as body, no label
    return raw;
  }
  const label = raw.slice(0, colonIdx).trim();
  const body = raw.slice(colonIdx + 2).trim();
  // Capitalise first letter of body if not already
  const bodyNorm = body.charAt(0).toUpperCase() + body.slice(1);
  return `**${label}:** ${bodyNorm}`;
}

/**
 * Converts parenthetical sub-clauses in decision-point strings to em-dash style.
 *
 * "Is the refill still eligible (refills remaining, not too early)?"
 *   → "Is the refill still eligible — refills remaining, not too early?"
 *
 * Only the last trailing parenthetical (immediately before a punctuation mark or
 * end-of-string) is converted, to keep the sentence grammatically clean.
 */
function formatDecisionPoint(raw: string): string {
  // Replace trailing (...) before optional punctuation with " — ..."
  return raw.replace(/\s*\(([^)]+)\)([?!.]?)$/, (_, inner, punct) => {
    return ` — ${inner}${punct}`;
  });
}

/**
 * Derives a brief step count description from the steps array.
 */
function stepCountLabel(output: AnalyzerOutput): string {
  const count = output.steps?.length ?? 0;
  if (count === 0) return "an unknown number of steps";
  return `${count} step${count === 1 ? "" : "s"}`;
}

/**
 * Returns a short description of whether clarifying questions were confirmed.
 * Mirrors the fixture's timeline entry language.
 */
function clarifyingQuestionsNote(output: AnalyzerOutput): string {
  const qs = output.clarifying_questions;
  if (!qs || qs.length === 0) return "";
  const ids = qs.map((q) => q.id).join(" and ");
  return ` Analyzer segmented ${stepCountLabel(output)}; owner confirmed the ${ids} handling via clarifying questions.`;
}

// ---------- core generator ----------

/**
 * Converts an analyzer output JSON object into a GBrain skill-page markdown string.
 *
 * Output structure:
 *   # <title>
 *   <subtitle line>
 *   <skill path hint>
 *
 *   **Trigger:** ...
 *   **Apps involved:** ...
 *   **Required inputs:** bullet list
 *   **Procedure:** numbered list
 *   **Decision points:** bullet list
 *   **Exceptions — what to do when it goes wrong:** bullet list (bolded labels)
 *   **Suggested automations:** bullet list
 *
 *   ---
 *
 *   ## Timeline
 *   - **YYYY-MM-DD** — Skill captured from a screen recording of...
 */
export function toSkillPage(output: AnalyzerOutput): string {
  const wf = output.workflow;

  // Derive a slug for the brain path (kebab-case title)
  const slug = wf.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const date = formatDate(output.generated_at);
  const durationSec = Math.round(output.duration_sec);

  const lines: string[] = [];

  // ── Title block ─────────────────────────────────────────────────────────────
  lines.push(`# ${wf.title}`);
  lines.push("");
  lines.push(`A reusable skill captured from the pharmacy owner doing the task once.`);
  lines.push(`Lives at \`brain/skills/${slug}.md\` once committed.`);
  lines.push("");

  // ── Compiled-truth section ───────────────────────────────────────────────────
  lines.push(`**Trigger:** ${wf.trigger}`);
  lines.push("");

  const appsStr = wf.apps_involved.join(", ").replace(/,\s*$/, "");
  lines.push(`**Apps involved:** ${appsStr}.`);
  lines.push("");

  lines.push(`**Required inputs:**`);
  for (const input of wf.required_inputs) {
    lines.push(`- ${input}`);
  }
  lines.push("");

  lines.push(`**Procedure:**`);
  wf.procedure.forEach((step, i) => {
    lines.push(`${i + 1}. ${step}`);
  });
  lines.push("");

  lines.push(`**Decision points:**`);
  for (const dp of wf.decision_points) {
    lines.push(`- ${formatDecisionPoint(dp)}`);
  }
  lines.push("");

  lines.push(`**Exceptions — what to do when it goes wrong:**`);
  for (const ex of wf.exceptions) {
    lines.push(`- ${formatException(ex)}`);
  }
  lines.push("");

  lines.push(`**Suggested automations:**`);
  for (const sa of wf.suggested_automations) {
    lines.push(`- ${sa}`);
  }
  lines.push("");

  // ── Separator ───────────────────────────────────────────────────────────────
  lines.push(`---`);
  lines.push("");

  // ── Timeline ────────────────────────────────────────────────────────────────
  lines.push(`## Timeline`);
  lines.push("");

  const stepCount = output.steps?.length ?? 0;
  const stepLabel = `${stepCount} step${stepCount === 1 ? "" : "s"}`;

  const cqNote = clarifyingQuestionsNote(output);

  lines.push(
    `- **${date}** — Skill captured from a screen recording of the owner processing` +
      `\n  one refill (session \`${output.session}\`, ${durationSec}s). Analyzer segmented` +
      `\n  ${stepLabel}; owner confirmed the ${
        output.clarifying_questions
          ?.map((q) => q.id.replace(/-/g, "-"))
          .join(" and ") ?? "details"
      } handling via` +
      `\n  clarifying questions.`,
  );

  return lines.join("\n");
}

// ---------- CLI entry ─────────────────────────────────────────────────────────

if (
  // Detect whether this file is being run directly as a script
  // (works whether invoked as `node --experimental-strip-types to-skill-page.ts`
  //  or via the compiled-JS equivalent).
  // Guard against undefined argv[1] (e.g. --input-type=module stdin mode).
  process.argv[1] != null &&
  import.meta.url === `file://${resolve(process.argv[1])}`
) {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: node --experimental-strip-types analyzer/to-skill-page.ts <path-to-analyzer-output.json>");
    process.exit(1);
  }

  let raw: string;
  try {
    raw = readFileSync(resolve(arg), "utf8");
  } catch (e) {
    console.error(`Error reading file: ${String(e)}`);
    process.exit(1);
  }

  let output: AnalyzerOutput;
  try {
    output = JSON.parse(raw) as AnalyzerOutput;
  } catch (e) {
    console.error(`Error parsing JSON: ${String(e)}`);
    process.exit(1);
  }

  if (!output.workflow) {
    console.error("Error: JSON does not contain a .workflow object");
    process.exit(1);
  }

  process.stdout.write(toSkillPage(output) + "\n");
}
