"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SUGGESTED_TAGS, dedupeTags, normalizeTag } from "@/lib/tags";

export default function TagsEditor({
  sessionId,
  initialTags,
  autoSuggestions,
}: {
  sessionId: string;
  initialTags: string[];
  autoSuggestions: string[];
}) {
  const router = useRouter();
  const [tags, setTags] = useState<string[]>(() => dedupeTags(initialTags));
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const lowerSet = useMemo(
    () => new Set(tags.map((t) => t.toLowerCase())),
    [tags],
  );

  const autoChips = useMemo(
    () =>
      dedupeTags(autoSuggestions).filter(
        (t) => !lowerSet.has(t.toLowerCase()),
      ),
    [autoSuggestions, lowerSet],
  );

  const deptChips = useMemo(
    () =>
      SUGGESTED_TAGS.filter((t) => !lowerSet.has(t.toLowerCase())),
    [lowerSet],
  );

  async function persist(next: string[]) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/tags`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tags: next }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
      const body = (await res.json()) as { tags: string[] };
      setTags(dedupeTags(body.tags ?? next));
      setSavedAt(Date.now());
      router.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  function addTag(raw: string) {
    const n = normalizeTag(raw);
    if (!n) return;
    if (lowerSet.has(n.toLowerCase())) return;
    void persist([...tags, n]);
  }

  function removeTag(t: string) {
    void persist(tags.filter((x) => x.toLowerCase() !== t.toLowerCase()));
  }

  function submitDraft() {
    const n = normalizeTag(draft);
    if (!n) return;
    setDraft("");
    addTag(n);
  }

  return (
    <section style={card}>
      <div style={headRow}>
        <h2 style={h2}>Tags</h2>
        <div style={metaRow}>
          {busy && <span style={meta}>saving…</span>}
          {!busy && savedAt && <span style={meta}>saved</span>}
        </div>
      </div>

      <p style={hint}>
        Tag this workflow by the team or department that owns it. Used to
        filter the workflow library.
      </p>

      <div style={chipRow}>
        {tags.length === 0 && (
          <span style={emptyChip}>No tags yet — pick a suggestion below.</span>
        )}
        {tags.map((t) => (
          <span key={t} style={activeChip}>
            {t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              disabled={busy}
              style={chipRemove}
              aria-label={`Remove tag ${t}`}
              title="Remove"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitDraft();
        }}
        style={{ display: "flex", gap: 6, marginTop: 12 }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a custom tag…"
          style={input}
          disabled={busy}
          maxLength={40}
        />
        <button
          type="submit"
          disabled={busy || normalizeTag(draft).length === 0}
          style={addBtn(busy || normalizeTag(draft).length === 0)}
        >
          Add
        </button>
      </form>

      {autoChips.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={label}>Suggested from this workflow</div>
          <div style={chipRow}>
            {autoChips.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => addTag(t)}
                disabled={busy}
                style={pickChip(busy, true)}
                title="Add suggested tag"
              >
                + {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <div style={label}>Departments</div>
        <div style={chipRow}>
          {deptChips.length === 0 ? (
            <span style={emptyChip}>All department tags added.</span>
          ) : (
            deptChips.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => addTag(t)}
                disabled={busy}
                style={pickChip(busy, false)}
              >
                + {t}
              </button>
            ))
          )}
        </div>
      </div>

      {error && <div style={errBox}>{error}</div>}
    </section>
  );
}

const card: React.CSSProperties = {
  border: "1px solid var(--border-default)",
  borderRadius: 8,
  padding: "1.25rem 1.5rem",
  marginBottom: "2rem",
  background: "var(--bg-card)",
};

const headRow: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 4,
};

const h2: React.CSSProperties = { margin: 0, fontSize: 18 };

const metaRow: React.CSSProperties = { display: "flex", gap: 12 };

const meta: React.CSSProperties = { fontSize: 12, opacity: 0.55 };

const hint: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 13,
  opacity: 0.65,
};

const label: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  opacity: 0.6,
  marginBottom: 6,
};

const chipRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  alignItems: "center",
};

const activeChip: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "3px 4px 3px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 500,
  background: "var(--bg-pill-blue)",
  color: "var(--fg-pill-blue)",
  border: "1px solid var(--border-blue-strong)",
};

const chipRemove: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "inherit",
  cursor: "pointer",
  fontSize: 14,
  lineHeight: 1,
  padding: "0 6px",
  opacity: 0.7,
};

const emptyChip: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.45,
  fontStyle: "italic",
};

function pickChip(disabled: boolean, accent: boolean): React.CSSProperties {
  return {
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    background: accent ? "var(--bg-pill-green)" : "var(--bg-button-secondary)",
    color: accent ? "var(--fg-pill-green)" : "var(--text-secondary-chip)",
    border: accent
      ? "1px solid var(--border-button-primary-chip)"
      : "1px dashed var(--border-input)",
    opacity: disabled ? 0.6 : 1,
  };
}

const input: React.CSSProperties = {
  flex: 1,
  boxSizing: "border-box",
  background: "var(--bg-input)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-input)",
  borderRadius: 6,
  padding: "6px 10px",
  fontSize: 13,
  fontFamily: "inherit",
};

function addBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: "6px 14px",
    borderRadius: 6,
    border: "1px solid var(--border-input)",
    background: disabled ? "var(--bg-button-disabled)" : "var(--bg-button-primary)",
    color: disabled ? "var(--text-disabled)" : "var(--fg-button-primary)",
    fontSize: 13,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

const errBox: React.CSSProperties = {
  marginTop: 12,
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid var(--border-error-box)",
  background: "var(--bg-error-box)",
  color: "var(--fg-error-text)",
  fontSize: 13,
};
