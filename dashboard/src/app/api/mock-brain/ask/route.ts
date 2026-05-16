// Mock streaming route for "Ask your Brain"
// Streams the insurance-rejection exception text from fixtures/skill-page.md
// a few words at a time so the UI renders incrementally.

export async function POST() {
  const answer =
    "When insurance is rejected on a refill, follow these steps: " +
    "First, do not dispense the medication until the issue is resolved. " +
    "Contact the prescriber to request a prior authorization — this is the most common path. " +
    "While you wait, you can offer the patient the cash price if they want the medication immediately; " +
    "make sure they understand they may be reimbursed once the authorization clears. " +
    "Document the rejection reason from the insurance response and note it in the patient record. " +
    "If the prescriber does not respond within 24 hours, escalate with a follow-up fax or call. " +
    "Once prior authorization is approved, re-run the claim before dispensing.";

  const words = answer.split(" ");

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      // Emit 3-4 words at a time with a short delay between each group
      let i = 0;
      while (i < words.length) {
        const chunkSize = Math.floor(Math.random() * 3) + 2; // 2-4 words
        const chunk = words.slice(i, i + chunkSize).join(" ");
        controller.enqueue(encoder.encode(i === 0 ? chunk : " " + chunk));
        i += chunkSize;
        await new Promise((resolve) =>
          setTimeout(resolve, 80 + Math.random() * 80)
        );
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
