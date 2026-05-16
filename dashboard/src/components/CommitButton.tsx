"use client";

import { useState } from "react";

const BRAIN_API_BASE = "/api/brain";

type State = "idle" | "loading" | "success" | "error";

const colors = {
  green: "#65d195",
  greenDim: "#1b3a2b",
  blue: "#79b8ff",
  blueDim: "#3b6ea3",
  red: "#f07070",
  muted: "#9aa4ad",
  text: "#e8e8e8",
  textDim: "#6b7580",
  border: "#1f242b",
};

export function CommitButton({ slug, skillPage }: { slug: string; skillPage: string }) {
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleCommit() {
    if (state !== "idle") return;
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`${BRAIN_API_BASE}/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, skillPage }),
      });
      const data = await res.json();
      if (data.ok) {
        setState("success");
      } else {
        setErrorMsg(data.error ?? "Unknown error");
        setState("error");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "18px 24px",
          background: colors.greenDim,
          border: `1px solid rgba(101, 209, 149, 0.25)`,
          borderRadius: 12,
          boxShadow: "0 0 32px rgba(101, 209, 149, 0.07)",
          animation: "fadeIn 0.4s ease",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(101, 209, 149, 0.15)",
            border: `1.5px solid ${colors.green}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          &#10003;
        </div>
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: colors.green,
              marginBottom: 2,
            }}
          >
            Skill committed to the Brain
          </div>
          <div style={{ fontSize: 13, color: colors.muted }}>
            Anyone can now ask{" "}
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                color: colors.blue,
                background: "#13233a",
                padding: "1px 6px",
                borderRadius: 4,
              }}
            >
              {slug}
            </span>{" "}
            questions and get answers from this workflow.
          </div>
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform: translateY(4px); } to { opacity:1; transform: none; } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <button
        onClick={handleCommit}
        disabled={state === "loading"}
        style={{
          width: "100%",
          padding: "14px 24px",
          borderRadius: 10,
          border: "none",
          cursor: state === "loading" ? "not-allowed" : "pointer",
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: 0.3,
          color: state === "loading" ? colors.muted : "#fff",
          background:
            state === "loading"
              ? "#1a2030"
              : "linear-gradient(135deg, #3b6ea3 0%, #2a5078 50%, #1d3a5c 100%)",
          boxShadow:
            state === "loading"
              ? "none"
              : "0 2px 16px rgba(59, 110, 163, 0.35)",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {state === "loading" ? (
          <>
            <Spinner />
            Committing to Brain&hellip;
          </>
        ) : (
          <>
            <span style={{ fontSize: 18, lineHeight: 1 }}>&#8659;</span>
            Commit to Brain
          </>
        )}
      </button>

      {state === "error" && (
        <div
          style={{
            padding: "10px 14px",
            background: "#3a1b1b",
            border: "1px solid rgba(240,112,112,0.2)",
            borderRadius: 8,
            color: colors.red,
            fontSize: 13,
          }}
        >
          {errorMsg}
        </div>
      )}

      <p
        style={{
          margin: 0,
          fontSize: 12,
          color: colors.textDim,
          textAlign: "center",
        }}
      >
        Embeds the skill into GBrain so staff can query it instantly
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <>
      <span
        style={{
          display: "inline-block",
          width: 16,
          height: 16,
          border: `2px solid rgba(255,255,255,0.2)`,
          borderTopColor: "#fff",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
          flexShrink: 0,
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
