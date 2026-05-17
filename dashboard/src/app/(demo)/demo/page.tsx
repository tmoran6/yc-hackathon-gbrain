"use client";

import { useState, Fragment } from "react";
import { SkillCard } from "@/components/SkillCard";
import { CommitButton } from "@/components/CommitButton";
import { BrainChat } from "@/components/BrainChat";
import { ScreenRecordingStage } from "@/components/ScreenRecordingStage";
import { AIAnalysisStage } from "@/components/AIAnalysisStage";
import { SkillRunner } from "@/components/SkillRunner";
import { EyeMark } from "@/components/EyeMark";
import { skillPage } from "@/fixtures/skill-page";
import { analyzerOutput } from "@/fixtures/analyzer-output";

const colors = {
  text: "#e8e8e8",
  muted: "#9aa4ad",
  textDim: "#6b7580",
  blue: "#79b8ff",
  green: "#65d195",
  amber: "#f0b050",
  purple: "#b388ff",
  border: "#1f242b",
  surface: "#11151a",
};

const PIPELINE_STAGES = [
  { n: 1, label: "Screen Recording", color: colors.blue, dot: "#3b6ea3" },
  { n: 2, label: "AI Analysis", color: colors.purple, dot: "#7c4abf" },
  { n: 3, label: "Skill Captured", color: colors.green, dot: "#2a6a45" },
  { n: 4, label: "Commit to Brain", color: colors.amber, dot: "#7a5820" },
  { n: 5, label: "Ask your Brain", color: colors.green, dot: "#2a6a45" },
  { n: 6, label: "Run the Skill", color: colors.amber, dot: "#7a5820" },
];

function PipelinePill({
  stage,
  active,
  complete,
}: {
  stage: (typeof PIPELINE_STAGES)[0];
  active: boolean;
  complete: boolean;
}) {
  return (
    <div
      style={{
        padding: "5px 14px",
        borderRadius: 999,
        background: complete
          ? `rgba(101,209,149,0.12)`
          : active
          ? "rgba(121,184,255,0.1)"
          : colors.surface,
        border: `1px solid ${
          complete
            ? "rgba(101,209,149,0.3)"
            : active
            ? "rgba(121,184,255,0.35)"
            : colors.border
        }`,
        fontSize: 12,
        fontWeight: 600,
        color: complete ? colors.green : active ? colors.blue : colors.muted,
        whiteSpace: "nowrap" as const,
        display: "flex",
        alignItems: "center",
        gap: 6,
        transition: "all 0.4s ease",
        boxShadow: active ? "0 0 12px rgba(121,184,255,0.15)" : "none",
      }}
    >
      {complete ? (
        <span style={{ fontSize: 10 }}>✓</span>
      ) : active ? (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: colors.blue,
            display: "inline-block",
            boxShadow: `0 0 6px ${colors.blue}`,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      ) : (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#2a2f3a",
            display: "inline-block",
          }}
        />
      )}
      {stage.label}
    </div>
  );
}

