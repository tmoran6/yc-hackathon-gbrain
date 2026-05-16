import Link from "next/link";
import { pool } from "@/lib/db";
import { formatDuration, formatTimestamp } from "@/lib/format";

export const dynamic = "force-dynamic";

type SessionStatus = "active" | "ended";
type ReviewState = "user_review" | "confirmed" | "discarded";

type SessionRow = {
  id: string;
  username: string;
  status: SessionStatus;
  started_at: Date;
  ended_at: Date | null;
  workflow_title: string | null;
  review_state: ReviewState | null;
  tags: string[] | null;
};

type DisplayStatus =
  | "active"
  | "ended"
  | "needs review"
  | "completed"
  | "discarded";

function displayStatus(row: SessionRow): DisplayStatus {
  if (row.status === "active") return "active";
  if (row.review_state === "confirmed") return "completed";
  if (row.review_state === "discarded") return "discarded";
  if (row.review_state === "user_review") return "needs review";
  return "ended";
}

export default async function Home() {
  const { rows } = await pool.query<SessionRow>(
    `SELECT s.id, s.username, s.status, s.started_at, s.ended_at,
            a.result -> 'workflow' ->> 'title' AS workflow_title,
            a.review_state,
            s.tags
       FROM sessions s
       LEFT JOIN analysis a ON a.session_id = s.id
       ORDER BY s.started_at DESC
       LIMIT 200`,
  );

  return (
    <main style={{ maxWidth: 960, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ marginBottom: "0.25rem" }}>Recording sessions</h1>
        <Link
          href="/demo"
          style={{
            color: "var(--text-link)",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Skill capture demo →
        </Link>
      </div>
      <p style={{ opacity: 0.6, marginTop: 0 }}>
        {rows.length} session{rows.length === 1 ? "" : "s"}. Click a row to
        browse screenshots and transcripts.
      </p>

      {rows.length === 0 ? (
        <p style={{ opacity: 0.6, marginTop: "2rem" }}>
          No sessions yet. Start the recorder and hit Start Recording.
        </p>
      ) : (
        <div
          style={{
            marginTop: "1.5rem",
            border: "1px solid var(--border-default)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead style={{ background: "var(--bg-inner)", textAlign: "left" }}>
              <tr>
                <th style={th}>User</th>
                <th style={th}>Started</th>
                <th style={th}>Ended</th>
                <th style={th}>Duration</th>
                <th style={th}>Status</th>
                <th style={th}>Tags</th>
                <th style={th}>Analysis</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  style={{ borderTop: "1px solid var(--border-default)" }}
                >
                  <td style={td}>
                    <Link
                      href={`/sessions/${row.id}`}
                      style={{
                        color: "var(--text-link)",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      {row.username}
                    </Link>
                  </td>
                  <td style={td}>{formatTimestamp(row.started_at)}</td>
                  <td style={td}>{formatTimestamp(row.ended_at)}</td>
                  <td style={td}>
                    {formatDuration(row.started_at, row.ended_at)}
                  </td>
                  <td style={td}>
                    {(() => {
                      const ds = displayStatus(row);
                      return <span style={statusPill(ds)}>{ds}</span>;
                    })()}
                  </td>
                  <td style={td}>
                    {row.tags && row.tags.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 4,
                          maxWidth: 220,
                        }}
                      >
                        {row.tags.map((t) => (
                          <span key={t} style={tagPill}>
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ opacity: 0.35, fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td style={td}>
                    {row.workflow_title ? (
                      <Link
                        href={`/sessions/${row.id}`}
                        title={row.workflow_title}
                        style={analysisPill}
                      >
                        ✓ {truncate(row.workflow_title, 40)}
                      </Link>
                    ) : (
                      <span style={{ opacity: 0.4 }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const th: React.CSSProperties = {
  padding: "10px 14px",
  fontWeight: 600,
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  color: "var(--text-muted)",
};

const td: React.CSSProperties = {
  padding: "10px 14px",
  verticalAlign: "middle",
};

function statusPill(status: DisplayStatus): React.CSSProperties {
  const palette: Record<DisplayStatus, { bg: string; fg: string }> = {
    active: { bg: "var(--bg-pill-green)", fg: "var(--fg-pill-green)" },
    "needs review": { bg: "var(--bg-pill-orange)", fg: "var(--fg-pill-orange)" },
    completed: { bg: "var(--bg-pill-blue)", fg: "var(--fg-pill-blue)" },
    discarded: { bg: "var(--bg-pill-red)", fg: "var(--fg-pill-red)" },
    ended: { bg: "var(--bg-pill-gray)", fg: "var(--fg-pill-gray)" },
  };
  const { bg, fg } = palette[status];
  return {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
    background: bg,
    color: fg,
    whiteSpace: "nowrap",
  };
}

const tagPill: React.CSSProperties = {
  display: "inline-block",
  padding: "1px 7px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 500,
  background: "var(--bg-pill-blue)",
  color: "var(--fg-pill-blue)",
  border: "1px solid var(--border-blue-strong)",
  whiteSpace: "nowrap",
};

const analysisPill: React.CSSProperties = {
  display: "inline-block",
  maxWidth: 280,
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 500,
  background: "var(--bg-pill-blue)",
  color: "var(--fg-pill-blue)",
  textDecoration: "none",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  verticalAlign: "middle",
};

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
