import Link from "next/link";
import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import { fetchObjectText, listObjects, publicUrl } from "@/lib/storage";
import { formatDuration, formatTimestamp } from "@/lib/format";
import SessionViewer from "./SessionViewer";
import AnalysisPanel, { type AnalyzerResult } from "./AnalysisPanel";
import UserReviewPanel, { type AnalysisEdits } from "./UserReviewPanel";
import TagsEditor from "./TagsEditor";
import { suggestTags } from "@/lib/tags";

export const dynamic = "force-dynamic";

type SessionRow = {
  id: string;
  username: string;
  status: "active" | "ended";
  started_at: Date;
  ended_at: Date | null;
  tags: string[] | null;
};

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { rows } = await pool.query<SessionRow>(
    `SELECT id, username, status, started_at, ended_at, tags
       FROM sessions
       WHERE id = $1`,
    [id],
  );
  if (rows.length === 0) notFound();
  const session = rows[0];

  const analysisRes = await pool.query<{
    result: AnalyzerResult;
    recording: string | null;
    updated_at: Date;
    edits: AnalysisEdits | null;
    review_state: "user_review" | "confirmed" | "discarded";
  }>(
    `SELECT result, recording, updated_at, edits, review_state
       FROM analysis
       WHERE session_id = $1`,
    [id],
  );
  const analysis = analysisRes.rows[0] ?? null;

  const [screenshotObjs, transcriptObjs] = await Promise.all([
    listObjects(`${id}/screenshots/`).catch((err) => {
      console.error("list screenshots failed", err);
      return [];
    }),
    listObjects(`${id}/transcripts/`).catch((err) => {
      console.error("list transcripts failed", err);
      return [];
    }),
  ]);

  const screenshots = screenshotObjs
    .filter((o) => o.name && !o.name.endsWith("/"))
    .map((o) => ({
      name: o.name,
      url: publicUrl(`${id}/screenshots/${o.name}`),
    }));

  const transcripts = await Promise.all(
    transcriptObjs
      .filter((o) => o.name && !o.name.endsWith("/"))
      .map(async (o) => ({
        name: o.name,
        text: await fetchObjectText(`${id}/transcripts/${o.name}`),
      })),
  );

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Link
        href="/"
        style={{
          color: "#79b8ff",
          textDecoration: "none",
          fontSize: 14,
        }}
      >
        ← All sessions
      </Link>

      <header style={{ marginTop: "1rem", marginBottom: "2rem" }}>
        <h1 style={{ marginBottom: "0.25rem" }}>{session.username}</h1>
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            flexWrap: "wrap",
            opacity: 0.75,
            fontSize: 14,
          }}
        >
          <Field label="Started" value={formatTimestamp(session.started_at)} />
          <Field label="Ended" value={formatTimestamp(session.ended_at)} />
          <Field
            label="Duration"
            value={formatDuration(session.started_at, session.ended_at)}
          />
          <Field label="Status" value={session.status} />
          <Field
            label="ID"
            value={
              <code style={{ fontSize: 12, opacity: 0.7 }}>{session.id}</code>
            }
          />
        </div>
      </header>

      <TagsEditor
        sessionId={session.id}
        initialTags={session.tags ?? []}
        autoSuggestions={suggestTags({ workflow: analysis?.result?.workflow })}
      />

      {analysis && analysis.review_state === "user_review" ? (
        <UserReviewPanel
          sessionId={session.id}
          result={analysis.result}
          edits={analysis.edits ?? {}}
          recording={analysis.recording}
          updatedAt={analysis.updated_at}
        />
      ) : (
        <AnalysisPanel
          result={analysis?.result ?? null}
          edits={analysis?.edits ?? null}
          reviewState={analysis?.review_state ?? null}
          recording={analysis?.recording ?? null}
          updatedAt={analysis?.updated_at ?? null}
        />
      )}

      <SessionViewer screenshots={screenshots} transcripts={transcripts} />
    </main>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          opacity: 0.6,
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div>{value}</div>
    </div>
  );
}
