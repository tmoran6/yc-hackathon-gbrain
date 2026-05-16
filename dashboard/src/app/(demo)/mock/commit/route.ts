// Mock "Commit to Brain" endpoint for the demo screen.
//
// Stands in for the real GBrain commit (writes a page under brain/ + indexes).
// The demo UI POSTs the captured workflow here; we echo back a fake brain
// path and skill id so the card can show a committed state.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let title = "Captured Workflow";
  try {
    const body = await request.json();
    if (body?.workflow?.title) title = String(body.workflow.title);
  } catch {
    // Body optional — fall back to the default title.
  }

  // Simulate the index + embed round-trip.
  await new Promise((r) => setTimeout(r, 600));

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return NextResponse.json({
    committed: true,
    skill_id: `skill_${slug}`,
    brain_path: `brain/projects/${slug}.md`,
    committed_at: new Date().toISOString(),
    indexed: true,
  });
}
