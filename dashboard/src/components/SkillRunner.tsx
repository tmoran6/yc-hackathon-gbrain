"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { analyzerOutput } from "@/fixtures/analyzer-output";

const STEPS: string[] = analyzerOutput.workflow.procedure; // 19 steps

const colors = {
  text: "#e8e8e8",
  muted: "#9aa4ad",
  textDim: "#6b7580",
  blue: "#79b8ff",
  blueDim: "#3b6ea3",
  green: "#65d195",
  amber: "#f0b050",
  red: "#ff7b7b",
  border: "#1f242b",
  borderAccent: "#1d3a5c",
  surface: "#11151a",
  surfaceAlt: "#0f1318",
  bg: "#0c0f14",
  inputBg: "#080a0d",
};

const ERP_ORIGIN = "http://localhost:5002";

const SUGGESTED_PROMPT =
  "Schedule everyone in patients-to-schedule.csv for their vaccine appointments.";

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

// ---- Chat message types ----
type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  streaming?: boolean;
}

// ---- Simple CSV parser ----
function parseCsv(text: string): Patient[] {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = vals[i] ?? "";
    });
    return obj as unknown as Patient;
  });
}

// ---- Step delay between each step in batch mode (ms) ----
const STEP_DELAY_MS = 700;
// Delay between patients (ms)
const PATIENT_DELAY_MS = 1200;

let msgCounter = 0;
function newId() {
  return `msg-${++msgCounter}`;
}

