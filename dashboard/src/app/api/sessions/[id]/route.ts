import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { deleteSessionObjects } from "@/lib/storage";

export const runtime = "nodejs";

// DELETE /api/sessions/<id>
// "Discard recording" — removes uploaded Storage objects and the session row.
// The analysis row (if any) is removed via the FK ON DELETE CASCADE, so a
// discarded recording disappears from the dashboard entirely.

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let storageRemoved = 0;
  try {
    storageRemoved = await deleteSessionObjects(id);
  } catch (err) {
    // Best-effort: still drop the row even if storage cleanup fails.
    console.error("discard: storage cleanup failed", err);
  }

  const { rowCount } = await pool.query(`DELETE FROM sessions WHERE id = $1`, [
    id,
  ]);

  return NextResponse.json({
    id,
    deleted: (rowCount ?? 0) > 0,
    storage_objects_removed: storageRemoved,
  });
}
