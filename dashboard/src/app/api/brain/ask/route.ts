import { gbrainQuery, parseSlug, gbrainGet } from "@/lib/gbrain";

export const runtime = "nodejs";

type AskBody = {
  question?: unknown;
};

export async function POST(req: Request) {
  let body: AskBody;
  try {
    body = (await req.json()) as AskBody;
  } catch {
    return new Response("body must be JSON", { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return new Response("question is required", { status: 400 });
  }

  try {
    // Step 1: Retrieve — capped at 8s to avoid hanging synthesis
    const queryOutput = gbrainQuery(question);
    const slug = parseSlug(queryOutput);

    if (!slug) {
      return new Response(
        "No relevant skill found in the brain for that question.",
        {
          status: 200,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        },
      );
    }

    // Step 2: Fetch the full skill page
    const page = gbrainGet(slug);

    // Step 3: Stream a direct Anthropic claude-sonnet-4-6 call
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response("ANTHROPIC_API_KEY not configured", { status: 500 });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        stream: true,
        system:
          "You are the company brain for a small pharmacy. Answer the employee's question " +
          "using ONLY the captured skill below. Be concise and practical, like a coworker.",
        messages: [
          {
            role: "user",
            content: `SKILL PAGE:\n${page}\n\nQUESTION: ${question}`,
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      return new Response(`Anthropic error: ${errText}`, { status: 500 });
    }

    if (!anthropicRes.body) {
      return new Response("No response body from Anthropic", { status: 500 });
    }

    // Transform the Anthropic SSE stream → plain text stream
    const transformedStream = new ReadableStream({
      async start(controller) {
        const reader = anthropicRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            // Keep the last (possibly incomplete) line in the buffer
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;

              try {
                const event = JSON.parse(data) as {
                  type: string;
                  delta?: { type: string; text?: string };
                };
                if (
                  event.type === "content_block_delta" &&
                  event.delta?.type === "text_delta" &&
                  event.delta.text
                ) {
                  controller.enqueue(new TextEncoder().encode(event.delta.text));
                }
              } catch {
                // skip malformed SSE lines
              }
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(transformedStream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(message, { status: 500 });
  }
}
