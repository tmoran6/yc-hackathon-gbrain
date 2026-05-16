import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { brainDir, skillsDir, runGbrain } from "@/lib/gbrain";

export const runtime = "nodejs";

/**
 * POST /api/brain/commit — see contracts/api.md.
 *
 * Writes a skill page to brain/skills/<slug>.md, then re-indexes the brain
 * with `gbrain import brain/ --no-embed` followed by `gbrain embed --stale`.
 */

type CommitBody = {
  slug?: unknown;
  skillPage?: unknown;
};

function fail(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 500 });
}

// gbrain page slugs: lowercase letters, digits, hyphens. Also blocks path
// traversal since `/`, `.` and `\` are rejected.
function normalizeSlug(raw: string): string | null {
  const slug = raw.trim().toLowerCase();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : null;
}

export async function POST(req: Request) {
  let body: CommitBody;
  try {
    body = (await req.json()) as CommitBody;
  } catch {
    return fail("body must be JSON");
  }

  if (typeof body.slug !== "string" || !body.slug.trim()) {
    return fail("slug is required");
  }
  if (typeof body.skillPage !== "string" || !body.skillPage.trim()) {
    return fail("skillPage is required");
  }

  const slug = normalizeSlug(body.slug);
  if (!slug) {
    return fail(
      "slug must be lowercase alphanumeric words separated by hyphens",
    );
  }

  const dir = skillsDir();
  const filePath = path.join(dir, `${slug}.md`);

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, body.skillPage, "utf8");
  } catch (err) {
    return fail(`failed to write skill page: ${(err as Error).message}`);
  }

  const importRes = await runGbrain([
    "import",
    `${path.basename(brainDir())}/`,
    "--no-embed",
  ]).catch((err: Error) => err);
  if (importRes instanceof Error) {
    return fail(`gbrain import failed: ${importRes.message}`);
  }
  if (importRes.code !== 0) {
    return fail(
      `gbrain import exited ${importRes.code}: ${
        importRes.stderr.trim() || importRes.stdout.trim()
      }`,
    );
  }

  const embedRes = await runGbrain(["embed", "--stale"]).catch(
    (err: Error) => err,
  );
  if (embedRes instanceof Error) {
    return fail(`gbrain embed failed: ${embedRes.message}`);
  }
  if (embedRes.code !== 0) {
    return fail(
      `gbrain embed exited ${embedRes.code}: ${
        embedRes.stderr.trim() || embedRes.stdout.trim()
      }`,
    );
  }

  return NextResponse.json({ ok: true, slug, imported: true });
}
