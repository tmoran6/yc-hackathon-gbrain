import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getStorageConfig } from "@/lib/supabase";

export const runtime = "nodejs";

type CreateBody = {
  username?: unknown;
  metadata?: unknown;
};

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req: Request) {
  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return badRequest("body must be JSON");
  }

  const username =
    typeof body.username === "string" ? body.username.trim() : "";
  if (!username) return badRequest("username is required");

  const metadata =
    body.metadata && typeof body.metadata === "object" ? body.metadata : {};

  const storage = getStorageConfig();

  const { rows } = await pool.query<{
    id: string;
    started_at: Date;
  }>(
    `INSERT INTO sessions (username, metadata)
     VALUES ($1, $2)
     RETURNING id, started_at`,
    [username, metadata],
  );

  const row = rows[0];
  return NextResponse.json(
    {
      id: row.id,
      username,
      status: "active",
      started_at: row.started_at,
      storage: {
        url: storage.url,
        key: storage.key,
        bucket: storage.bucket,
        screenshots_prefix: `${row.id}/screenshots/`,
        transcripts_prefix: `${row.id}/transcripts/`,
      },
    },
    { status: 201 },
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(
    Number(url.searchParams.get("limit") ?? "50") || 50,
    200,
  );
  const username = url.searchParams.get("username");

  const params: unknown[] = [];
  let where = "";
  if (username) {
    params.push(username);
    where = `WHERE username = $1`;
  }
  params.push(limit);

  const { rows } = await pool.query(
    `SELECT id, username, status, started_at, ended_at, metadata, created_at
       FROM sessions
       ${where}
       ORDER BY started_at DESC
       LIMIT $${params.length}`,
    params,
  );
  return NextResponse.json({ sessions: rows });
}