function SectionHeader({
  n,
  label,
  active,
  complete,
  color,
}: {
  n: number;
  label: string;
  active: boolean;
  complete: boolean;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: "0.6rem",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: active || complete ? "#13233a" : "#0e1217",
          border: `1.5px solid ${active || complete ? "#3b6ea3" : "#2a2f3a"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          color: active || complete ? colors.blue : colors.textDim,
          flexShrink: 0,
          transition: "all 0.4s",
        }}
      >
        {complete ? "✓" : n}
      </div>
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: active || complete ? colors.text : colors.textDim,
          letterSpacing: 0.2,
          transition: "color 0.4s",
        }}
      >
        {label}
      </span>
      {active && (
        <div
          style={{
            padding: "1px 8px",
            background: "rgba(121,184,255,0.1)",
            border: "1px solid rgba(121,184,255,0.25)",
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 700,
            color: colors.blue,
            letterSpacing: 0.5,
            animation: "fadeIn 0.3s ease",
          }}
        >
          IN PROGRESS
        </div>
      )}
    </div>
  );
}

function LockedOverlay() {
  return (
    <div
      style={{
        height: 64,
        background: "#0c0f14",
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        color: colors.textDim,
        fontSize: 13,
      }}
    >
      <span style={{ fontSize: 14 }}>🔒</span>
      Waiting for previous stage…
    </div>
  );
}

function ContinueButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        marginTop: 14,
        marginLeft: 38,
        padding: "9px 22px",
        borderRadius: 8,
        border: "none",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 700,
        color: "#fff",
        background: "linear-gradient(135deg, #3b6ea3 0%, #2a5078 100%)",
        boxShadow: "0 2px 14px rgba(59,110,163,0.4)",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        letterSpacing: 0.2,
        animation: "fadeIn 0.4s ease",
      }}
    >
      Continue <span style={{ fontSize: 14 }}>→</span>
    </button>
  );
}

export default function DemoPage() {
  const SLUG = "register-new-patient-and-book-vaccine-appointment";

  // Stage unlock state: 0 = nothing started, 1–6 = that stage is active/complete
  const [pipelineStarted, setPipelineStarted] = useState(false);
  const [currentStage, setCurrentStage] = useState(0); // highest unlocked stage

  function startPipeline() {
    if (pipelineStarted) return;
    setPipelineStarted(true);
    setCurrentStage(1);
  }

  function advanceStage(from: number) {
    // Stages 1-4 advance one at a time via Continue. Stage 4's Continue
    // unlocks BOTH stage 5 (Ask) and stage 6 (Run the Skill) — neither has
    // a Continue button of its own.
    setCurrentStage(from === 4 ? 6 : from + 1);
  }

  const isActive = (n: number) => currentStage === n;
  const isComplete = (n: number) => currentStage > n;
  const isUnlocked = (n: number) => currentStage >= n;

  return (
    <main
      style={{
        maxWidth: 860,
        margin: "0 auto",
        padding: "2rem 1rem 4rem",
        position: "relative",
      }}
    >
      {/* Force dark backdrop regardless of prefers-color-scheme */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#0b0d10",
          zIndex: -1,
        }}
      />
      {/* Eye mark — corner decoration */}
      <div
        style={{
          position: "absolute",
          top: "1.25rem",
          right: "1rem",
          zIndex: 1,
        }}
      >
        <EyeMark size={84} />
      </div>

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
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          👁 The Eyes of the company brain
        </div>

        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: colors.muted,
            marginBottom: "0.4rem",
            letterSpacing: 0.2,
          }}
        >
          GBrain gave businesses a brain.
        </div>

        <div
          style={{
            fontSize: "clamp(20px, 2.6vw, 28px)",
            fontWeight: 700,
            color: colors.muted,
            marginBottom: "0.2rem",
          }}
        >
          We built the Eyes.
        </div>
        <h1
          style={{
            margin: "0 0 0.75rem",
            lineHeight: 1.05,
          }}
        >
          <span
            style={{
              fontSize: "clamp(56px, 9vw, 104px)",
              fontWeight: 900,
              letterSpacing: -2,
              color: colors.text,
            }}
          >
            GEyes
          </span>
        </h1>

        <p
          style={{
            margin: "0 0 1.5rem",
            fontSize: 16,
            color: colors.muted,
            lineHeight: 1.7,
            maxWidth: 600,
          }}
        >
          The Eyes <strong style={{ color: colors.text }}>watch</strong> a
          business do its work once,{" "}
          <strong style={{ color: colors.text }}>understand</strong> the
          workflow, and <strong style={{ color: colors.text }}>teach</strong> it
          to GBrain — so anyone can{" "}
          <strong style={{ color: colors.text }}>ask</strong> the brain later.
          Watch a pharmacy owner register a new patient and book a vaccine
          appointment below.
        </p>

        {/* Run button */}
        {!pipelineStarted && (
          <button
            onClick={startPipeline}
            style={{
              padding: "13px 28px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              background: "linear-gradient(135deg, #3b6ea3 0%, #2a5078 50%, #1d3a5c 100%)",
              boxShadow: "0 2px 20px rgba(59,110,163,0.45)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              letterSpacing: 0.3,
              animation: "pulse-btn 2.5s ease-in-out infinite",
            }}
          >
            <span style={{ fontSize: 18 }}>▶</span>
            Run the pipeline
          </button>
        )}

        {pipelineStarted && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              background: "rgba(101,209,149,0.06)",
              border: "1px solid rgba(101,209,149,0.2)",
              borderRadius: 8,
              fontSize: 13,
              color: colors.green,
              animation: "fadeIn 0.4s ease",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: colors.green,
                display: "inline-block",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
            {currentStage < 6 ? `Stage ${currentStage} / 6 — click Continue to advance` : "Pipeline complete ✓"}
          </div>
        )}
      </div>

      {/* Pipeline pill row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: "2.5rem",
          flexWrap: "wrap",
        }}
      >
        {PIPELINE_STAGES.map((stage, i) => (
          <Fragment key={stage.n}>
            <PipelinePill
              stage={stage}
              active={isActive(stage.n)}
              complete={isComplete(stage.n)}
            />
            {i < PIPELINE_STAGES.length - 1 && (
              <span
                style={{
                  color: isComplete(stage.n) ? colors.green : colors.textDim,
                  fontSize: 14,
                  transition: "color 0.4s",
                }}
              >
                &#8594;
              </span>
            )}
          </Fragment>
        ))}
      </div>

      {/* Divider */}
      <div
        style={{
          borderTop: `1px solid ${colors.border}`,
          marginBottom: "2rem",
        }}
      />

      {/* Stage 1: Screen Recording */}
      <section style={{ marginBottom: "2.5rem" }}>
        <SectionHeader
          n={1}
          label="Screen Recording"
          active={isActive(1)}
          complete={isComplete(1)}
          color={colors.blue}
        />
        <p
          style={{
            margin: "0 0 1rem 38px",
            fontSize: 13,
            color: isUnlocked(1) ? colors.textDim : "#3a3f4a",
            lineHeight: 1.6,
            transition: "color 0.4s",
          }}
        >
          GBrain&apos;s recorder captures every screen state and click while the
          pharmacist registers a new patient — {analyzerOutput.frame_count} frames
          over {analyzerOutput.duration_sec}s.
        </p>
        {isUnlocked(1) ? (
          <div style={{ animation: "fadeSlideUp 0.5s ease" }}>
            <ScreenRecordingStage playing={isActive(1) || isComplete(1)} />
            {isActive(1) && (
              <ContinueButton onClick={() => advanceStage(1)} />
            )}
          </div>
        ) : (
          <LockedOverlay />
        )}
      </section>

      {/* Stage 2: AI Analysis */}
      <section style={{ marginBottom: "2.5rem" }}>
        <SectionHeader
          n={2}
          label="AI Analysis"
          active={isActive(2)}
          complete={isComplete(2)}
          color={colors.purple}
        />
        <p
          style={{
            margin: "0 0 1rem 38px",
            fontSize: 13,
            color: isUnlocked(2) ? colors.textDim : "#3a3f4a",
            lineHeight: 1.6,
            transition: "color 0.4s",
          }}
        >
          Gemini 2.0 Flash segments the recording into {analyzerOutput.steps.length} ×{" "}
          {analyzerOutput.chunk_seconds}s chunks, identifying the app, action, and
          intent in each — including the audio narration.
        </p>
        {isUnlocked(2) ? (
          <div style={{ animation: "fadeSlideUp 0.5s ease" }}>
            <AIAnalysisStage playing={isActive(2) || isComplete(2)} />
            {isActive(2) && (
              <ContinueButton onClick={() => advanceStage(2)} />
            )}
          </div>
        ) : (
          <LockedOverlay />
        )}
      </section>

      {/* Stage 3: Skill Captured */}
      <section style={{ marginBottom: "2.5rem" }}>
        <SectionHeader
          n={3}
          label="Skill Captured"
          active={isActive(3)}
          complete={isComplete(3)}
          color={colors.green}
        />
        <p
          style={{
            margin: "0 0 1rem 38px",
            fontSize: 13,
            color: isUnlocked(3) ? colors.textDim : "#3a3f4a",
            lineHeight: 1.6,
            transition: "color 0.4s",
          }}
        >
          GBrain synthesizes the chunk analysis into a structured, queryable skill —
          procedure, decision points, exceptions, and suggested automations.
        </p>
        {isUnlocked(3) ? (
          <div style={{ animation: "fadeSlideUp 0.5s ease" }}>
            <SkillCard />
            {isActive(3) && (
              <ContinueButton onClick={() => advanceStage(3)} />
            )}
          </div>
        ) : (
          <LockedOverlay />
        )}
      </section>

      {/* Stage 4: Commit */}
      <section style={{ marginBottom: "2.5rem" }}>
        <SectionHeader
          n={4}
          label="Commit to Brain"
          active={isActive(4)}
          complete={isComplete(4)}
          color={colors.amber}
        />
        <p
          style={{
            margin: "0 0 1rem 38px",
            fontSize: 13,
            color: isUnlocked(4) ? colors.textDim : "#3a3f4a",
            lineHeight: 1.6,
            transition: "color 0.4s",
          }}
        >
          Embed this skill into GBrain so all staff can query it in plain
          English — no training required.
        </p>
        {isUnlocked(4) ? (
          <div style={{ animation: "fadeSlideUp 0.5s ease" }}>
            <CommitButton slug={SLUG} skillPage={skillPage} />
            {isActive(4) && (
              <ContinueButton onClick={() => advanceStage(4)} />
            )}
          </div>
        ) : (
          <LockedOverlay />
        )}
      </section>

      {/* Stage 5: Ask */}
      <section style={{ marginBottom: "2rem" }}>
        <SectionHeader
          n={5}
          label="Ask your Brain"
          active={isActive(5)}
          complete={isComplete(5)}
          color={colors.green}
        />
        <p
          style={{
            margin: "0 0 1rem 38px",
            fontSize: 13,
            color: isUnlocked(5) ? colors.textDim : "#3a3f4a",
            lineHeight: 1.6,
            transition: "color 0.4s",
          }}
        >
          A new hire asks a question in natural language. The brain answers from
          the committed skill — instantly and accurately.
        </p>
        {isUnlocked(5) ? (
          <div style={{ animation: "fadeSlideUp 0.5s ease" }}>
            <BrainChat />
          </div>
        ) : (
          <LockedOverlay />
        )}
      </section>

      {/* Stage 6: Run the Skill */}
      <section style={{ marginBottom: "2rem" }}>
        <SectionHeader
          n={6}
          label="Run the Skill"
          active={isActive(6)}
          complete={isComplete(6)}
          color={colors.amber}
        />
        <p
          style={{
            margin: "0 0 1rem 38px",
            fontSize: 13,
            color: isUnlocked(6) ? colors.textDim : "#3a3f4a",
            lineHeight: 1.6,
            transition: "color 0.4s",
          }}
        >
          GEyes captured the skill once — now feed it a list of 12 patients and
          it schedules them all{" "}
          <strong style={{ color: colors.text }}>automatically</strong>. Click{" "}
          <strong style={{ color: colors.text }}>▶ Run skill for all 12 patients</strong>{" "}
          and watch the ERP fill forms for every patient hands-free.
        </p>
        {isUnlocked(6) ? (
          <div style={{ animation: "fadeSlideUp 0.5s ease" }}>
            <SkillRunner />
          </div>
        ) : (
          <LockedOverlay />
        )}
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes pulse-btn {
          0%, 100% { box-shadow: 0 2px 20px rgba(59,110,163,0.45); }
          50% { box-shadow: 0 2px 32px rgba(59,110,163,0.75); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
