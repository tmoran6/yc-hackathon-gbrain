"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AnalyzerResult } from "./AnalysisPanel";

// User edits stored alongside the raw analyzer result. Free-form overlay so
// the original AI output stays untouched and recoverable.
export type AnalysisEdits = {
  workflow?: {
    title?: string;
    trigger?: string;
    apps_involved?: string[];
    required_inputs?: string[];
    procedure?: string[];
    decision_points?: string[];
    exceptions?: string[];
    suggested_automations?: string[];
  };
  answers?: Record<string, string>;
};

export default function UserReviewPanel({
  sessionId,
  result,
  edits: initialEdits,
  recording,
  updatedAt,
}: {
  sessionId: string;
  result: AnalyzerResult;
  edits: AnalysisEdits;
  recording: string | null;
  updatedAt: Date | null;
}) {
  const router = useRouter();

  const wfRaw = result.workflow ?? {};
  const wfInit = { ...wfRaw, ...(initialEdits.workflow ?? {}) };

  const [title, setTitle] = useState(wfInit.title ?? "");
  const [trigger, setTrigger] = useState(wfInit.trigger ?? "");
  const [procedure, setProcedure] = useState<string[]>(
    Array.isArray(wfInit.procedure) ? [...wfInit.procedure] : [],
  );
  const [decisionPoints, setDecisionPoints] = useState<string[]>(
    Array.isArray(wfInit.decision_points) ? [...wfInit.decision_points] : [],
  );
  const [exceptions, setExceptions] = useState<string[]>(
    Array.isArray(wfInit.exceptions) ? [...wfInit.exceptions] : [],
  );
  const [requiredInputs, setRequiredInputs] = useState<string[]>(
    Array.isArray(wfInit.required_inputs) ? [...wfInit.required_inputs] : [],
  );
  const [answers, setAnswers] = useState<Record<string, string>>({
    ...(initialEdits.answers ?? {}),
  });

  const [busy, setBusy] = useState<null | "save" | "confirm" | "discard">(null);
  const [error, setError] = useState<string | null>(null);

  const questions = result.clarifying_questions ?? [];

  const payload: AnalysisEdits = useMemo(
    () => ({
      workflow: {
        title: title.trim(),
        trigger: trigger.trim(),
        procedure: trimList(procedure),
        decision_points: trimList(decisionPoints),
        exceptions: trimList(exceptions),
        required_inputs: trimList(requiredInputs),
      },
      answers: Object.fromEntries(
        Object.entries(answers).filter(([, v]) => v.trim().length > 0),
      ),
    }),
    [title, trigger, procedure, decisionPoints, exceptions, requiredInputs, answers],
  );

  async function send(action: "save" | "confirm" | "discard") {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(
        `/api/sessions/${sessionId}/analysis/review`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(
            action === "discard"
              ? { action }
              : { action, edits: payload },
          ),
        },
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
      router.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  }

  function confirmDiscard() {
    if (
      window.confirm(
        "Discard this analysis? The recording stays, but the workflow won't be saved.",
      )
    ) {
      void send("discard");
    }
  }

  return (
    <section style={card}>
      <div style={sectionHead}>
        <h2 style={h2}>
          Review workflow
          <span style={pendingBadge}>needs review</span>
        </h2>
        <div style={metaRow}>
          {result.model && <span style={meta}>model {result.model}</span>}
          {typeof result.duration_sec === "number" && (
            <span style={meta}>{result.duration_sec.toFixed(0)}s recorded</span>
          )}
          {recording && <span style={meta}>{recording}</span>}
          {updatedAt && (
            <span style={meta}>
              analyzed {new Date(updatedAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <p style={intro}>
        The analyzer turned your recording into the draft workflow below. Tweak
        anything that's off, answer the clarifying questions, then{" "}
        <strong>Confirm</strong> to lock it in (or <strong>Discard</strong> if
        this run was a false start).
      </p>

      <div style={workflowBox}>
        <Field label="Workflow title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={input}
            placeholder="e.g. Process refill request"
          />
        </Field>
        <Field label="Trigger / purpose">
          <textarea
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            style={{ ...input, minHeight: 56, resize: "vertical" }}
            placeholder="What kicks this off? What outcome does it produce?"
          />
        </Field>

        <ListEditor
          label="Procedure (ordered steps)"
          items={procedure}
          setItems={setProcedure}
          ordered
          placeholder="Step…"
        />
        <ListEditor
          label="Required inputs"
          items={requiredInputs}
          setItems={setRequiredInputs}
          placeholder="e.g. Patient name"
        />
        <ListEditor
          label="Decision points"
          items={decisionPoints}
          setItems={setDecisionPoints}
          placeholder="e.g. If insurance denies, escalate to pharmacist"
        />
        <ListEditor
          label="Exceptions / failure modes"
          items={exceptions}
          setItems={setExceptions}
          placeholder="e.g. Drug interaction warning"
        />
      </div>

      {questions.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={label}>Clarifying questions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {questions.map((q) => (
              <div key={q.id} style={qaCard}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{q.question}</div>
                {q.why && (
                  <div style={{ marginTop: 2, fontSize: 12, opacity: 0.55 }}>
                    {q.why}
                  </div>
                )}
                <textarea
                  value={answers[q.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                  }
                  style={{
                    ...input,
                    marginTop: 8,
                    minHeight: 48,
                    resize: "vertical",
                  }}
                  placeholder="Your answer…"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div style={errBox}>
          {error}
        </div>
      )}

      <div style={actions}>
        <button
          type="button"
          onClick={confirmDiscard}
          disabled={busy !== null}
          style={btnDanger(busy !== null)}
        >
          Discard
        </button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => send("save")}
          disabled={busy !== null}
          style={btnSecondary(busy !== null)}
        >
          {busy === "save" ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          onClick={() => send("confirm")}
          disabled={busy !== null}
          style={btnPrimary(busy !== null)}
        >
          {busy === "confirm" ? "Confirming…" : "Confirm workflow"}
        </button>
      </div>
    </section>
  );
}

function ListEditor({
  label: l,
  items,
  setItems,
  ordered,
  placeholder,
}: {
  label: string;
  items: string[];
  setItems: (next: string[]) => void;
  ordered?: boolean;
  placeholder?: string;
}) {
  function update(i: number, v: string) {
    const next = [...items];
    next[i] = v;
    setItems(next);
  }
  function remove(i: number) {
    setItems(items.filter((_, j) => j !== i));
  }
  function add() {
    setItems([...items, ""]);
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  }
  return (
    <div style={{ marginTop: 12 }}>
      <div style={label}>{l}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((it, i) => (
          <div
            key={i}
            style={{ display: "flex", gap: 6, alignItems: "flex-start" }}
          >
            <span style={rowIdx}>{ordered ? `${i + 1}.` : "•"}</span>
            <textarea
              value={it}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              style={{
                ...input,
                minHeight: 32,
                padding: "6px 10px",
                resize: "vertical",
              }}
              rows={1}
            />
            {ordered && (
              <>
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  style={tinyBtn(i === 0)}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                  style={tinyBtn(i === items.length - 1)}
                  title="Move down"
                >
                  ↓
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => remove(i)}
              style={tinyBtn(false)}
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" onClick={add} style={addBtn}>
          + Add {ordered ? "step" : "item"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label: l,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={label}>{l}</div>
      {children}
    </div>
  );
}

function trimList(items: string[]): string[] {
  return items.map((s) => s.trim()).filter((s) => s.length > 0);
}

const card: React.CSSProperties = {
  border: "1px solid var(--border-blue-strong)",
  borderRadius: 8,
  padding: "1.25rem 1.5rem",
  marginBottom: "2rem",
  background: "var(--bg-review-card)",
};

const sectionHead: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 12,
  marginBottom: 8,
};

const h2: React.CSSProperties = { margin: 0, fontSize: 18 };

const metaRow: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const meta: React.CSSProperties = { fontSize: 12, opacity: 0.5 };

const intro: React.CSSProperties = {
  margin: "0 0 16px",
  fontSize: 13,
  opacity: 0.7,
  lineHeight: 1.5,
};

const workflowBox: React.CSSProperties = {
  border: "1px solid var(--border-default)",
  borderRadius: 8,
  padding: "1rem 1.25rem",
  background: "var(--bg-inner)",
};

const label: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  opacity: 0.6,
  marginBottom: 6,
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  background: "var(--bg-input)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-input)",
  borderRadius: 6,
  padding: "8px 12px",
  fontSize: 14,
  fontFamily: "inherit",
  lineHeight: 1.4,
};

const rowIdx: React.CSSProperties = {
  fontSize: 13,
  opacity: 0.5,
  paddingTop: 8,
  width: 24,
  flexShrink: 0,
  textAlign: "right",
};

const qaCard: React.CSSProperties = {
  border: "1px solid var(--border-default)",
  borderRadius: 6,
  padding: "10px 12px",
  background: "var(--bg-inner)",
};

const actions: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 20,
};

const errBox: React.CSSProperties = {
  marginTop: 16,
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid var(--border-error-box)",
  background: "var(--bg-error-box)",
  color: "var(--fg-error-text)",
  fontSize: 13,
};

const pendingBadge: React.CSSProperties = {
  marginLeft: 10,
  fontSize: 11,
  fontWeight: 500,
  color: "var(--fg-pill-orange-alt)",
  background: "var(--bg-pill-orange-alt)",
  padding: "2px 8px",
  borderRadius: 999,
  verticalAlign: "middle",
};

function btnBase(disabled: boolean): React.CSSProperties {
  return {
    padding: "8px 16px",
    borderRadius: 6,
    border: "1px solid var(--border-input)",
    fontSize: 13,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
  };
}

function btnPrimary(disabled: boolean): React.CSSProperties {
  return {
    ...btnBase(disabled),
    background: "var(--bg-button-primary)",
    borderColor: "var(--border-button-primary)",
    color: "var(--fg-button-primary)",
  };
}

function btnSecondary(disabled: boolean): React.CSSProperties {
  return {
    ...btnBase(disabled),
    background: "var(--bg-button-secondary)",
    color: "var(--text-primary)",
  };
}

function btnDanger(disabled: boolean): React.CSSProperties {
  return {
    ...btnBase(disabled),
    background: "var(--bg-button-danger)",
    borderColor: "var(--border-button-danger)",
    color: "var(--fg-button-danger)",
  };
}

function tinyBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: "4px 8px",
    borderRadius: 4,
    border: "1px solid var(--border-input)",
    background: disabled ? "var(--bg-button-disabled)" : "var(--bg-button-secondary)",
    color: disabled ? "var(--text-disabled)" : "var(--text-primary)",
    fontSize: 12,
    cursor: disabled ? "not-allowed" : "pointer",
    minWidth: 28,
  };
}

const addBtn: React.CSSProperties = {
  alignSelf: "flex-start",
  marginTop: 4,
  padding: "4px 10px",
  borderRadius: 4,
  border: "1px dashed var(--border-input)",
  background: "transparent",
  color: "var(--text-link)",
  fontSize: 12,
  cursor: "pointer",
};
