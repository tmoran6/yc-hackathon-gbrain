import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

type CreateBody = {
  username?: unknown;
  captured_at?: unknown;
  content_type?: unknown;
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

  if (typeof body.captured_at !== "string") {
    return badRequest("captured_at is required (ISO 8601 string)");
  }
  const capturedAt = new Date(body.captured_at);
  if (Number.isNaN(capturedAt.getTime())) {
    return badRequest("captured_at must be a valid ISO 8601 timestamp");
  }

  const contentType =
    typeof body.content_type === "string" ? body.content_type : null;
  const metadata =
    body.metadata && typeof body.metadata === "object" ? body.metadata : {};

  const { rows } = await pool.query<{ id: string; created_at: Date }>(
    `INSERT INTO screenshots (username, captured_at, content_type, metadata)
     VALUES ($1, $2, $3, $4)
     RETURNING id, created_at`,
    [username, capturedAt.toISOString(), contentType, metadata],
  );

  const row = rows[0];
  return NextResponse.json(
    {
      id: row.id,
      username,
      captured_at: capturedAt.toISOString(),
      status: "pending",
      created_at: row.created_at,
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
    `SELECT id, username, captured_at, status, content_type, byte_size,
            metadata, created_at, uploaded_at
       FROM screenshots
       ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length}`,
    params,
  );
  return NextResponse.json({ uploads: rows });
}
