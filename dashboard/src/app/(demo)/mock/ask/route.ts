// Mock "Ask your Brain" endpoint for the demo screen.
//
// Stands in for the real GBrain query (gbrain query -> LLM synthesis). It
// streams a plain-text answer chunk-by-chunk so the chat box can render a
// live typing effect — same consumption pattern the real endpoint will use.

export const dynamic = "force-dynamic";

// Canned answers keyed by a keyword in the question. First match wins.
const ANSWERS: Array<{ keywords: string[]; answer: string }> = [
  {
    keywords: ["supplier", "order", "restock", "sysco"],
    answer:
      "Based on the Daily Opening Workflow: open the Sysco supplier portal, add any ingredient below par level to the cart, check minimum order quantities, then submit before the 10am cutoff. If you miss the cutoff, place a phone order instead.",
  },
  {
    keywords: ["prep", "kitchen", "staff", "slack"],
    answer:
      "The captured workflow updates the kitchen prep list from yesterday's top sellers, then posts the prep priorities to the kitchen Slack channel. Dishes that sold out get a higher prep quantity for today.",
  },
  {
    keywords: ["sales", "report", "pos", "toast"],
    answer:
      "Every morning the workflow pulls yesterday's sales by item from the Toast POS dashboard and compares the top sellers against on-hand inventory. That comparison is what drives the prep list and the supplier order.",
  },
  {
    keywords: ["automat", "agent", "automation"],
    answer:
      "Three automations were suggested for this workflow: auto-generate the 6am sales summary, draft the supplier restock order from inventory gaps, and post the kitchen prep briefing to Slack automatically.",
  },
];

const FALLBACK =
  "Your Brain learned the Daily Opening Workflow: pull yesterday's sales from Toast, compare against inventory, restock through Sysco, update the prep list, brief the kitchen on Slack, and mark sold-out items on DoorDash. Ask about supplier orders, prep, sales reports, or automations for more detail.";

function pickAnswer(question: string): string {
  const q = question.toLowerCase();
  for (const { keywords, answer } of ANSWERS) {
    if (keywords.some((k) => q.includes(k))) return answer;
  }
  return FALLBACK;
}

export async function POST(request: Request) {
  let question = "";
  try {
    const body = await request.json();
    question = typeof body?.question === "string" ? body.question : "";
  } catch {
    // No body — fall through to the fallback answer.
  }

  const answer = pickAnswer(question);
  const tokens = answer.split(/(\s+)/); // keep whitespace as its own tokens
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const token of tokens) {
        controller.enqueue(encoder.encode(token));
        await new Promise((r) => setTimeout(r, 35));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
