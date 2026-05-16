import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

// PATCH /api/sessions/<id>/analysis/review
//
// User-review actions for an analysis row.
//
//   { action: "save",    edits: { ... } }   — store edits + answers (stays in user_review)
//   { action: "confirm", edits?: { ... } }  — final save; transitions to 'confirmed'
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

  const sql = setEdits
    ? `UPDATE analysis
          SET edits        = $2::jsonb,
              review_state = $3,
              updated_at   = now()
        WHERE session_id = $1
        RETURNING id, session_id, review_state, edits, updated_at`
    : `UPDATE analysis
          SET review_state = $2,
              updated_at   = now()
        WHERE session_id = $1
        RETURNING id, session_id, review_state, edits, updated_at`;

  const sqlParams = setEdits
    ? [id, JSON.stringify(edits), nextState]
    : [id, nextState];

  const { rows } = await pool.query(sql, sqlParams);
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "analysis not found for session" },
      { status: 404 },
    );
  }

  return NextResponse.json(rows[0]);
}
