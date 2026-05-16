// Renders a freshly-captured workflow as a "Skill Captured" card. Presentational
// only — the demo page owns fetching and the commit flow. The Workflow shape
// mirrors the analyzer's `workflow` block (see AnalysisPanel's AnalyzerResult).

export type Workflow = {
  title: string;
  trigger?: string;
  apps_involved?: string[];
  required_inputs?: string[];
  procedure?: string[];
  decision_points?: string[];
  exceptions?: string[];
  suggested_automations?: string[];
};

export default function SkillCapturedCard({
  workflow,
  confidence,
  durationSec,
  recording,
  committed,
  children,
}: {
  workflow: Workflow;
  confidence?: number;
  durationSec?: number;
  recording?: string;
  committed?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section style={card}>
      <div style={sectionHead}>
        <h2 style={h2}>
          Skill Captured
          {committed ? (
            <span style={committedBadge}>✓ in your Brain</span>
          ) : (
            <span style={freshBadge}>● new</span>
          )}
        </h2>
        <div style={metaRow}>
          {typeof confidence === "number" && (
            <span style={meta}>{Math.round(confidence * 100)}% confidence</span>
          )}
          {typeof durationSec === "number" && (
            <span style={meta}>{durationSec}s recorded</span>
          )}
          {recording && <span style={meta}>{recording}</span>}
        </div>
      </div>

      <p style={lede}>
        We watched the work once and turned it into a reusable skill. Review it,
        then commit it to your company Brain.
      </p>

      <div style={workflowBox}>
        <h3 style={workflowTitle}>{workflow.title}</h3>
        {workflow.trigger && (
          <p style={{ margin: "0 0 12px", opacity: 0.85, fontSize: 14 }}>
            <strong style={dim}>Trigger:</strong> {workflow.trigger}
          </p>
        )}
        <Pills label="Apps involved" items={workflow.apps_involved} />
        <Ordered label="Procedure" items={workflow.procedure} />
        <Bulleted label="Required inputs" items={workflow.required_inputs} />
        <Bulleted label="Decision points" items={workflow.decision_points} />
        <Bulleted label="Exceptions" items={workflow.exceptions} />
        <Bulleted
          label="Suggested automations"
          items={workflow.suggested_automations}
        />
      </div>

      {children && <div style={{ marginTop: 16 }}>{children}</div>}
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
  marginBottom: 8,
};

const h2: React.CSSProperties = { margin: 0, fontSize: 18 };

const lede: React.CSSProperties = {
  margin: "0 0 16px",
  fontSize: 14,
  opacity: 0.65,
};

const metaRow: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const meta: React.CSSProperties = { fontSize: 12, opacity: 0.5 };

const dim: React.CSSProperties = { color: "var(--text-muted)" };

const workflowBox: React.CSSProperties = {
  border: "1px solid var(--border-default)",
  borderRadius: 8,
  padding: "1rem 1.25rem",
  background: "var(--bg-inner)",
};

const workflowTitle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 16,
  color: "var(--text-link)",
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

const appBadge: React.CSSProperties = {
  display: "inline-block",
  fontSize: 12,
  fontWeight: 500,
  color: "var(--fg-pill-green)",
  background: "var(--bg-pill-green)",
  padding: "2px 8px",
  borderRadius: 999,
};

const freshBadge: React.CSSProperties = {
  marginLeft: 10,
  fontSize: 11,
  fontWeight: 500,
  color: "var(--fg-pill-orange)",
  background: "var(--bg-pill-orange)",
  padding: "2px 8px",
  borderRadius: 999,
  verticalAlign: "middle",
};

const committedBadge: React.CSSProperties = {
  marginLeft: 10,
  fontSize: 11,
  fontWeight: 500,
  color: "var(--fg-pill-green)",
  background: "var(--bg-pill-green)",
  padding: "2px 8px",
  borderRadius: 999,
  verticalAlign: "middle",
};
