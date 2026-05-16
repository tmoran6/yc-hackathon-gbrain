import { spawnGbrain } from "@/lib/gbrain";

export const runtime = "nodejs";

/**
 * POST /api/brain/ask — see contracts/api.md.
 *
 * Runs `gbrain query "<question>"` and streams stdout back as text/plain so
 * the UI can render the answer incrementally.
 */

type AskBody = {
  question?: unknown;
};

function errorResponse(message: string) {
  return new Response(message, {
    status: 500,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(req: Request) {
  let body: AskBody;
  try {
    body = (await req.json()) as AskBody;
  } catch {
    return errorResponse("body must be JSON");
  }

  if (typeof body.question !== "string" || !body.question.trim()) {
    return errorResponse("question is required");
  }
  const question = body.question.trim();

  const child = spawnGbrain(["query", question]);

  // Wait until the process is confirmed running (or fails to spawn) before
  // committing to a streamed 200 — this lets a missing `gbrain` binary or a
  // spawn failure surface as a proper 500.
  try {
    await new Promise<void>((resolve, reject) => {
      child.once("spawn", () => resolve());
      child.once("error", (err) => reject(err));
    });
  } catch (err) {
    return errorResponse(`gbrain query failed: ${(err as Error).message}`);
  }

  let stderr = "";
  child.stderr.on("data", (d: Buffer) => {
    stderr += d.toString();
  });

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      child.stdout.on("data", (d: Buffer) => {
        controller.enqueue(new Uint8Array(d));
      });
      child.stdout.on("error", (err) => {
        controller.error(err);
      });
      child.on("close", (code) => {
        // Surface a non-zero exit inline — headers are already sent, so this
        // is the only channel left to report the failure to the client.
        if (code !== 0) {
          const detail = stderr.trim() || `gbrain query exited ${code}`;
          controller.enqueue(
            new TextEncoder().encode(`\n[error] ${detail}\n`),
          );
        }
        controller.close();
      });
    },
    cancel() {
      child.kill();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
