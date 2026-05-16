import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { dedupeTags } from "@/lib/tags";

export const runtime = "nodejs";

// PUT /api/sessions/<id>/tags
// Body: { tags: string[] }
// Replaces the full tag list on a session. Tags are normalized + de-duped.

type Body = { tags?: unknown };

export async function PUT(
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

  if (!Array.isArray(body.tags) || !body.tags.every((t) => typeof t === "string")) {
    return NextResponse.json(
      { error: "tags must be an array of strings" },
      { status: 400 },
    );
  }

  const tags = dedupeTags(body.tags as string[]);

  const { rows } = await pool.query<{ id: string; tags: string[] }>(
    `UPDATE sessions
        SET tags = $2::text[]
      WHERE id = $1
      RETURNING id, tags`,
    [id, tags],
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "session not found" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}
