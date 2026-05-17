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
  red: "#ff7b7b",
  border: "#1f242b",
  surface: "#11151a",
  bg: "#0c0f14",
};

const ERP_ORIGIN = "http://localhost:5002";

// ---- CSV types ----
interface Patient {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  dob: string;
  schedule_datetime: string;
}

type PatientStatus = "pending" | "processing" | "done" | "error";

interface PatientRow extends Patient {
  status: PatientStatus;
  stepsDone: number; // 0-19
}

// ---- Simple CSV parser ----
function parseCsv(text: string): Patient[] {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
    return obj as unknown as Patient;
  });
}

// ---- Step delay between each step in batch mode (ms) ----
const STEP_DELAY_MS = 700;
// Delay between patients (ms)
const PATIENT_DELAY_MS = 1200;

export function SkillRunner() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);

  // Patient list state
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [csvName, setCsvName] = useState("patients-to-schedule.csv");
  const [task, setTask] = useState(
    "Register and schedule these patients for vaccine appointments",
  );

  // Batch runner state
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [currentPatientIdx, setCurrentPatientIdx] = useState(-1);
  const [currentStepLabel, setCurrentStepLabel] = useState("");

  // Refs for communicating with the iframe mid-run
  const stepAckRef = useRef<((step: number) => void) | null>(null);
  const resetAckRef = useRef<(() => void) | null>(null);
  const abortRef = useRef(false);

  // Load CSV on mount
  useEffect(() => {
    fetch("/patients-to-schedule.csv")
      .then((r) => r.text())
      .then((text) => {
        const parsed = parseCsv(text);
        setPatients(
          parsed.map((p) => ({ ...p, status: "pending", stepsDone: 0 }))
        );
        setLoading(false);
      })
      .catch((err) => {
        setLoadError(String(err));
        setLoading(false);
      });
  }, []);

  // Listen for postMessage replies from the ERP iframe
  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      if (!ev.data || typeof ev.data !== "object") return;

      if (ev.data.type === "gbrain-step-done") {
        stepAckRef.current?.(ev.data.step);
      }
      if (ev.data.type === "gbrain-reset-done") {
        resetAckRef.current?.();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const postToErp = useCallback((msg: object) => {
    iframeRef.current?.contentWindow?.postMessage(msg, ERP_ORIGIN);
  }, []);

  // Promisified: send a step and wait for gbrain-step-done
  function runStep(step: number, patient: Patient): Promise<void> {
    return new Promise((resolve) => {
      stepAckRef.current = (ack) => {
        if (ack === step) {
          stepAckRef.current = null;
          resolve();
        }
      };
      postToErp({ type: "gbrain-run-step", step, patient });
    });
  }

  // Promisified: send gbrain-reset and wait for gbrain-reset-done
  function resetErp(): Promise<void> {
    return new Promise((resolve) => {
      resetAckRef.current = () => {
        resetAckRef.current = null;
        resolve();
      };
      postToErp({ type: "gbrain-reset" });
    });
  }

  function sleep(ms: number) {
    return new Promise<void>((r) => setTimeout(r, ms));
  }

  async function runAll() {
    if (running || done) return;
    abortRef.current = false;
    setRunning(true);

    for (let pi = 0; pi < patients.length; pi++) {
      if (abortRef.current) break;

      const patient = patients[pi];

      // Reset ERP between patients (also resets on first patient)
      await resetErp();
      await sleep(400);

      setCurrentPatientIdx(pi);
      setPatients((prev) =>
        prev.map((row, i) =>
          i === pi ? { ...row, status: "processing", stepsDone: 0 } : row
        )
      );

      // Run all 19 steps
      for (let step = 0; step < STEPS.length; step++) {
        if (abortRef.current) break;
        setCurrentStepLabel(STEPS[step]);
        setPatients((prev) =>
          prev.map((row, i) =>
            i === pi ? { ...row, stepsDone: step } : row
          )
        );
        try {
          await runStep(step, patient);
        } catch {
          setPatients((prev) =>
            prev.map((row, i) =>
              i === pi ? { ...row, status: "error" } : row
            )
          );
          break;
        }
        await sleep(STEP_DELAY_MS);
      }

      if (!abortRef.current) {
        setPatients((prev) =>
          prev.map((row, i) =>
            i === pi ? { ...row, status: "done", stepsDone: STEPS.length } : row
          )
        );
      }

      // Pause between patients
      if (pi < patients.length - 1) {
        await sleep(PATIENT_DELAY_MS);
      }
    }

    setRunning(false);
    if (!abortRef.current) {
      setDone(true);
      setCurrentPatientIdx(-1);
      setCurrentStepLabel("");
    }
  }

  function handleReset() {
    abortRef.current = true;
    setRunning(false);
    setDone(false);
    setCurrentPatientIdx(-1);
    setCurrentStepLabel("");
    setPatients((prev) => prev.map((p) => ({ ...p, status: "pending", stepsDone: 0 })));
    postToErp({ type: "gbrain-reset" });
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      try {
        const parsed = parseCsv(text);
        setPatients(parsed.map((p) => ({ ...p, status: "pending", stepsDone: 0 })));
        setCsvName(file.name);
        setLoadError(null);
        setLoading(false);
        setDone(false);
      } catch (err) {
        setLoadError(String(err));
      }
    });
    e.target.value = "";
  }

  const statusIcon = (s: PatientStatus, stepsDone: number, idx: number) => {
    if (s === "done") return <span style={{ color: colors.green, fontWeight: 700 }}>✓</span>;
    if (s === "error") return <span style={{ color: colors.red }}>✗</span>;
    if (s === "processing") {
      return (
        <span style={{ color: colors.blue, fontSize: 11 }}>
          {stepsDone}/{STEPS.length}
        </span>
      );
    }
    return <span style={{ color: colors.textDim, fontSize: 11 }}>{idx + 1}</span>;
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        gap: 16,
        alignItems: "start",
        // Break out of the 860px column so the ERP renders as a wide
        // landscape rectangle, not a square.
        width: "min(1280px, 94vw)",
        position: "relative",
        left: "50%",
        transform: "translateX(-50%)",
      }}
    >
      {/* Left panel: patient list + controls */}
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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Patients to Schedule</span>
          {!loading && !loadError && (
            <span
              style={{
                fontSize: 10,
                padding: "1px 7px",
                borderRadius: 999,
                background: "rgba(121,184,255,0.1)",
                border: "1px solid rgba(121,184,255,0.25)",
                color: colors.blue,
              }}
            >
              {patients.length} patients
            </span>
          )}
        </div>

        {/* Task input + CSV upload */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Type your task…"
            disabled={running}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "8px 10px",
              borderRadius: 6,
              border: `1px solid ${colors.border}`,
              background: "#080a0d",
              color: colors.text,
              fontSize: 12,
              outline: "none",
            }}
          />
          <label
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              padding: "8px 10px",
              borderRadius: 6,
              border: `1px dashed ${colors.border}`,
              background: "rgba(121,184,255,0.04)",
              color: colors.blue,
              fontSize: 11,
              fontWeight: 600,
              cursor: running ? "not-allowed" : "pointer",
            }}
          >
            <span style={{ fontSize: 13 }}>⬆</span>
            Upload patient CSV
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleUpload}
              disabled={running}
              style={{ display: "none" }}
            />
          </label>
          <div
            style={{
              fontSize: 10,
              color: colors.textDim,
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            📄 {csvName}
          </div>
        </div>

        {/* Patient list */}
        {loading && (
          <div style={{ fontSize: 12, color: colors.textDim, textAlign: "center", padding: "12px 0" }}>
            Loading patients…
          </div>
        )}
        {loadError && (
          <div style={{ fontSize: 12, color: colors.red }}>
            Failed to load CSV: {loadError}
          </div>
        )}
        {!loading && !loadError && (
          <ol
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 5,
              maxHeight: 340,
              overflowY: "auto",
            }}
          >
            {patients.map((p, i) => {
              const isActive = i === currentPatientIdx && running;
              return (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 8px",
                    borderRadius: 6,
                    background: isActive
                      ? "rgba(121,184,255,0.08)"
                      : p.status === "done"
                      ? "rgba(101,209,149,0.06)"
                      : "transparent",
                    border: `1px solid ${
                      isActive
                        ? "rgba(121,184,255,0.25)"
                        : p.status === "done"
                        ? "rgba(101,209,149,0.2)"
                        : "transparent"
                    }`,
                    transition: "all 0.3s",
                  }}
                >
                  {/* Status badge */}
                  <span
                    style={{
                      flexShrink: 0,
                      width: 26,
                      height: 22,
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      background:
                        p.status === "done"
                          ? "rgba(101,209,149,0.15)"
                          : isActive
                          ? "rgba(121,184,255,0.15)"
                          : "rgba(255,255,255,0.04)",
                      border: `1px solid ${
                        p.status === "done"
                          ? colors.green
                          : isActive
                          ? colors.blue
                          : colors.border
                      }`,
                    }}
                  >
                    {statusIcon(p.status, p.stepsDone, i)}
                  </span>

                  {/* Name + date */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: isActive ? 700 : 500,
                        color:
                          p.status === "done"
                            ? colors.green
                            : isActive
                            ? colors.text
                            : colors.muted,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        transition: "color 0.3s",
                      }}
                    >
                      {p.first_name} {p.last_name}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: colors.textDim,
                        marginTop: 1,
                      }}
                    >
                      {p.schedule_datetime}
                    </div>
                  </div>

                  {/* Processing indicator */}
                  {isActive && (
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: 13,
                        color: colors.blue,
                        animation: "spin 0.9s linear infinite",
                        flexShrink: 0,
                      }}
                    >
                      ⟳
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        {/* Active step label */}
        {running && currentStepLabel && (
          <div
            style={{
              fontSize: 11,
              color: colors.blue,
              background: "rgba(121,184,255,0.07)",
              border: "1px solid rgba(121,184,255,0.2)",
              borderRadius: 6,
              padding: "5px 8px",
              lineHeight: 1.4,
            }}
          >
            <span style={{ fontWeight: 700 }}>Running:</span> {currentStepLabel}
          </div>
        )}

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${colors.border}` }} />

        {/* Controls */}
        {done ? (
          <div
            style={{
              padding: "14px 10px",
              borderRadius: 8,
              background: "rgba(101,209,149,0.08)",
              border: "1px solid rgba(101,209,149,0.25)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 6 }}>✓</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: colors.green, lineHeight: 1.4 }}>
              All {patients.length} patients registered &amp; vaccine appointments booked
            </div>
            <div style={{ fontSize: 11, color: colors.muted, marginTop: 4, lineHeight: 1.4 }}>
              Hands-free. No clicks required.
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
              onClick={runAll}
              disabled={running || loading || !!loadError}
              style={{
                padding: "11px 0",
                borderRadius: 8,
                border: "none",
                cursor: running || loading || !!loadError ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                background:
                  running || loading || !!loadError
                    ? "#2a3040"
                    : "linear-gradient(135deg, #3b6ea3 0%, #2a5078 100%)",
                boxShadow:
                  running || loading || !!loadError
                    ? "none"
                    : "0 2px 16px rgba(59,110,163,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s",
              }}
            >
              {running ? (
                <>
                  <span style={{ display: "inline-block", animation: "spin 0.9s linear infinite" }}>
                    ⟳
                  </span>
                  Processing patients…
                </>
              ) : (
                <>▶ Run skill for all {patients.length} patients</>
              )}
            </button>

            {running && (
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
                ■ Stop
              </button>
            )}

            {!running && (
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: colors.textDim,
                  textAlign: "center",
                  lineHeight: 1.5,
                }}
              >
                Automatically processes all {patients.length} patients through the ERP — no clicks needed.
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
        {/* Current patient badge */}
        {running && currentPatientIdx >= 0 && (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 10,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.4,
              color: colors.blue,
              background: "rgba(12,15,20,0.85)",
              border: "1px solid rgba(121,184,255,0.3)",
              padding: "3px 10px",
              borderRadius: 4,
              zIndex: 10,
              pointerEvents: "none",
              animation: "fadeIn 0.3s ease",
            }}
          >
            Patient {currentPatientIdx + 1}/{patients.length} — {patients[currentPatientIdx]?.first_name} {patients[currentPatientIdx]?.last_name}
          </div>
        )}
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
            <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>
              ⟳
            </span>
            Loading ERP…
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