export function SkillRunner() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);

  // Patient list state (kept in background, not shown in left panel)
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const patientsRef = useRef<PatientRow[]>([]);
  // Keep ref in sync so runAll callbacks can read latest
  useEffect(() => {
    patientsRef.current = patients;
  }, [patients]);

  // Batch runner state
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [currentPatientIdx, setCurrentPatientIdx] = useState(-1);

  // Refs for communicating with the iframe mid-run
  const stepAckRef = useRef<((step: number) => void) | null>(null);
  const resetAckRef = useRef<(() => void) | null>(null);
  const abortRef = useRef(false);

  // ---- Chat state ----
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  // ---- Chat helpers ----
  function appendMsg(msg: ChatMessage) {
    setMessages((prev) => [...prev, msg]);
    return msg.id;
  }

  function updateMsg(id: string, patch: Partial<ChatMessage>) {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
  }

  // ---- Main run orchestration (chat-driven) ----
  async function runAllWithChat(patientList: PatientRow[]) {
    if (running) return;
    abortRef.current = false;
    setRunning(true);

    const total = patientList.length;

    // Assistant: narrating start
    const startId = newId();
    appendMsg({
      id: startId,
      role: "assistant",
      text: `Found ${total} patients. Running the captured skill — Register New Patient and Book Vaccine Appointment — for each.`,
    });

    // Set patients into state
    setPatients(patientList);

    for (let pi = 0; pi < patientList.length; pi++) {
      if (abortRef.current) break;

      const patient = patientList[pi];
      const fullName = `${patient.first_name} ${patient.last_name}`;

      // Reset ERP between patients
      await resetErp();
      await sleep(400);

      setCurrentPatientIdx(pi);
      setPatients((prev) =>
        prev.map((row, i) =>
          i === pi ? { ...row, status: "processing", stepsDone: 0 } : row
        )
      );

      // Post a "registering" message for this patient
      const patientMsgId = newId();
      appendMsg({
        id: patientMsgId,
        role: "assistant",
        text: `▸ Registering ${fullName}…`,
        streaming: true,
      });

      // Run all steps
      let stepLabel = "";
      let patientError = false;
      for (let step = 0; step < STEPS.length; step++) {
        if (abortRef.current) break;
        stepLabel = STEPS[step];
        setPatients((prev) =>
          prev.map((row, i) =>
            i === pi ? { ...row, stepsDone: step } : row
          )
        );
        // Update the patient bubble with current step
        updateMsg(patientMsgId, {
          text: `▸ Registering ${fullName}…  (${stepLabel})`,
          streaming: true,
        });
        try {
          await runStep(step, patient);
        } catch {
          patientError = true;
          setPatients((prev) =>
            prev.map((row, i) =>
              i === pi ? { ...row, status: "error" } : row
            )
          );
          break;
        }
        await sleep(STEP_DELAY_MS);
      }

      if (!abortRef.current && !patientError) {
        setPatients((prev) =>
          prev.map((row, i) =>
            i === pi
              ? { ...row, status: "done", stepsDone: STEPS.length }
              : row
          )
        );
        updateMsg(patientMsgId, {
          text: `✓ ${fullName} — registered & vaccine booked for ${patient.schedule_datetime}`,
          streaming: false,
        });
      } else if (patientError) {
        updateMsg(patientMsgId, {
          text: `✗ ${fullName} — error during: ${stepLabel}`,
          streaming: false,
        });
      }

      if (pi < patientList.length - 1) {
        await sleep(PATIENT_DELAY_MS);
      }
    }

    setRunning(false);
    if (!abortRef.current) {
      setDone(true);
      setCurrentPatientIdx(-1);
      appendMsg({
        id: newId(),
        role: "assistant",
        text: `✓ Done — all ${total} patients registered and scheduled, hands-free.`,
      });
    }
  }

  // ---- Handle chat send ----
  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || chatBusy) return;
    setChatBusy(true);
    setInput("");

    // User bubble
    appendMsg({ id: newId(), role: "user", text: trimmed });

    // Detect the scheduling intent
    const isScheduleIntent =
      trimmed.toLowerCase().includes("schedule") ||
      trimmed.toLowerCase().includes("patient") ||
      trimmed.toLowerCase().includes("vaccine") ||
      trimmed.toLowerCase().includes("appointment") ||
      trimmed.toLowerCase().includes("csv");

    if (!isScheduleIntent) {
      appendMsg({
        id: newId(),
        role: "assistant",
        text: "I can schedule patients from a CSV file. Try: \"Schedule everyone in patients-to-schedule.csv for their vaccine appointments.\"",
      });
      setChatBusy(false);
      return;
    }

    // Step 1: narrate loading
    const loadMsgId = newId();
    appendMsg({
      id: loadMsgId,
      role: "assistant",
      text: "Loading patients-to-schedule.csv…",
      streaming: true,
    });

    let patientList: PatientRow[];
    try {
      const res = await fetch("/patients-to-schedule.csv");
      const text2 = await res.text();
      const parsed = parseCsv(text2);
      patientList = parsed.map((p) => ({
        ...p,
        status: "pending" as PatientStatus,
        stepsDone: 0,
      }));
    } catch (err) {
      updateMsg(loadMsgId, {
        text: `Failed to load CSV: ${String(err)}`,
        streaming: false,
      });
      setChatBusy(false);
      return;
    }

    updateMsg(loadMsgId, {
      text: `Loaded patients-to-schedule.csv — ${patientList.length} patients found.`,
      streaming: false,
    });

    setChatBusy(false);
    await runAllWithChat(patientList);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      try {
        const parsed = parseCsv(text);
        const patientList = parsed.map((p) => ({
          ...p,
          status: "pending" as PatientStatus,
          stepsDone: 0,
        }));
        setPatients(patientList);
        setDone(false);
        appendMsg({
          id: newId(),
          role: "assistant",
          text: `Loaded ${file.name} — ${patientList.length} patients. Send a message to run the skill.`,
        });
      } catch (err) {
        appendMsg({
          id: newId(),
          role: "assistant",
          text: `Failed to parse ${file.name}: ${String(err)}`,
        });
      }
    });
    e.target.value = "";
  }

  function handleReset() {
    abortRef.current = true;
    setRunning(false);
    setDone(false);
    setCurrentPatientIdx(-1);
    setPatients((prev) =>
      prev.map((p) => ({ ...p, status: "pending", stepsDone: 0 }))
    );
    postToErp({ type: "gbrain-reset" });
    setMessages([]);
    setChatBusy(false);
  }

  const showSuggested = messages.length === 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        gap: 16,
        alignItems: "start",
        width: "min(1280px, 94vw)",
        position: "relative",
        left: "50%",
        transform: "translateX(-50%)",
      }}
    >
      {/* Left panel: Chat */}
      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.borderAccent}`,
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          height: 558,
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        }}
      >
        {/* Chat header */}
        <div
          style={{
            padding: "12px 14px",
            borderBottom: `1px solid ${colors.border}`,
            background: "rgba(101,209,149,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #1b3a2b 0%, #0f2a1e 100%)",
                border: `1px solid ${colors.green}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: colors.green,
                flexShrink: 0,
              }}
            >
              G
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: colors.text,
                  lineHeight: 1.2,
                }}
              >
                Skill Agent
              </div>
              <div style={{ fontSize: 10, color: colors.green }}>
                {running ? "Running…" : done ? "Complete" : "Ready"}
              </div>
            </div>
          </div>
          {(running || done) && (
            <button
              onClick={handleReset}
              style={{
                padding: "4px 10px",
                borderRadius: 5,
                border: `1px solid ${colors.border}`,
                background: "transparent",
                color: colors.muted,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              ⟲ Reset
            </button>
          )}
        </div>

        {/* Messages area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* Suggested prompt chip (shown only when no messages) */}
          {showSuggested && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                padding: "20px 0 8px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: colors.muted,
                  textAlign: "center",
                  lineHeight: 1.5,
                }}
              >
                Run the captured skill for a batch of patients:
              </p>
              <button
                onClick={() => handleSend(SUGGESTED_PROMPT)}
                disabled={chatBusy}
                style={{
                  background: "transparent",
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  padding: "9px 13px",
                  color: colors.blue,
                  fontSize: 12,
                  textAlign: "left",
                  cursor: chatBusy ? "not-allowed" : "pointer",
                  lineHeight: 1.45,
                  width: "100%",
                  transition: "border-color 0.15s, background 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    colors.blueDim;
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#13233a";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    colors.border;
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                }}
              >
                {SUGGESTED_PROMPT}
              </button>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                flexDirection: m.role === "user" ? "row-reverse" : "row",
                gap: 7,
                alignItems: "flex-start",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  background:
                    m.role === "user"
                      ? "linear-gradient(135deg, #13233a 0%, #0d1a2e 100%)"
                      : "linear-gradient(135deg, #1b3a2b 0%, #0f2a1e 100%)",
                  border: `1px solid ${
                    m.role === "user" ? colors.blueDim : colors.green
                  }`,
                  color:
                    m.role === "user" ? colors.blue : colors.green,
                  marginTop: 2,
                }}
              >
                {m.role === "user" ? "U" : "G"}
              </div>

              {/* Bubble */}
              <div
                style={{
                  maxWidth: "84%",
                  padding: "8px 11px",
                  borderRadius:
                    m.role === "user"
                      ? "11px 4px 11px 11px"
                      : "4px 11px 11px 11px",
                  background:
                    m.role === "user" ? "#13233a" : colors.surfaceAlt,
                  border: `1px solid ${
                    m.role === "user" ? colors.borderAccent : colors.border
                  }`,
                  fontSize: 12,
                  lineHeight: 1.55,
                  color:
                    m.text.startsWith("✓")
                      ? colors.green
                      : m.text.startsWith("✗")
                      ? colors.red
                      : m.text.startsWith("▸")
                      ? colors.blue
                      : colors.text,
                }}
              >
                {m.text || (
                  m.streaming ? (
                    <span style={{ color: colors.textDim, fontStyle: "italic" }}>
                      …
                    </span>
                  ) : null
                )}
                {m.streaming && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 7,
                      height: 12,
                      background: colors.green,
                      marginLeft: 3,
                      verticalAlign: "middle",
                      borderRadius: 1,
                      animation: "blink 0.8s step-start infinite",
                    }}
                  />
                )}
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div
          style={{
            borderTop: `1px solid ${colors.border}`,
            padding: "10px 10px",
            display: "flex",
            gap: 6,
            alignItems: "center",
            background: colors.inputBg,
            flexShrink: 0,
          }}
        >
          {/* Attach (CSV upload) button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={running}
            title="Upload patient CSV"
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              border: `1px solid ${colors.border}`,
              background: "transparent",
              color: running ? colors.textDim : colors.muted,
              fontSize: 16,
              cursor: running ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            📎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleUpload}
            disabled={running}
            style={{ display: "none" }}
          />

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message…"
            disabled={chatBusy || running}
            style={{
              flex: 1,
              background: "transparent",
              border: `1px solid ${colors.border}`,
              borderRadius: 7,
              padding: "7px 10px",
              color: colors.text,
              fontSize: 12,
              outline: "none",
              fontFamily: "inherit",
              lineHeight: 1.4,
              height: 32,
              boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.blueDim;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = colors.border;
            }}
          />

          {/* Send button */}
          <button
            onClick={() => handleSend(input)}
            disabled={chatBusy || running || !input.trim()}
            style={{
              background:
                chatBusy || running || !input.trim()
                  ? "#1a2030"
                  : "linear-gradient(135deg, #3b6ea3 0%, #2a5078 100%)",
              border: "none",
              borderRadius: 7,
              padding: "0 12px",
              height: 32,
              color:
                chatBusy || running || !input.trim()
                  ? colors.textDim
                  : colors.text,
              fontSize: 12,
              fontWeight: 600,
              cursor:
                chatBusy || running || !input.trim()
                  ? "not-allowed"
                  : "pointer",
              flexShrink: 0,
              transition: "background 0.2s, color 0.2s",
            }}
          >
            {chatBusy ? "…" : "Send"}
          </button>
        </div>
      </div>

      {/* Right panel: ERP iframe — unchanged */}
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
            Patient {currentPatientIdx + 1}/{patients.length} —{" "}
            {patients[currentPatientIdx]?.first_name}{" "}
            {patients[currentPatientIdx]?.last_name}
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
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
