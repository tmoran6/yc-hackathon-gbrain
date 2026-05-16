"use client";

import { useEffect, useRef, useState } from "react";

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

// How many frames ahead to keep warm in the browser cache while playing/scrubbing.
const PREFETCH_AHEAD = 8;
// Playback rate when Play is active (frames per second).
const PLAYBACK_FPS = 2;

function ScreenshotPanel({ screenshots }: { screenshots: Screenshot[] }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const total = screenshots.length;
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgHeight, setImgHeight] = useState(0);
  // Track frames whose <link rel=preload> we've already injected so we don't
  // spam the DOM with duplicates on every idx change.
  const prefetchedRef = useRef<Set<number>>(new Set());

  function captureHeight() {
    const h = imgRef.current?.getBoundingClientRect().height ?? 0;
    if (h > 0) setImgHeight(h);
  }

  // Pre-fetch the next N frames whenever the current index moves. Using
  // <link rel=preload as=image> lets the browser cache the bytes so when the
  // <img src> flips, it shows instantly.
  useEffect(() => {
    if (total === 0) return;
    const upper = Math.min(total - 1, idx + PREFETCH_AHEAD);
    const added: HTMLLinkElement[] = [];
    for (let i = idx; i <= upper; i++) {
      if (prefetchedRef.current.has(i)) continue;
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = screenshots[i].url;
      document.head.appendChild(link);
      prefetchedRef.current.add(i);
      added.push(link);
    }
    return () => {
      // Leave the prefetch hints in place — once injected they've already
      // served their purpose. (Browsers don't re-fetch on element removal.)
    };
  }, [idx, total, screenshots]);

  // Clamp out-of-range indices when the screenshot list shrinks.
  useEffect(() => {
    if (idx > total - 1) setIdx(Math.max(0, total - 1));
  }, [idx, total]);

  // Auto-stop at the end of the reel.
  useEffect(() => {
    if (playing && idx >= total - 1) setPlaying(false);
  }, [playing, idx, total]);

  // Drive the playhead forward while playing.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setIdx((i) => (i >= total - 1 ? i : i + 1));
    }, 1000 / PLAYBACK_FPS);
    return () => window.clearInterval(id);
  }, [playing, total]);

  // Keyboard: Space toggles play, arrows step (and pause if you scrub).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (total === 0) return;
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.key === "ArrowLeft") {
        setPlaying(false);
        setIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowRight") {
        setPlaying(false);
        setIdx((i) => Math.min(total - 1, i + 1));
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  const atEnd = idx >= total - 1;

  return (
    <section
      style={{
        border: "1px solid var(--border-default)",
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
              background: "var(--bg-image)",
              borderRadius: 6,
              overflow: "hidden",
              minHeight: imgHeight || 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={screenshots[idx].url}
              alt={screenshots[idx].name}
              onLoad={captureHeight}
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
              onClick={() => {
                setPlaying(false);
                setIdx((i) => Math.max(0, i - 1));
              }}
              disabled={idx === 0}
              style={buttonStyle(idx === 0)}
              title="Previous frame"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => {
                if (atEnd) setIdx(0);
                setPlaying((p) => !p);
              }}
              disabled={total <= 1}
              style={playButtonStyle(total <= 1, playing)}
              title={playing ? "Pause" : "Play"}
            >
              {playing ? "❚❚ Pause" : atEnd ? "↻ Replay" : "▶ Play"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setIdx((i) => Math.min(total - 1, i + 1));
              }}
              disabled={idx >= total - 1}
              style={buttonStyle(idx >= total - 1)}
              title="Next frame"
            >
              →
            </button>
            <input
              type="range"
              min={0}
              max={Math.max(0, total - 1)}
              value={idx}
              onChange={(e) => {
                setPlaying(false);
                setIdx(Number(e.target.value));
              }}
              style={{ flex: 1, accentColor: "var(--accent-slider)" }}
            />
          </div>
          <div
            style={{
              marginTop: "0.5rem",
              fontSize: 11,
              opacity: 0.5,
            }}
          >
            Space = play/pause · ← → step frame · {PLAYBACK_FPS} fps · pre-fetching {PREFETCH_AHEAD} ahead
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
        border: "1px solid var(--border-default)",
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
                border: "1px solid var(--border-default)",
                borderRadius: 6,
                padding: "0.85rem 1rem",
                background: "var(--bg-transcript)",
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
    border: "1px solid var(--border-input)",
    background: disabled ? "var(--bg-button-disabled)" : "var(--bg-button-secondary)",
    color: disabled ? "var(--text-disabled)" : "var(--text-primary)",
    fontSize: 13,
    cursor: disabled ? "not-allowed" : "pointer",
    minWidth: 40,
  };
}

function playButtonStyle(disabled: boolean, playing: boolean): React.CSSProperties {
  return {
    padding: "6px 16px",
    borderRadius: 6,
    border: "1px solid var(--border-button-primary)",
    background: disabled
      ? "var(--bg-button-disabled)"
      : playing
        ? "var(--bg-pill-orange-alt)"
        : "var(--bg-button-primary)",
    color: disabled
      ? "var(--text-disabled)"
      : playing
        ? "var(--fg-pill-orange-alt)"
        : "var(--fg-button-primary)",
    fontSize: 13,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    minWidth: 100,
  };
}
