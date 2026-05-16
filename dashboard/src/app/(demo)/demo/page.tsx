import { SkillCard } from "@/components/SkillCard";
import { CommitButton } from "@/components/CommitButton";
import { BrainChat } from "@/components/BrainChat";
import { skillPage } from "@/fixtures/skill-page";

export const metadata = {
  title: "Work Recorder — GBrain Demo",
  description: "Record once, answer forever. A pharmacy owner captures a task and it becomes a queryable GBrain skill.",
};

const colors = {
  text: "#e8e8e8",
  muted: "#9aa4ad",
  textDim: "#6b7580",
  blue: "#79b8ff",
  green: "#65d195",
  border: "#1f242b",
  surface: "#11151a",
};

function StepBadge({ n, label }: { n: number; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: "0.4rem",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "#13233a",
          border: `1.5px solid #3b6ea3`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          color: colors.blue,
          flexShrink: 0,
        }}
      >
        {n}
      </div>
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: colors.text,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default function DemoPage() {
  const SLUG = "medication-refill-processing";

  return (
    <main
      style={{
        maxWidth: 860,
        margin: "0 auto",
        padding: "2rem 0 4rem",
      }}
    >
      {/* Hero */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 12px",
            background: "rgba(101,209,149,0.08)",
            border: "1px solid rgba(101,209,149,0.2)",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: colors.green,
            marginBottom: "1rem",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: colors.green,
              boxShadow: `0 0 6px ${colors.green}`,
              display: "inline-block",
            }}
          />
          GBrain Work Recorder
        </div>

        <h1
          style={{
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 800,
            margin: "0 0 0.75rem",
            color: colors.text,
            lineHeight: 1.15,
            letterSpacing: -0.5,
          }}
        >
          Record once.{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #79b8ff 0%, #65d195 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Answer forever.
          </span>
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: 16,
            color: colors.muted,
            lineHeight: 1.7,
            maxWidth: 600,
          }}
        >
          A pharmacy owner processes one insurance rejection. GBrain watches,
          captures the workflow, and turns it into a skill — so any new hire can
          instantly ask the brain how to handle it.
        </p>
      </div>

      {/* Pipeline viz */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: "2.5rem",
          flexWrap: "wrap",
        }}
      >
        {["Screen Recording", "AI Analysis", "Skill Captured", "Brain Query"].map(
          (step, i, arr) => (
            <>
              <div
                key={step}
                style={{
                  padding: "5px 14px",
                  borderRadius: 999,
                  background: i === 2 ? "rgba(101,209,149,0.12)" : "#11151a",
                  border: `1px solid ${i === 2 ? "rgba(101,209,149,0.3)" : colors.border}`,
                  fontSize: 12,
                  fontWeight: 600,
                  color: i === 2 ? colors.green : colors.muted,
                  whiteSpace: "nowrap" as const,
                }}
              >
                {step}
              </div>
              {i < arr.length - 1 && (
                <span
                  key={`arrow-${i}`}
                  style={{ color: colors.textDim, fontSize: 14 }}
                >
                  &#8594;
                </span>
              )}
            </>
          )
        )}
      </div>

      {/* Divider */}
      <div
        style={{
          borderTop: `1px solid ${colors.border}`,
          marginBottom: "2rem",
        }}
      />

      {/* Section 1: Skill Captured */}
      <section style={{ marginBottom: "2.5rem" }}>
        <StepBadge n={1} label="Skill Captured from Screen Recording" />
        <p
          style={{
            margin: "0 0 1rem 38px",
            fontSize: 13,
            color: colors.textDim,
            lineHeight: 1.6,
          }}
        >
          GBrain analyzed 142s of screen-recorded footage and extracted this
          structured workflow automatically.
        </p>
        <SkillCard />
      </section>

      {/* Section 2: Commit */}
      <section style={{ marginBottom: "2.5rem" }}>
        <StepBadge n={2} label="Commit to Brain" />
        <p
          style={{
            margin: "0 0 1rem 38px",
            fontSize: 13,
            color: colors.textDim,
            lineHeight: 1.6,
          }}
        >
          Embed this skill into GBrain so all staff can query it in plain
          English — no training required.
        </p>
        <CommitButton slug={SLUG} skillPage={skillPage} />
      </section>

      {/* Section 3: Ask */}
      <section style={{ marginBottom: "2rem" }}>
        <StepBadge n={3} label="Ask your Brain" />
        <p
          style={{
            margin: "0 0 1rem 38px",
            fontSize: 13,
            color: colors.textDim,
            lineHeight: 1.6,
          }}
        >
          A new hire asks a question in natural language. The brain answers from
          the committed skill — instantly and accurately.
        </p>
        <BrainChat />
      </section>

      {/* Footer note */}
      <div
        style={{
          marginTop: "2.5rem",
          padding: "14px 18px",
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          fontSize: 12,
          color: colors.textDim,
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: colors.muted }}>How it works:</strong> The
        screen recorder captures every click + screen state. The AI analyzer
        (Gemini 2.0 Flash) segments the recording into semantic steps and
        extracts workflow structure. The skill page is committed to GBrain via
        vector + keyword indexing. Questions are answered by retrieving the
        relevant skill and synthesizing a response with Claude Sonnet.
      </div>
    </main>
  );
}
