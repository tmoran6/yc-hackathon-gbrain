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
  red: "#f07070",
  muted: "#9aa4ad",
  text: "#e8e8e8",
  textDim: "#6b7580",
};

const FRAMES = [
  { src: "/frames/frame-1.png", label: "Dashboard — RxMaster ERP" },
  { src: "/frames/frame-2.png", label: "Refill Workflow opened" },
  { src: "/frames/frame-3.png", label: "Patient Search — Garcia, Elena" },
  { src: "/frames/frame-4.png", label: "Insurance Adjudication form" },
  { src: "/frames/frame-5.png", label: "Submitting claim to Aetna HMO…" },
  { src: "/frames/frame-6.png", label: "INSURANCE REJECTED — PA required" },
];

const TOTAL_FRAMES = analyzerOutput.frame_count; // 285

export function ScreenRecordingStage({ playing }: { playing: boolean }) {
  const [frameIdx, setFrameIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const duration = analyzerOutput.duration_sec; // 142.5
  const frameInterval = 900; // ms between visual frames
  const displayFrame = Math.round(
    (frameIdx / (FRAMES.length - 1)) * (TOTAL_FRAMES - 1)
  );

  useEffect(() => {
    if (!playing) return;

    setDone(false);
    setElapsed(0);
    setFrameIdx(0);

    // advance through 6 visual frames
    intervalRef.current = setInterval(() => {
      setFrameIdx((prev) => {
        if (prev >= FRAMES.length - 1) {
          clearInterval(intervalRef.current!);
          setDone(true);
          return prev;
        }
        return prev + 1;
      });
    }, frameInterval);

    // tick elapsed time (compressed: 1s real = ~20s simulated)
    elapsedRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 0.5;
        if (next >= duration) {
          clearInterval(elapsedRef.current!);
          return duration;
        }
        return next;
      });
    }, 50);

    return () => {
      clearInterval(intervalRef.current!);
      clearInterval(elapsedRef.current!);
    };
  }, [playing, duration]);

  const progress = elapsed / duration;
  const currentFrame = FRAMES[frameIdx];

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
      {/* Header bar */}
      <div
        style={{
          padding: "12px 18px",
          borderBottom: `1px solid ${colors.border}`,
          background: "#0c0f14",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* REC badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 10px",
              background: playing && !done ? "rgba(240,112,112,0.15)" : "rgba(50,50,50,0.4)",
              border: `1px solid ${playing && !done ? "rgba(240,112,112,0.4)" : "#333"}`,
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              color: playing && !done ? colors.red : colors.textDim,
              letterSpacing: 0.8,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: playing && !done ? colors.red : "#555",
                boxShadow: playing && !done ? `0 0 6px ${colors.red}` : "none",
                display: "inline-block",
                animation: playing && !done ? "blink 1s step-end infinite" : "none",
              }}
            />
            REC
          </div>
          <span
            style={{
              fontSize: 12,
              color: colors.muted,
              fontFamily: "monospace",
            }}
          >
            {analyzerOutput.session}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 12, color: colors.textDim, fontFamily: "monospace" }}>
            Frame{" "}
            <span style={{ color: colors.blue }}>
              {playing ? displayFrame.toString().padStart(3, "0") : "000"}
            </span>
            {" / "}
            {TOTAL_FRAMES}
          </div>
          <div style={{ fontSize: 12, color: colors.textDim, fontFamily: "monospace" }}>
            <span style={{ color: playing ? colors.text : colors.textDim }}>
              {elapsed.toFixed(1)}s
            </span>
            {" / "}
            {duration}s
          </div>
          {done && (
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
              COMPLETE
            </div>
          )}
        </div>
      </div>

      {/* Screen playback area */}
      <div
        style={{
          position: "relative",
          background: "#080a0c",
          aspectRatio: "16/10",
          overflow: "hidden",
          maxHeight: 420,
        }}
      >
        {/* Frame images */}
        {FRAMES.map((f, i) => (
          <img
            key={f.src}
            src={f.src}
            alt={f.label}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: i === frameIdx ? 1 : 0,
              transition: "opacity 0.35s ease",
            }}
          />
        ))}

        {/* Overlay: not started */}
        {!playing && !done && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(8,10,12,0.85)",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(121,184,255,0.08)",
                border: `1.5px solid rgba(121,184,255,0.3)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                color: colors.blue,
              }}
            >
              ▶
            </div>
            <span style={{ fontSize: 13, color: colors.muted }}>
              Press "Run the pipeline" to start
            </span>
          </div>
        )}

        {/* Scanning line animation while playing */}
        {playing && !done && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 2,
              background:
                "linear-gradient(90deg, transparent, rgba(121,184,255,0.6), transparent)",
              animation: "scanline 1.2s linear infinite",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Frame label overlay */}
        {playing && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "8px 14px",
              background: "linear-gradient(transparent, rgba(8,10,12,0.9))",
              fontSize: 11,
              color: colors.muted,
              fontFamily: "monospace",
              letterSpacing: 0.3,
            }}
          >
            {currentFrame.label}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div
        style={{
          padding: "14px 18px",
          borderTop: `1px solid ${colors.border}`,
          background: "#0c0f14",
        }}
      >
        <div
          style={{
            height: 4,
            background: "#1a1f28",
            borderRadius: 2,
            overflow: "hidden",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress * 100}%`,
              background: done
                ? colors.green
                : "linear-gradient(90deg, #3b6ea3, #79b8ff)",
              borderRadius: 2,
              transition: "width 0.1s linear",
              boxShadow: playing && !done ? "0 0 8px rgba(121,184,255,0.5)" : "none",
            }}
          />
        </div>

        {/* Frame dots */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {FRAMES.map((f, i) => (
            <div
              key={f.src}
              title={f.label}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background:
                  i < frameIdx
                    ? colors.green
                    : i === frameIdx && playing
                    ? colors.blue
                    : "#2a2f3a",
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>

        <div
          style={{
            marginTop: 8,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 10,
            color: colors.textDim,
            fontFamily: "monospace",
          }}
        >
          <span>0:00</span>
          <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, "0")}</span>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes scanline {
          from { top: 0%; }
          to { top: 100%; }
        }
      `}</style>
    </div>
  );
}
