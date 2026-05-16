import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import {
  emitBrainPage,
  type BrainEmitResult,
  type ClarifyingQuestion,
  type WorkflowShape,
} from "@/lib/brain";

export const runtime = "nodejs";

// PATCH /api/sessions/<id>/analysis/review
//
// User-review actions for an analysis row.
//
//   { action: "save",    edits: { ... } }   — store edits + answers (stays in user_review)
//   { action: "confirm", edits?: { ... } }  — final save; transitions to 'confirmed'
//                                             and emits a brain/concepts/<slug>.md page
//   { action: "discard" }                   — transitions to 'discarded'
//
// `edits` is a free-form JSON overlay over the original analyzer result:
//   { workflow: { title, trigger, procedure, ... }, answers: { <qid>: "..." } }
// The original `result` column is left intact so the analyzer's output is
// always recoverable.

type Body = {
  action?: unknown;
  edits?: unknown;
};

const REVIEW_STATES = new Set(["user_review", "confirmed", "discarded"]);

type AnalysisRow = {
  id: string;
  session_id: string;
  recording: string | null;
  result: {
    workflow?: WorkflowShape;
    clarifying_questions?: ClarifyingQuestion[];
  };
  edits: {
    workflow?: WorkflowShape;
    answers?: Record<string, string>;
  } | null;
  review_state: string;
  updated_at: Date;
  username: string | null;
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "body must be JSON" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "";
  if (!["save", "confirm", "discard"].includes(action)) {
    return NextResponse.json(
      { error: "action must be one of save|confirm|discard" },
      { status: 400 },
    );
  }

  const edits =
    body.edits && typeof body.edits === "object" && !Array.isArray(body.edits)
      ? (body.edits as Record<string, unknown>)
      : null;

  const nextState =
    action === "confirm"
      ? "confirmed"
      : action === "discard"
        ? "discarded"
        : "user_review";

  if (!REVIEW_STATES.has(nextState)) {
    return NextResponse.json({ error: "bad state" }, { status: 400 });
  }

  // For save/confirm, merge in edits (if provided). For discard, leave edits
  // alone so the user can recover their notes if they re-open the analysis.
  const setEdits = action !== "discard" && edits !== null;

  // Always join through to sessions so we can attribute the brain emit.
  const sql = setEdits
    ? `UPDATE analysis a
          SET edits        = $2::jsonb,
              review_state = $3,
              updated_at   = now()
         FROM sessions s
        WHERE a.session_id = s.id
          AND a.session_id = $1
        RETURNING a.id, a.session_id, a.recording, a.result, a.edits, a.review_state, a.updated_at, s.username`
    : `UPDATE analysis a
          SET review_state = $2,
              updated_at   = now()
         FROM sessions s
        WHERE a.session_id = s.id
          AND a.session_id = $1
        RETURNING a.id, a.session_id, a.recording, a.result, a.edits, a.review_state, a.updated_at, s.username`;

  const sqlParams = setEdits
    ? [id, JSON.stringify(edits), nextState]
    : [id, nextState];

  const { rows } = await pool.query<AnalysisRow>(sql, sqlParams);
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "analysis not found for session" },
      { status: 404 },
    );
  }

  const row = rows[0];

  // Brain emit is gated on confirm. Failures are logged but never fail the
  // confirm — the analysis row is the source of truth; brain is a derivative.
  let brain: BrainEmitResult | null = null;
  if (action === "confirm") {
    try {
      brain = await emitBrainPage({
        sessionId: row.session_id,
        recording: row.recording,
        username: row.username,
        rawWorkflow: row.result?.workflow,
        editsWorkflow: row.edits?.workflow,
        questions: row.result?.clarifying_questions ?? [],
        answers: row.edits?.answers ?? {},
      });
      if (brain.ok) {
        console.log(
          `[brain] ${brain.merged ? "merged" : "wrote"} ${brain.relPath} for session ${row.session_id}`,
        );
      } else {
        console.warn(`[brain] skipped for session ${row.session_id}: ${brain.reason}`);
      }
    } catch (e) {
      console.error(
        `[brain] emit failed for session ${row.session_id}:`,
        e,
      );
      brain = { ok: false, reason: String(e) };
    }
  }

  return NextResponse.json({
    id: row.id,
    session_id: row.session_id,
    review_state: row.review_state,
    edits: row.edits,
    updated_at: row.updated_at,
    brain,
  });
}
