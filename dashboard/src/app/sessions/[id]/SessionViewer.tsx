"use client";

import { useEffect, useState } from "react";

type Screenshot = { name: string; url: string };
type Transcript = { name: string; text: string };

export default function SessionViewer({
  screenshots,
  transcripts,
}: {
  screenshots: Screenshot[];
  transcripts: Transcript[];
}) {
  return (
    <div style={{ display: "grid", gap: "2rem" }}>
      <ScreenshotPanel screenshots={screenshots} />
      <TranscriptPanel transcripts={transcripts} />
    </div>
  );
}

function ScreenshotPanel({ screenshots }: { screenshots: Screenshot[] }) {
  const [idx, setIdx] = useState(0);
  const total = screenshots.length;

  useEffect(() => {
    if (idx > total - 1) setIdx(Math.max(0, total - 1));
  }, [idx, total]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (total === 0) return;
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIdx((i) => Math.min(total - 1, i + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  return (
    <section
      style={{
        border: "1px solid #1f242b",
        borderRadius: 8,
        padding: "1.25rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>
          Screenshots{" "}
          <span style={{ opacity: 0.5, fontWeight: 400 }}>({total})</span>
        </h2>
        {total > 0 && (
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            {idx + 1} / {total}
          </div>
        )}
      </div>

      {total === 0 ? (
        <p style={{ opacity: 0.55, margin: 0 }}>
          No screenshots uploaded for this session.
        </p>
      ) : (
        <>
          <div
            style={{
              background: "#000",
              borderRadius: 6,
              overflow: "hidden",
              minHeight: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={screenshots[idx].url}
              src={screenshots[idx].url}
              alt={screenshots[idx].name}
              style={{
                maxWidth: "100%",
                maxHeight: "70vh",
                display: "block",
              }}
            />
          </div>

          <div
            style={{
              marginTop: "0.75rem",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
              fontSize: 12,
              opacity: 0.6,
            }}
          >
            {screenshots[idx].name}
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "center",
              marginTop: "0.75rem",
            }}
          >
            <button
              type="button"
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={idx === 0}
              style={buttonStyle(idx === 0)}
            >
              ← Prev
            </button>
            <input
              type="range"
              min={0}
              max={Math.max(0, total - 1)}
              value={idx}
              onChange={(e) => setIdx(Number(e.target.value))}
              style={{ flex: 1, accentColor: "#79b8ff" }}
            />
            <button
              type="button"
              onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
              disabled={idx >= total - 1}
              style={buttonStyle(idx >= total - 1)}
            >
              Next →
            </button>
          </div>
          <div
            style={{
              marginTop: "0.5rem",
              fontSize: 11,
              opacity: 0.5,
            }}
          >
            Tip: use ← → arrow keys to scrub.
          </div>
        </>
      )}
    </section>
  );
}

function TranscriptPanel({ transcripts }: { transcripts: Transcript[] }) {
  const nonEmpty = transcripts.filter((t) => t.text.trim().length > 0);
  return (
    <section
      style={{
        border: "1px solid #1f242b",
        borderRadius: 8,
        padding: "1.25rem",
      }}
    >
      <h2 style={{ margin: 0, fontSize: 18, marginBottom: "1rem" }}>
        Transcripts{" "}
        <span style={{ opacity: 0.5, fontWeight: 400 }}>
          ({transcripts.length}
          {nonEmpty.length !== transcripts.length
            ? `, ${nonEmpty.length} with text`
            : ""}
          )
        </span>
      </h2>
      {transcripts.length === 0 ? (
        <p style={{ opacity: 0.55, margin: 0 }}>
          No transcript chunks uploaded for this session.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {transcripts.map((t) => (
            <div
              key={t.name}
              style={{
                border: "1px solid #1f242b",
                borderRadius: 6,
                padding: "0.85rem 1rem",
                background: "#0f1216",
              }}
            >
              <div
                style={{
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
                  fontSize: 12,
                  opacity: 0.6,
                  marginBottom: "0.5rem",
                }}
              >
                {t.name}
              </div>
              {t.text.trim().length === 0 ? (
                <div style={{ opacity: 0.45, fontStyle: "italic" }}>
                  (empty)
                </div>
              ) : (
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontFamily: "inherit",
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  {t.text}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function buttonStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: "6px 12px",
    borderRadius: 6,
    border: "1px solid #2a3038",
    background: disabled ? "#161a20" : "#1c2128",
    color: disabled ? "#555" : "#e8e8e8",
    fontSize: 13,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}
