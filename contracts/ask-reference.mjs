// PROVEN "Ask your Brain" path:
//   retrieval = gbrain query (hybrid vector+keyword), capped — ignore broken synthesis
//   page      = gbrain get <slug>
//   answer    = direct Claude synthesis
import { execSync } from "node:child_process";

const question = "A patient needs a refill but their insurance was rejected — what do I do?";
const env = { ...process.env };

const t0 = Date.now();
// gbrain query hangs on synthesis ~40-120s; retrieval lines emit at ~4s. Cap it.
const retrieval = execSync(
  `timeout 8 gbrain query ${JSON.stringify(question)} --limit 5 2>/dev/null || true`,
  { env, encoding: "utf8" },
);
const slug = (retrieval.match(/^\[[0-9.]+\]\s+(skills\/[a-z0-9-]+)/m) || [])[1];
if (!slug) { console.error("no slug\n" + retrieval); process.exit(1); }
const page = execSync(`gbrain get ${JSON.stringify(slug)}`, { env, encoding: "utf8" });
const tRetrieval = Date.now() - t0;
console.log(`slug=${slug}  retrieval=${tRetrieval}ms  page=${page.length} chars`);

const t1 = Date.now();
const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  },
  body: JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    system:
      "You are the company brain for a small pharmacy. Answer the employee's question " +
      "using ONLY the captured skill below. Be concise and practical, like a coworker.",
    messages: [{ role: "user", content: `SKILL PAGE:\n${page}\n\nQUESTION: ${question}` }],
  }),
});
const data = await res.json();
const tSynth = Date.now() - t1;
if (!res.ok) { console.error("anthropic error:", JSON.stringify(data)); process.exit(1); }
console.log(`synthesis=${tSynth}ms\n=== ANSWER ===`);
console.log(data.content?.[0]?.text ?? JSON.stringify(data));
console.log(`\n=== TOTAL: ${tRetrieval + tSynth}ms ===`);
