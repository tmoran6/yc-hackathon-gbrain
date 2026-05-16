import Link from "next/link";
import { pool } from "@/lib/db";
import { formatDuration, formatTimestamp } from "@/lib/format";

export const dynamic = "force-dynamic";

type SessionRow = {
  id: string;
  username: string;
  status: "active" | "ended";
  started_at: Date;
  ended_at: Date | null;
};

export default async function Home() {
  const { rows } = await pool.query<SessionRow>(
    `SELECT id, username, status, started_at, ended_at
       FROM sessions
       ORDER BY started_at DESC
       LIMIT 200`,
  );

  return (
    <main style={{ maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ marginBottom: "0.25rem" }}>Recording sessions</h1>
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
            border: "1px solid #1f242b",
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
            <thead style={{ background: "#11151a", textAlign: "left" }}>
              <tr>
                <th style={th}>User</th>
                <th style={th}>Started</th>
                <th style={th}>Ended</th>
                <th style={th}>Duration</th>
                <th style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  style={{ borderTop: "1px solid #1f242b" }}
                >
                  <td style={td}>
                    <Link
                      href={`/sessions/${row.id}`}
                      style={{
                        color: "#79b8ff",
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
                    <span style={statusPill(row.status)}>{row.status}</span>
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
  color: "#9aa4ad",
};

const td: React.CSSProperties = {
  padding: "10px 14px",
  verticalAlign: "middle",
};

function statusPill(status: "active" | "ended"): React.CSSProperties {
  return {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
    background: status === "active" ? "#1b3a2b" : "#23272d",
    color: status === "active" ? "#65d195" : "#9aa4ad",
  };
}
