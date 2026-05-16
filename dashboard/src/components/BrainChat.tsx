"use client";

import { useState, useRef, useEffect } from "react";

const BRAIN_API_BASE = "/api/brain";

const colors = {
  surface: "#11151a",
  surfaceAlt: "#0f1318",
  border: "#1f242b",
  borderAccent: "#1d3a5c",
  blue: "#79b8ff",
  blueDim: "#3b6ea3",
  green: "#65d195",
  muted: "#9aa4ad",
  text: "#e8e8e8",
  textDim: "#6b7580",
  inputBg: "#080a0d",
};

const SUGGESTED = [
  "How do I register a new patient?",
  "What information do I need to book a vaccine appointment?",
  "How do I schedule a vaccine appointment for a patient?",
];

type Message = {
  role: "user" | "brain";
  text: string;
  streaming?: boolean;
};

export function BrainChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(question: string) {
    if (!question.trim() || busy) return;
    setBusy(true);

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setMessages((prev) => [...prev, { role: "brain", text: "", streaming: true }]);

    const updateBrain = (text: string, streaming: boolean) =>
      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1 ? { role: "brain", text, streaming } : m,
        ),
      );

    // The ask path takes ~10-20s and runs over a tunnel — a single transient
    // network blip would otherwise kill the answer. Retry the whole request.
    const MAX_ATTEMPTS = 3;
    let lastErr = "";
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const res = await fetch(`${BRAIN_API_BASE}/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        });
        if (!res.ok || !res.body) {
          lastErr = `server responded ${res.status}`;
        } else {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            accumulated += decoder.decode(value, { stream: true });
            updateBrain(accumulated, true);
          }
          if (accumulated.trim()) {
            updateBrain(accumulated, false);
            setBusy(false);
            inputRef.current?.focus();
            return;
          }
          lastErr = "empty response";
        }
      } catch (e) {
        lastErr = e instanceof Error ? e.message : "network error";
      }
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }
    updateBrain(
      `Sorry — couldn't reach the brain (${lastErr}). Click a suggested question to retry.`,
      false,
    );
    setBusy(false);
    inputRef.current?.focus();
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.borderAccent}`,
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${colors.border}`,
          background: "rgba(101, 209, 149, 0.04)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1b3a2b 0%, #0f2a1e 100%)",
            border: `1px solid ${colors.green}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            flexShrink: 0,
          }}
        >
          G
        </div>
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: colors.text,
              lineHeight: 1.2,
            }}
          >
            Ask your Brain
          </div>
          <div style={{ fontSize: 11, color: colors.green }}>
            Powered by captured skills
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          minHeight: 240,
          maxHeight: 360,
          overflowY: "auto",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              padding: "24px 0",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: colors.muted,
                textAlign: "center",
              }}
            >
              Ask anything about this workflow, or try a suggested question:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
              {SUGGESTED.map((q, i) => (
                <button
                  key={i}
                  onClick={() => send(q)}
                  style={{
                    background: "transparent",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    padding: "8px 14px",
                    color: colors.blue,
                    fontSize: 13,
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                    lineHeight: 1.4,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = colors.blueDim;
                    (e.currentTarget as HTMLButtonElement).style.background = "#13233a";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = colors.border;
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: m.role === "user" ? "row-reverse" : "row",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                background:
                  m.role === "user"
                    ? "linear-gradient(135deg, #13233a 0%, #0d1a2e 100%)"
                    : "linear-gradient(135deg, #1b3a2b 0%, #0f2a1e 100%)",
                border: `1px solid ${m.role === "user" ? colors.blueDim : colors.green}`,
                color: m.role === "user" ? colors.blue : colors.green,
                marginTop: 2,
              }}
            >
              {m.role === "user" ? "U" : "G"}
            </div>
            {/* Bubble */}
            <div
              style={{
                maxWidth: "82%",
                padding: "9px 13px",
                borderRadius: m.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                background:
                  m.role === "user"
                    ? "#13233a"
                    : colors.surfaceAlt,
                border: `1px solid ${m.role === "user" ? colors.borderAccent : colors.border}`,
                fontSize: 14,
                lineHeight: 1.6,
                color: colors.text,
              }}
            >
              {m.text ||
                (m.streaming && m.role === "brain" ? (
                  <span style={{ color: colors.textDim, fontStyle: "italic" }}>
                    Searching the captured skills…
                  </span>
                ) : null)}
              {m.streaming && (
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 14,
                    background: colors.green,
                    marginLeft: 2,
                    verticalAlign: "middle",
                    borderRadius: 1,
                    animation: "blink 0.8s step-start infinite",
                  }}
                />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          borderTop: `1px solid ${colors.border}`,
          padding: "12px 16px",
          display: "flex",
          gap: 8,
          alignItems: "flex-end",
          background: colors.inputBg,
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask your brain anything… (Enter to send)"
          rows={1}
          disabled={busy}
          style={{
            flex: 1,
            background: "transparent",
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            padding: "9px 12px",
            color: colors.text,
            fontSize: 14,
            resize: "none",
            outline: "none",
            fontFamily: "inherit",
            lineHeight: 1.5,
            minHeight: 40,
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = colors.blueDim;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = colors.border;
          }}
        />
        <button
          onClick={() => send(input)}
          disabled={busy || !input.trim()}
          style={{
            background:
              busy || !input.trim()
                ? "#1a2030"
                : "linear-gradient(135deg, #3b6ea3 0%, #2a5078 100%)",
            border: "none",
            borderRadius: 8,
            padding: "0 18px",
            height: 40,
            color: busy || !input.trim() ? colors.textDim : colors.text,
            fontSize: 13,
            fontWeight: 600,
            cursor: busy || !input.trim() ? "not-allowed" : "pointer",
            transition: "background 0.2s, color 0.2s",
            flexShrink: 0,
            letterSpacing: 0.3,
          }}
        >
          {busy ? "..." : "Send"}
        </button>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
