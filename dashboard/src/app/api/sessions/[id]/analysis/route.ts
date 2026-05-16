import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

// POST /api/sessions/<id>/analysis
// Called by the analyzer after it finishes a recording. Upserts one analysis
// row per session (re-running an analysis replaces it). The session id in the
// URL is the FK into `sessions`; `result` is the full analyzer JSON verbatim.

type Body = {
  recording?: unknown;
  result?: unknown;
};

export async function POST(
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

  if (body.result === undefined || body.result === null) {
    return NextResponse.json({ error: "result is required" }, { status: 400 });
  }
  const recording =
    typeof body.recording === "string" ? body.recording : null;

  // Surface a clean 404 instead of a raw FK violation if the session is gone.
  const session = await pool.query(`SELECT id FROM sessions WHERE id = $1`, [
    id,
  ]);
  if (session.rowCount === 0) {
    return NextResponse.json({ error: "session not found" }, { status: 404 });
  }

  const { rows } = await pool.query<{
    id: string;
    session_id: string;
    created_at: Date;
    updated_at: Date;
    review_state: string;
  }>(
    `INSERT INTO analysis (session_id, recording, result, edits, review_state)
     VALUES ($1, $2, $3, '{}'::jsonb, 'user_review')
     ON CONFLICT (session_id) DO UPDATE
       SET result       = EXCLUDED.result,
           recording    = EXCLUDED.recording,
           edits        = '{}'::jsonb,
           review_state = 'user_review',
           updated_at   = now()
     RETURNING id, session_id, created_at, updated_at, review_state`,
    [id, recording, JSON.stringify(body.result)],
  );

  return NextResponse.json(rows[0], { status: 201 });
}
