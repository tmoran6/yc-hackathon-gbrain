// Emit a confirmed workflow to the GBrain-shaped markdown directory.
//
// Triggered from the review API when a user clicks "Confirm workflow". The
// page lives at brain/concepts/<slug>.md and follows the brain/README format:
//   ---
//   <yaml frontmatter>
//   ---
//   <above-the-line: compiled workflow + operator Q&A>
//   ---
//   ## Timeline
//   - <append-only entries>
//
// Re-confirming the same workflow title rewrites the above-the-line and
// appends one more timeline entry. The below-the-line section is the only
// thing that grows; the above-the-line always reflects the latest confirmation.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

export type WorkflowShape = {
  title?: string;
  trigger?: string;
  apps_involved?: string[];
  required_inputs?: string[];
  procedure?: string[];
  decision_points?: string[];
  exceptions?: string[];
  suggested_automations?: string[];
};

export type ClarifyingQuestion = {
  id: string;
  question: string;
  why?: string;
};

export type BrainEmitInput = {
  sessionId: string;
  recording: string | null;
  username: string | null;
  rawWorkflow: WorkflowShape | undefined;
  editsWorkflow: WorkflowShape | undefined;
  questions: ClarifyingQuestion[];
  answers: Record<string, string>;
};

export type BrainEmitResult =
  | {
      ok: true;
      path: string;
      relPath: string;
      slug: string;
      merged: boolean;
    }
  | { ok: false; reason: string };

// Dashboard runs from dashboard/; the brain repo sits at ../brain/.
const FALLBACK_BRAIN_DIR = resolve(process.cwd(), "..", "brain");

export function brainDir(): string {
  return resolve(process.env.BRAIN_DIR || FALLBACK_BRAIN_DIR);
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/['"`]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "workflow"
  );
}

export function mergeWorkflow(
  raw: WorkflowShape | undefined,
  edits: WorkflowShape | undefined,
): WorkflowShape {
  return { ...(raw ?? {}), ...(edits ?? {}) };
}

// Server helper: where would the brain file live for a given workflow title?
// Returns null if the title is empty or the brain dir is missing.
export function brainPageFor(
  workflowTitle: string | undefined | null,
): { absPath: string; relPath: string; exists: boolean } | null {
  const title = (workflowTitle ?? "").trim();
  if (!title) return null;
  const dir = brainDir();
  if (!existsSync(dir)) return null;
  const slug = slugify(title);
  const absPath = join(dir, "concepts", `${slug}.md`);
  return {
    absPath,
    relPath: `brain/concepts/${slug}.md`,
    exists: existsSync(absPath),
  };
}

export async function emitBrainPage(
  input: BrainEmitInput,
): Promise<BrainEmitResult> {
  const wf = mergeWorkflow(input.rawWorkflow, input.editsWorkflow);
  const title = (wf.title ?? "").trim();
  if (!title) {
    return {
      ok: false,
      reason: "workflow has no title — refusing to write brain page",
    };
  }

  const dir = brainDir();
  if (!existsSync(dir)) {
    return {
      ok: false,
      reason: `brain dir not found at ${dir} (set BRAIN_DIR env to override)`,
    };
  }
  const conceptsDir = join(dir, "concepts");
  if (!existsSync(conceptsDir)) {
    mkdirSync(conceptsDir, { recursive: true });
  }

  const slug = slugify(title);
  const filePath = join(conceptsDir, `${slug}.md`);
  const merged = existsSync(filePath);
  const isoNow = new Date().toISOString();

  const aboveLine = renderAboveLine({
    title,
    wf,
    questions: input.questions,
    answers: input.answers,
    sessionId: input.sessionId,
    recording: input.recording,
    capturedAt: isoNow,
    confirmedBy: input.username,
  });

  const timelineEntry = renderTimelineEntry({
    capturedAt: isoNow,
    recording: input.recording,
    sessionId: input.sessionId,
    confirmedBy: input.username,
    merged,
  });

  const existingTimeline = merged
    ? extractTimeline(readFileSync(filePath, "utf8"))
    : [];
  const newTimeline = [...existingTimeline, timelineEntry];

  const content =
    aboveLine.trimEnd() +
    "\n\n---\n\n## Timeline\n\n" +
    newTimeline.join("\n") +
    "\n";

  writeFileSync(filePath, content);

  // Best-effort: re-index the brain in the background. Never block the HTTP
  // response on it — the file write is the durable side-effect.
  void runSync(dir);

  return {
    ok: true,
    path: filePath,
    relPath: `brain/concepts/${slug}.md`,
    slug,
    merged,
  };
}

