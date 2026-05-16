import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { rows } = await pool.query<{
    id: string;
    username: string;
    status: string;
    started_at: Date;
    ended_at: Date;
  }>(
    `UPDATE sessions
        SET status   = 'ended',
            ended_at = now()
      WHERE id = $1
      RETURNING id, username, status, started_at, ended_at`,
    [id],
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}
