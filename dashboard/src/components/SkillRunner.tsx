"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { analyzerOutput } from "@/fixtures/analyzer-output";

const STEPS: string[] = analyzerOutput.workflow.procedure; // 19 steps

const colors = {
  text: "#e8e8e8",
  muted: "#9aa4ad",
  textDim: "#6b7580",
  blue: "#79b8ff",
  green: "#65d195",
  amber: "#f0b050",
  border: "#1f242b",
  surface: "#11151a",
  bg: "#0c0f14",
};

const ERP_ORIGIN = "http://localhost:5002";

export function SkillRunner() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [currentStep, setCurrentStep] = useState(-1); // -1 = not started
  const [waitingForAck, setWaitingForAck] = useState(false);
  const [complete, setComplete] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);

  // Listen for postMessage replies from the ERP iframe
  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      if (!ev.data || typeof ev.data !== "object") return;

      if (ev.data.type === "gbrain-step-done") {
        const acknowledgedStep: number = ev.data.step;
        setWaitingForAck(false);
        const nextStep = acknowledgedStep + 1;
        if (nextStep >= STEPS.length) {
          setComplete(true);
          setCurrentStep(STEPS.length); // all done
        } else {
          setCurrentStep(nextStep - 1); // mark that step as completed; "next" starts at nextStep
        }
      }

      if (ev.data.type === "gbrain-reset-done") {
        setCurrentStep(-1);
        setWaitingForAck(false);
        setComplete(false);
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const postToErp = useCallback(
    (msg: object) => {
      iframeRef.current?.contentWindow?.postMessage(msg, ERP_ORIGIN);
    },
    []
  );

  function handleNextStep() {
    if (waitingForAck || complete) return;
    const stepToRun = currentStep + 1; // 0-indexed step to execute
    setWaitingForAck(true);
    // Optimistically mark the step as "in progress" visually
    setCurrentStep(stepToRun - 1); // show up to previous as done
    postToErp({ type: "gbrain-run-step", step: stepToRun });
  }

  function handleReset() {
    postToErp({ type: "gbrain-reset" });
  }

  const isStepDone = (i: number) => i < currentStep + 1;
  const isStepActive = (i: number) => i === currentStep + 1 && waitingForAck;
  const nextStepIdx = currentStep + 1; // the next step that will run

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        gap: 16,
        alignItems: "start",
      }}
    >
      {/* Left panel: checklist + controls */}
      <div
        style={{
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: 10,
          padding: "16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Header */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: colors.muted,
            borderBottom: `1px solid ${colors.border}`,
            paddingBottom: 8,
          }}
        >
          Workflow Steps
        </div>

        {/* Step checklist */}
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
          {STEPS.map((step, i) => {
            const done = isStepDone(i);
            const active = isStepActive(i);
            return (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  fontSize: 12,
                  lineHeight: 1.4,
                  color: done
                    ? colors.green
                    : active
                    ? colors.blue
                    : i === nextStepIdx
                    ? colors.text
                    : colors.textDim,
                  transition: "color 0.3s",
                  fontWeight: active || i === nextStepIdx ? 600 : 400,
                }}
              >
                {/* Step indicator */}
                <span
                  style={{
                    flexShrink: 0,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    background: done
                      ? "rgba(101,209,149,0.18)"
                      : active
                      ? "rgba(121,184,255,0.18)"
                      : "transparent",
                    border: `1.5px solid ${
                      done
                        ? colors.green
                        : active
                        ? colors.blue
                        : colors.border
                    }`,
                    color: done ? colors.green : active ? colors.blue : colors.textDim,
                    transition: "all 0.3s",
                  }}
                >
                  {done ? "✓" : active ? "…" : i + 1}
                </span>
                <span style={{ paddingTop: 1 }}>{step}</span>
              </li>
            );
          })}
        </ol>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${colors.border}` }} />

        {/* Controls */}
        {complete ? (
          <div
            style={{
              padding: "12px 10px",
              borderRadius: 8,
              background: "rgba(101,209,149,0.08)",
              border: `1px solid rgba(101,209,149,0.25)`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>✓</div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: colors.green,
                lineHeight: 1.4,
              }}
            >
              Workflow complete
            </div>
            <div
              style={{
                fontSize: 11,
                color: colors.muted,
                marginTop: 4,
                lineHeight: 1.4,
              }}
            >
              Done by the brain, hands-free.
            </div>
            <button
              onClick={handleReset}
              style={{
                marginTop: 10,
                padding: "6px 14px",
                borderRadius: 6,
                border: `1px solid ${colors.border}`,
                background: colors.surface,
                color: colors.muted,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              ⟲ Reset
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={handleNextStep}
              disabled={waitingForAck}
              style={{
                padding: "10px 0",
                borderRadius: 8,
                border: "none",
                cursor: waitingForAck ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
                background: waitingForAck
                  ? "#2a3040"
                  : "linear-gradient(135deg, #3b6ea3 0%, #2a5078 100%)",
                boxShadow: waitingForAck
                  ? "none"
                  : "0 2px 16px rgba(59,110,163,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s",
              }}
            >
              {waitingForAck ? (
                <>
                  <span
                    style={{
                      display: "inline-block",
                      animation: "spin 0.9s linear infinite",
                    }}
                  >
                    ⟳
                  </span>
                  Running…
                </>
              ) : currentStep === -1 ? (
                <>▶ Start Workflow</>
              ) : (
                <>
                  ▶ Next Step
                  <span
                    style={{
                      fontSize: 11,
                      background: "rgba(255,255,255,0.15)",
                      padding: "1px 6px",
                      borderRadius: 4,
                    }}
                  >
                    {nextStepIdx + 1}/{STEPS.length}
                  </span>
                </>
              )}
            </button>

            {currentStep >= 0 && (
              <button
                onClick={handleReset}
                style={{
                  padding: "6px 0",
                  borderRadius: 6,
                  border: `1px solid ${colors.border}`,
                  background: "transparent",
                  color: colors.muted,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                ⟲ Reset
              </button>
            )}

            {currentStep === -1 && (
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: colors.textDim,
                  textAlign: "center",
                  lineHeight: 1.5,
                }}
              >
                Each click performs one step in the live ERP.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right panel: ERP iframe */}
      <div
        style={{
          border: `1px solid ${colors.border}`,
          borderRadius: 10,
          overflow: "hidden",
          background: "#fff",
          minHeight: 540,
          position: "relative",
        }}
      >
        {/* iframe label */}
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 10,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: "#9aa4ad",
            background: "rgba(12,15,20,0.7)",
            padding: "2px 8px",
            borderRadius: 4,
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          RxMaster ERP — live
        </div>
        <iframe
          ref={iframeRef}
          src={ERP_ORIGIN}
          onLoad={() => setIframeReady(true)}
          style={{
            width: "100%",
            height: 540,
            border: "none",
            display: "block",
          }}
          title="RxMaster Pharmacy ERP"
        />
        {!iframeReady && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: colors.bg,
              color: colors.textDim,
              fontSize: 13,
              gap: 8,
            }}
          >
            <span
              style={{
                display: "inline-block",
                animation: "spin 1s linear infinite",
              }}
            >
              ⟳
            </span>
            Loading ERP…
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