function renderAboveLine(args: {
  title: string;
  wf: WorkflowShape;
  questions: ClarifyingQuestion[];
  answers: Record<string, string>;
  sessionId: string;
  recording: string | null;
  capturedAt: string;
  confirmedBy: string | null;
}): string {
  const {
    title,
    wf,
    questions,
    answers,
    sessionId,
    recording,
    capturedAt,
    confirmedBy,
  } = args;
  const apps = (wf.apps_involved ?? []).filter(Boolean);

  const fm: string[] = ["---", `title: ${yamlString(title)}`, `type: workflow`];
  if (apps.length) {
    fm.push(`apps: [${apps.map(yamlString).join(", ")}]`);
  }
  if (wf.trigger) fm.push(`trigger: ${yamlString(wf.trigger)}`);
  fm.push(`captured_at: ${capturedAt}`);
  fm.push(`session_id: ${sessionId}`);
  if (recording) fm.push(`captured_from: ${yamlString(recording)}`);
  if (confirmedBy) fm.push(`confirmed_by: ${yamlString(confirmedBy)}`);
  fm.push("---", "");

  const body: string[] = [`# ${title}`, ""];
  if (wf.trigger) body.push(`**Trigger:** ${wf.trigger}`, "");
  if (apps.length) body.push(`**Apps involved:** ${apps.join(", ")}`, "");
  if (wf.required_inputs?.length) {
    body.push(`**Required inputs:**`);
    for (const x of wf.required_inputs) body.push(`- ${x}`);
    body.push("");
  }
  if (wf.procedure?.length) {
    body.push(`## Procedure`, "");
    wf.procedure.forEach((s, i) => body.push(`${i + 1}. ${s}`));
    body.push("");
  }
  if (wf.decision_points?.length) {
    body.push(`## Decision points`, "");
    for (const x of wf.decision_points) body.push(`- ${x}`);
    body.push("");
  }
  if (wf.exceptions?.length) {
    body.push(`## Exceptions`, "");
    for (const x of wf.exceptions) body.push(`- ${x}`);
    body.push("");
  }
  if (wf.suggested_automations?.length) {
    body.push(`## Suggested automations`, "");
    for (const x of wf.suggested_automations) body.push(`- ${x}`);
    body.push("");
  }

  const qa = questions
    .map((q) => ({ q, a: (answers[q.id] ?? "").trim() }))
    .filter(({ a }) => a.length > 0);
  if (qa.length) {
    body.push(`## Operator notes`, "");
    for (const { q, a } of qa) {
      body.push(`**Q:** ${q.question}  `);
      body.push(`**A:** ${a}`);
      body.push("");
    }
  }

  return [...fm, ...body].join("\n");
}

function renderTimelineEntry(args: {
  capturedAt: string;
  recording: string | null;
  sessionId: string;
  confirmedBy: string | null;
  merged: boolean;
}): string {
  const { capturedAt, recording, sessionId, confirmedBy, merged } = args;
  const who = confirmedBy ? ` by ${confirmedBy}` : "";
  const source = recording ? recording : `session ${sessionId}`;
  const verb = merged ? "Re-confirmed" : "Captured";
  return `- ${capturedAt}: ${verb} from ${source}${who}`;
}

// On a re-confirmation, preserve the existing timeline below the last `---`
// separator. Only bullet lines are kept so we can rewrite the heading.
function extractTimeline(existing: string): string[] {
  const lines = existing.split("\n");
  let sepIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === "---") {
      sepIdx = i;
      break;
    }
  }
  if (sepIdx < 0) return [];
  return lines
    .slice(sepIdx + 1)
    .map((l) => l.replace(/\s+$/, ""))
    .filter((l) => l.startsWith("- "));
}

function yamlString(s: string): string {
  if (/^[A-Za-z0-9 _.\/-]+$/.test(s)) return s;
  return JSON.stringify(s);
}

async function runSync(dir: string): Promise<void> {
  const script = join(dir, "sync.sh");
  if (!existsSync(script)) return;
  try {
    const child = spawn("bash", [script], {
      cwd: dir,
      env: process.env,
      stdio: "ignore",
      detached: true,
    });
    child.unref();
  } catch (e) {
    console.error("[brain] sync.sh spawn failed:", e);
  }
}
