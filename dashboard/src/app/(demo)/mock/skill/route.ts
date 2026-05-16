// Mock "Skill Captured" endpoint for the demo screen.
//
// Stands in for the real analyzer pipeline (analyzer/analyze.ts -> Gemini).
// The demo UI fetches this on load to render a freshly-captured workflow.
// When the real contract lands, swap the fetch() URL — the JSON shape here
// mirrors the analyzer's `workflow` block so the card needs no changes.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    session_id: "demo-b00a5276",
    captured_at: new Date().toISOString(),
    recording: "screen-2026-05-16.mp4",
    duration_sec: 372,
    frame_count: 124,
    confidence: 0.91,
    workflow: {
      title: "Daily Opening Workflow",
      trigger:
        "Manager arrives before service and needs the kitchen prepped and stocked.",
      apps_involved: ["Toast POS", "Sysco Supplier Portal", "Slack", "DoorDash"],
      required_inputs: [
        "Yesterday's sales report",
        "Current inventory counts",
        "Supplier order cutoff times",
      ],
      procedure: [
        "Open the Toast POS dashboard and pull yesterday's sales by item.",
        "Compare top-selling dishes against on-hand inventory.",
        "Open the Sysco supplier portal and add low-stock ingredients to the cart.",
        "Check minimum order quantities and submit the restock order.",
        "Update the kitchen prep list for the day.",
        "Message kitchen staff in Slack with prep priorities.",
        "Mark sold-out items unavailable on DoorDash.",
      ],
      decision_points: [
        "If an ingredient is below par level, add it to the supplier order.",
        "If a dish sold out yesterday, raise its prep quantity today.",
      ],
      exceptions: [
        "Supplier portal past the 10am cutoff — flag for a phone order instead.",
        "Inventory count looks wrong — ask the closing shift to recount.",
      ],
      suggested_automations: [
        "Auto-generate the sales summary at 6am every day.",
        "Draft the supplier restock order from inventory gaps.",
        "Post the kitchen prep briefing to Slack automatically.",
      ],
    },
  });
}
