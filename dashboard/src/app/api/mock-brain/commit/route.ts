import { NextResponse } from "next/server";

export async function POST() {
  // Simulate a short processing delay so the UI transition feels real
  await new Promise((resolve) => setTimeout(resolve, 800));

  return NextResponse.json({
    ok: true,
    slug: "medication-refill-processing",
    imported: true,
  });
}
