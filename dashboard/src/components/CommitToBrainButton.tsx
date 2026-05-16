"use client";

// "Commit to Brain" button. POSTs the captured workflow to the local mock
// commit route and surfaces success/failure inline. The demo page lifts the
// committed state up via onCommitted so the chat box can unlock.

import { useState } from "react";
import type { Workflow } from "./SkillCapturedCard";

type CommitResult = {
  committed: boolean;
  skill_id: string;
  brain_path: string;
  committed_at: string;
};

export default function CommitToBrainButton({
  workflow,
  committed,
  onCommitted,
}: {
  workflow: Workflow;
  committed: boolean;
  onCommitted: (result: CommitResult) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CommitResult | null>(null);

  async function commit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/mock/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow }),
      });
      if (!res.ok) throw new Error(`commit failed (${res.status})`);
      const data: CommitResult = await res.json();
      setResult(data);
      onCommitted(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "commit failed");
    } finally {
      setBusy(false);
    }
  }

  if (committed && result) {
    return (
      <div style={committedBox}>
        <span style={{ fontSize: 14 }}>
          ✓ Committed to your Brain as{" "}
          <code style={codeInline}>{result.skill_id}</code>
        </span>
        <span style={{ fontSize: 12, opacity: 0.6 }}>{result.brain_path}</span>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={commit}
        disabled={busy}
        style={busy ? buttonBusy : buttonPrimary}
      >
        {busy ? "Committing…" : "Commit to Brain"}
      </button>
      {error && <p style={errorText}>{error}</p>}
    </div>
  );
}

const buttonPrimary: React.CSSProperties = {
  background: "var(--bg-button-primary)",
  border: "1px solid var(--border-button-primary)",
  color: "var(--fg-button-primary)",
  fontSize: 14,
  fontWeight: 600,
  padding: "8px 18px",
  borderRadius: 6,
  cursor: "pointer",
};

const buttonBusy: React.CSSProperties = {
  ...buttonPrimary,
  opacity: 0.6,
  cursor: "progress",
};

const committedBox: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  border: "1px solid var(--border-button-primary-chip)",
  background: "var(--bg-pill-green)",
  color: "var(--fg-pill-green)",
  borderRadius: 6,
  padding: "10px 14px",
};

const codeInline: React.CSSProperties = {
  background: "var(--bg-code)",
  padding: "1px 5px",
  borderRadius: 4,
  fontSize: 12,
};

const errorText: React.CSSProperties = {
  margin: "8px 0 0",
  fontSize: 13,
  color: "var(--fg-error-text)",
};
