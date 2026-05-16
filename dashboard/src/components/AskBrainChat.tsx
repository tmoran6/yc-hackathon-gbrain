"use client";

// "Ask your Brain" streaming chat box. POSTs a question to the local mock ask
// route and renders the plain-text response as it streams in, token by token.

import { useRef, useState } from "react";

type Message = {
  role: "user" | "brain";
  text: string;
};

const SUGGESTIONS = [
  "How do I place the supplier order?",
  "What goes on the kitchen prep list?",
  "Which automations were suggested?",
];

export default function AskBrainChat({ enabled }: { enabled: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || streaming) return;

    setInput("");
    setMessages((m) => [
      ...m,
      { role: "user", text: trimmed },
      { role: "brain", text: "" },
    ]);
    setStreaming(true);

    try {
      const res = await fetch("/mock/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      if (!res.ok || !res.body) throw new Error(`ask failed (${res.status})`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const next = [...m];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, text: last.text + chunk };
          return next;
        });
        scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "ask failed";
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = { role: "brain", text: `⚠ ${msg}` };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <section style={card}>
      <div style={sectionHead}>
        <h2 style={h2}>Ask your Brain</h2>
        {!enabled && (
          <span style={meta}>Commit the skill first to unlock</span>
        )}
      </div>

      <div ref={scrollRef} style={transcript}>
        {messages.length === 0 ? (
          <p style={{ opacity: 0.5, margin: 0, fontSize: 14 }}>
            Your Brain now knows this workflow. Ask it anything about how the
            work gets done.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={m.role === "user" ? userBubble : brainBubble}
              >
                <div style={bubbleLabel}>
                  {m.role === "user" ? "You" : "Brain"}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                  {m.text || (streaming ? "…" : "")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {enabled && messages.length === 0 && (
        <div style={suggestRow}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              disabled={streaming}
              style={suggestChip}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        style={inputRow}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!enabled || streaming}
          placeholder={
            enabled ? "Ask your Brain a question…" : "Commit the skill first"
          }
          style={textInput}
        />
        <button
          type="submit"
          disabled={!enabled || streaming || !input.trim()}
          style={
            !enabled || streaming || !input.trim()
              ? sendButtonDisabled
              : sendButton
          }
        >
          {streaming ? "…" : "Ask"}
        </button>
      </form>
    </section>
  );
}

const card: React.CSSProperties = {
  border: "1px solid var(--border-default)",
  borderRadius: 8,
  padding: "1.25rem 1.5rem",
  marginBottom: "2rem",
  background: "var(--bg-card)",
};

const sectionHead: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 12,
  marginBottom: 16,
};

const h2: React.CSSProperties = { margin: 0, fontSize: 18 };

const meta: React.CSSProperties = { fontSize: 12, opacity: 0.5 };

const transcript: React.CSSProperties = {
  border: "1px solid var(--border-default)",
  borderRadius: 8,
  background: "var(--bg-transcript)",
  padding: "1rem 1.25rem",
  minHeight: 120,
  maxHeight: 320,
  overflowY: "auto",
};

const userBubble: React.CSSProperties = {
  alignSelf: "flex-end",
  maxWidth: "85%",
  background: "var(--bg-pill-blue)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-blue-strong)",
  borderRadius: 8,
  padding: "8px 12px",
};

const brainBubble: React.CSSProperties = {
  alignSelf: "flex-start",
  maxWidth: "85%",
  background: "var(--bg-inner)",
  border: "1px solid var(--border-default)",
  borderRadius: 8,
  padding: "8px 12px",
};

const bubbleLabel: React.CSSProperties = {
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  opacity: 0.5,
  marginBottom: 3,
};

const suggestRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 12,
};

const suggestChip: React.CSSProperties = {
  background: "var(--bg-button-secondary)",
  border: "1px solid var(--border-input)",
  color: "var(--text-secondary-chip)",
  fontSize: 13,
  padding: "5px 12px",
  borderRadius: 999,
  cursor: "pointer",
};

const inputRow: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 12,
};

const textInput: React.CSSProperties = {
  flex: 1,
  background: "var(--bg-input)",
  border: "1px solid var(--border-input)",
  color: "var(--text-primary)",
  fontSize: 14,
  padding: "8px 12px",
  borderRadius: 6,
};

const sendButton: React.CSSProperties = {
  background: "var(--bg-button-primary)",
  border: "1px solid var(--border-button-primary)",
  color: "var(--fg-button-primary)",
  fontSize: 14,
  fontWeight: 600,
  padding: "8px 18px",
  borderRadius: 6,
  cursor: "pointer",
};

const sendButtonDisabled: React.CSSProperties = {
  ...sendButton,
  opacity: 0.45,
  cursor: "not-allowed",
};
