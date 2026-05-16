import { formatTimestamp } from "@/lib/format";

// Shape of the analyzer's JSON output (analyzer/analyze.ts). Everything is
// optional/defensive — it comes from an external Gemini pipeline.
export type AnalyzerResult = {
  generated_at?: string;
  model?: string;
  duration_sec?: number;
  frame_count?: number;
  audio?: {
    available?: boolean;
    note?: string;
    summary?: string;
  };
  steps?: Array<{
    chunk: number;
    start_sec: number;
    end_sec: number;
    audio_excerpt?: string | null;
    analysis?: {
      primary_app?: string;
      apps?: string[];
      action?: string;
      intent?: string;
      step_by_step?: string[];
      ui_elements?: string[];
      confidence?: number;
    };
  }>;
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
};

export default function AnalysisPanel({
  result,
  recording,
  updatedAt,
}: {
  result: AnalyzerResult | null;
  recording: string | null;
  updatedAt: Date | null;
}) {
  if (!result) {
    return (
      <section style={card}>
        <div style={sectionHead}>
          <h2 style={h2}>Analysis</h2>
        </div>
        <p style={{ opacity: 0.6, margin: 0, fontSize: 14 }}>
          No analysis yet. It runs automatically ~8s after the recording stops
          (analyzer <code style={codeInline}>npm run watch</code>), then appears
          here.
        </p>
      </section>
    );
  }

  const wf = result.workflow ?? {};
  const steps = result.steps ?? [];
  const audio = result.audio;

  return (
    <section style={card}>
      <div style={sectionHead}>
        <h2 style={h2}>Analysis</h2>
        <div style={metaRow}>
          {result.model && <span style={meta}>model {result.model}</span>}
          {typeof result.duration_sec === "number" && (
            <span style={meta}>{result.duration_sec.toFixed(0)}s recorded</span>
          )}
          {recording && <span style={meta}>{recording}</span>}
          {updatedAt && (
            <span style={meta}>updated {formatTimestamp(updatedAt)}</span>
          )}
        </div>
      </div>

      {/* Synthesized workflow */}
      <div style={workflowBox}>
        <h3 style={workflowTitle}>{wf.title ?? "Workflow"}</h3>
        {wf.trigger && (
          <p style={{ margin: "0 0 12px", opacity: 0.85, fontSize: 14 }}>
            <strong style={dim}>Trigger:</strong> {wf.trigger}
          </p>
        )}
        <Pills label="Apps involved" items={wf.apps_involved} />
        <Ordered label="Procedure" items={wf.procedure} />
        <Bulleted label="Required inputs" items={wf.required_inputs} />
        <Bulleted label="Decision points" items={wf.decision_points} />
        <Bulleted label="Exceptions" items={wf.exceptions} />
        <Bulleted
          label="Suggested automations"
          items={wf.suggested_automations}
        />
      </div>

      {audio?.summary && (
        <div style={{ marginTop: 16 }}>
          <div style={label}>Narration summary</div>
          <p style={{ margin: 0, fontSize: 14, opacity: 0.85 }}>
            {audio.summary}
          </p>
        </div>
      )}

      {/* Step-by-step timeline */}
      {steps.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={label}>
            Steps ({steps.length} chunk{steps.length === 1 ? "" : "s"})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {steps.map((s) => {
              const a = s.analysis ?? {};
              return (
                <div key={s.chunk} style={stepCard}>
                  <div style={stepHead}>
                    <span style={timeBadge}>
                      {fmtSec(s.start_sec)}–{fmtSec(s.end_sec)}
                    </span>
                    {a.primary_app && (
                      <span style={appBadge}>{a.primary_app}</span>
                    )}
                    {typeof a.confidence === "number" && (
                      <span style={meta}>
                        {Math.round(a.confidence * 100)}% conf.
                      </span>
                    )}
                  </div>
                  {a.action && (
                    <p style={{ margin: "6px 0 4px", fontSize: 14 }}>
                      {a.action}
                    </p>
                  )}
                  {a.intent && (
                    <p
                      style={{
                        margin: "0 0 6px",
                        fontSize: 13,
                        opacity: 0.6,
                      }}
                    >
                      Intent: {a.intent}
                    </p>
                  )}
                  {a.step_by_step && a.step_by_step.length > 0 && (
                    <ol style={subList}>
                      {a.step_by_step.map((st, i) => (
                        <li key={i} style={{ marginBottom: 2 }}>
                          {st}
                        </li>
                      ))}
                    </ol>
                  )}
                  {s.audio_excerpt && (
                    <p style={{ margin: "6px 0 0", fontSize: 12, opacity: 0.6 }}>
                      🎙 “{s.audio_excerpt}”
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function Ordered({ label: l, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={label}>{l}</div>
      <ol style={listStyle}>
        {items.map((it, i) => (
          <li key={i} style={{ marginBottom: 4 }}>
            {it}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Bulleted({ label: l, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={label}>{l}</div>
      <ul style={listStyle}>
        {items.map((it, i) => (
          <li key={i} style={{ marginBottom: 4 }}>
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Pills({ label: l, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={label}>{l}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {items.map((it, i) => (
          <span key={i} style={appBadge}>
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

function fmtSec(n: number): string {
  if (!Number.isFinite(n)) return "?";
  const s = Math.round(n);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m${String(s % 60).padStart(2, "0")}s` : `${s}s`;
}

const card: React.CSSProperties = {
  border: "1px solid #1f242b",
  borderRadius: 8,
  padding: "1.25rem 1.5rem",
  marginBottom: "2rem",
  background: "#0e1216",
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

const metaRow: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const meta: React.CSSProperties = { fontSize: 12, opacity: 0.5 };

const dim: React.CSSProperties = { color: "#9aa4ad" };

const workflowBox: React.CSSProperties = {
  border: "1px solid #1f242b",
  borderRadius: 8,
  padding: "1rem 1.25rem",
  background: "#11151a",
};

const workflowTitle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 16,
  color: "#79b8ff",
};

const label: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  opacity: 0.6,
  marginBottom: 6,
};

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  fontSize: 14,
  lineHeight: 1.5,
};

const subList: React.CSSProperties = {
  margin: "4px 0 0",
  paddingLeft: 18,
  fontSize: 13,
  opacity: 0.8,
  lineHeight: 1.5,
};

const stepCard: React.CSSProperties = {
  border: "1px solid #1f242b",
  borderRadius: 6,
  padding: "10px 12px",
  background: "#11151a",
};

const stepHead: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const timeBadge: React.CSSProperties = {
  fontFamily: "ui-monospace, monospace",
  fontSize: 12,
  color: "#9aa4ad",
  background: "#1b2028",
  padding: "2px 6px",
  borderRadius: 4,
};

const appBadge: React.CSSProperties = {
  display: "inline-block",
  fontSize: 12,
  fontWeight: 500,
  color: "#65d195",
  background: "#1b3a2b",
  padding: "2px 8px",
  borderRadius: 999,
};

const codeInline: React.CSSProperties = {
  background: "#1b2028",
  padding: "1px 5px",
  borderRadius: 4,
  fontSize: 12,
};
