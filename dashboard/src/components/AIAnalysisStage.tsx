"use client";

import { useState, useEffect, useRef } from "react";
import { analyzerOutput } from "@/fixtures/analyzer-output";

const colors = {
  bg: "#0b0d10",
  surface: "#11151a",
  border: "#1f242b",
  borderAccent: "#1d3a5c",
  blue: "#79b8ff",
  blueDim: "#3b6ea3",
  green: "#65d195",
  amber: "#f0b050",
  muted: "#9aa4ad",
  text: "#e8e8e8",
  textDim: "#6b7580",
  purple: "#b388ff",
};

const steps = analyzerOutput.steps;
const totalChunks = steps.length;
const CHUNK_REVEAL_MS = 700; // ms between each chunk appearing

function ChunkRow({
  step,
  visible,
  active,
}: {
  step: (typeof steps)[0];
  visible: boolean;
  active: boolean;
}) {
  const chunkLabel = `${Math.round(step.start_sec)}–${Math.round(step.end_sec)}s`;

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "10px 14px",
        borderRadius: 8,
        background: active
          ? "rgba(121,184,255,0.06)"
          : visible
          ? "rgba(255,255,255,0.02)"
          : "transparent",
        border: `1px solid ${active ? "rgba(121,184,255,0.18)" : visible ? "#1f242b" : "transparent"}`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.4s ease, transform 0.4s ease, background 0.3s",
        marginBottom: 6,
      }}
    >
      {/* Chunk timestamp */}
      <div
        style={{
          flexShrink: 0,
          fontSize: 10,
          fontFamily: "monospace",
          color: active ? colors.blue : colors.textDim,
          background: active ? "rgba(121,184,255,0.1)" : "#161b22",
          padding: "2px 7px",
          borderRadius: 4,
          height: "fit-content",
          marginTop: 2,
          letterSpacing: 0.3,
          transition: "color 0.3s",
          border: `1px solid ${active ? "rgba(121,184,255,0.2)" : "#1f242b"}`,
        }}
      >
        {chunkLabel}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* App tag */}
        <div style={{ marginBottom: 4 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: colors.purple,
              background: "rgba(179,136,255,0.08)",
              padding: "1px 7px",
              borderRadius: 3,
              border: "1px solid rgba(179,136,255,0.15)",
            }}
          >
            {step.analysis.primary_app}
          </span>
        </div>

        {/* Doing */}
        <div
          style={{
            fontSize: 13,
            color: colors.text,
            lineHeight: 1.4,
            marginBottom: 3,
          }}
        >
          {step.analysis.action}
        </div>

        {/* Intent */}
        <div style={{ fontSize: 12, color: colors.muted, fontStyle: "italic" }}>
          Intent: {step.analysis.intent}
        </div>
      </div>

      {/* Check or spinner */}
      <div
        style={{
          flexShrink: 0,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: active
            ? "transparent"
            : "rgba(101,209,149,0.12)",
          border: active
            ? `2px solid rgba(121,184,255,0.4)`
            : "1px solid rgba(101,209,149,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          color: active ? colors.blue : colors.green,
          animation: active ? "spin 0.8s linear infinite" : "none",
          marginTop: 2,
          transition: "all 0.3s",
        }}
      >
        {active ? "" : "✓"}
      </div>
    </div>
  );
}

export function AIAnalysisStage({ playing }: { playing: boolean }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!playing) return;

    setVisibleCount(0);
    setDone(false);

    let count = 0;
    function showNext() {
      count += 1;
      setVisibleCount(count);
      if (count < totalChunks) {
        timerRef.current = setTimeout(showNext, CHUNK_REVEAL_MS);
      } else {
        setTimeout(() => setDone(true), 400);
      }
    }

    timerRef.current = setTimeout(showNext, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing]);

  const progress = visibleCount / totalChunks;

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
          padding: "14px 18px",
          borderBottom: `1px solid ${colors.border}`,
          background: "rgba(179,136,255,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Gemini badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 10px",
              background: "rgba(179,136,255,0.1)",
              border: "1px solid rgba(179,136,255,0.25)",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              color: colors.purple,
              letterSpacing: 0.5,
            }}
          >
            <span style={{ fontSize: 13 }}>✦</span>
            Gemini 2.0 Flash
          </div>

          <span style={{ fontSize: 12, color: colors.textDim }}>
            Segmenting{" "}
            <span style={{ color: colors.muted }}>
              {analyzerOutput.chunk_seconds}s chunks
            </span>{" "}
            from{" "}
            <span style={{ color: colors.muted }}>
              {analyzerOutput.duration_sec}s
            </span>{" "}
            recording
          </span>
        </div>

        {done ? (
          <div
            style={{
              padding: "2px 10px",
              background: "rgba(101,209,149,0.12)",
              border: "1px solid rgba(101,209,149,0.3)",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              color: colors.green,
              letterSpacing: 0.5,
            }}
          >
            ANALYSIS COMPLETE
          </div>
        ) : playing ? (
          <div style={{ fontSize: 12, color: colors.textDim, fontFamily: "monospace" }}>
            <span style={{ color: colors.blue }}>{visibleCount}</span> / {totalChunks} chunks
          </div>
        ) : null}
      </div>

      {/* Audio summary strip */}
      <div
        style={{
          padding: "10px 18px",
          borderBottom: `1px solid ${colors.border}`,
          background: "rgba(240,176,80,0.04)",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>👁</span>
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: colors.amber,
              marginBottom: 3,
            }}
          >
            Vision Analysis
          </div>
          <div style={{ fontSize: 13, color: colors.muted, lineHeight: 1.5, fontStyle: "italic" }}>
            Reading {analyzerOutput.frame_count} screen frames — recognizing apps,
            reconstructing each action and its intent. No audio track; the Eyes
            work from what they see.
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          padding: "10px 18px 0",
          background: "#0c0f14",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 5,
            fontSize: 11,
            color: colors.textDim,
          }}
        >
          <span>Chunk analysis progress</span>
          <span style={{ color: colors.blue, fontFamily: "monospace" }}>
            {Math.round(progress * 100)}%
          </span>
        </div>
        <div
          style={{
            height: 4,
            background: "#1a1f28",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress * 100}%`,
              background: done
                ? colors.green
                : "linear-gradient(90deg, #b388ff, #79b8ff)",
              borderRadius: 2,
              transition: "width 0.3s ease",
              boxShadow: playing && !done ? "0 0 8px rgba(179,136,255,0.5)" : "none",
            }}
          />
        </div>
      </div>

      {/* Chunk rows */}
      <div style={{ padding: "12px 18px 16px" }}>
        {steps.map((step, i) => (
          <ChunkRow
            key={step.chunk}
            step={step}
            visible={i < visibleCount}
            active={i === visibleCount - 1 && !done}
          />
        ))}

        {/* Extracting skill notice */}
        {done && (
          <div
            style={{
              marginTop: 8,
              padding: "10px 14px",
              background: "rgba(101,209,149,0.06)",
              border: "1px solid rgba(101,209,149,0.2)",
              borderRadius: 8,
              fontSize: 13,
              color: colors.green,
              display: "flex",
              alignItems: "center",
              gap: 8,
              animation: "fadeSlideUp 0.4s ease",
            }}
          >
            <span style={{ fontSize: 16 }}>✓</span>
            All chunks analyzed — extracting structured workflow skill…
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
