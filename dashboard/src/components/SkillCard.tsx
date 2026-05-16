"use client";

import { analyzerOutput } from "@/fixtures/analyzer-output";

type Workflow = typeof analyzerOutput.workflow;

// Color palette matching the dark dashboard theme
const colors = {
  bg: "#0b0d10",
  surface: "#11151a",
  border: "#1f242b",
  borderAccent: "#1d3a5c",
  blue: "#79b8ff",
  blueDim: "#3b6ea3",
  green: "#65d195",
  greenDim: "#1b3a2b",
  amber: "#f0b050",
  amberDim: "#3a2c10",
  red: "#f07070",
  redDim: "#3a1b1b",
  muted: "#9aa4ad",
  text: "#e8e8e8",
  textDim: "#6b7580",
};

function Badge({
  children,
  color,
  bg,
}: {
  children: React.ReactNode;
  color: string;
  bg: string;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.4,
        textTransform: "uppercase",
        background: bg,
        color,
      }}
    >
      {children}
    </span>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: colors.muted,
          marginBottom: "0.5rem",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

export function SkillCard() {
  const wf: Workflow = analyzerOutput.workflow;
  const session = analyzerOutput.session;
  const duration = analyzerOutput.duration_sec;

  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.borderAccent}`,
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "18px 24px 14px",
          borderBottom: `1px solid ${colors.border}`,
          background: "rgba(121, 184, 255, 0.04)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: colors.green,
                boxShadow: `0 0 8px ${colors.green}`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: colors.green,
              }}
            >
              Skill Captured
            </span>
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: colors.text,
              lineHeight: 1.25,
            }}
          >
            {wf.title}
          </h2>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: colors.muted, marginBottom: 2 }}>
            Session
          </div>
          <div style={{ fontSize: 12, color: colors.blue, fontFamily: "monospace" }}>
            {session}
          </div>
          <div style={{ fontSize: 11, color: colors.textDim, marginTop: 2 }}>
            {Math.round(duration)}s recorded
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 24px" }}>
        {/* Trigger */}
        <Section label="Trigger">
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: colors.muted,
              lineHeight: 1.6,
              fontStyle: "italic",
            }}
          >
            {wf.trigger}
          </p>
        </Section>

        {/* Procedure */}
        <Section label="Procedure">
          <ol
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {wf.procedure.map((step, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: colors.text,
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: colors.blueDim,
                    color: colors.blue,
                    fontSize: 11,
                    fontWeight: 700,
                    marginTop: 1,
                  }}
                >
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </Section>

        {/* Decision points */}
        <Section label="Decision Points">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {wf.decision_points.map((dp, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "8px 12px",
                  background: colors.amberDim,
                  border: `1px solid rgba(240,176,80,0.2)`,
                  borderRadius: 6,
                  fontSize: 13,
                  color: colors.amber,
                  lineHeight: 1.5,
                }}
              >
                <span style={{ flexShrink: 0, fontSize: 14 }}>?</span>
                {dp}
              </div>
            ))}
          </div>
        </Section>

        {/* Exceptions */}
        <Section label="Exceptions">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {wf.exceptions.map((ex, i) => {
              const [label, ...rest] = ex.split(":");
              return (
                <div
                  key={i}
                  style={{
                    padding: "8px 12px",
                    background: colors.redDim,
                    border: `1px solid rgba(240,112,112,0.2)`,
                    borderRadius: 6,
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ fontWeight: 700, color: colors.red }}>
                    {label}:
                  </span>
                  <span style={{ color: "#c9a0a0" }}>{rest.join(":")}</span>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Required inputs */}
        <Section label="Required Inputs">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {wf.required_inputs.map((inp, i) => (
              <Badge key={i} color={colors.blue} bg="#13233a">
                {inp}
              </Badge>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
