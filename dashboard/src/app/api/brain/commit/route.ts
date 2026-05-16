import { NextResponse } from "next/server";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import { BRAIN_DIR, SKILLS_DIR, gbrainEnv } from "@/lib/gbrain";

export const runtime = "nodejs";

type CommitBody = {
  slug?: unknown;
  skillPage?: unknown;
};

export async function POST(req: Request) {
  let body: CommitBody;
  try {
    body = (await req.json()) as CommitBody;
  } catch {
    return NextResponse.json({ ok: false, error: "body must be JSON" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const skillPage = typeof body.skillPage === "string" ? body.skillPage : "";

  if (!slug) {
    return NextResponse.json({ ok: false, error: "slug is required" }, { status: 400 });
  }
  if (!skillPage) {
    return NextResponse.json({ ok: false, error: "skillPage is required" }, { status: 400 });
  }

  try {
    // 1. Ensure skills directory exists
    fs.mkdirSync(SKILLS_DIR, { recursive: true });

    // 2. Write skill page to brain/skills/<slug>.md
    const skillPath = path.join(SKILLS_DIR, `${slug}.md`);
    fs.writeFileSync(skillPath, skillPage, "utf8");

    const env = gbrainEnv();
    const execOpts = {
      env,
      encoding: "utf8" as const,
      stdio: ["pipe", "pipe", "pipe"] as ["pipe", "pipe", "pipe"],
      maxBuffer: 10 * 1024 * 1024,
      // Run from /tmp so gbrain doesn't auto-load .env.local from dashboard/ cwd.
      // gbrain scans for .env files from cwd upward; dashboard/.env.local has
      // DATABASE_URL that redirects gbrain to a remote Postgres instead of pglite.
      cwd: "/tmp" as string,
    };

    // 3. Run gbrain import (no embedding yet)
    execSync(`gbrain import ${JSON.stringify(BRAIN_DIR)} --no-embed`, execOpts);

    // 4. Embed stale documents
    execSync(`gbrain embed --stale`, execOpts);

    return NextResponse.json({ ok: true, slug, imported: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
