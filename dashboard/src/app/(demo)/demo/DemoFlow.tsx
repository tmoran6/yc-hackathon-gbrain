"use client";

// Orchestrates the demo flow: capture -> commit -> ask. Fetches the captured
// skill from the local mock route on mount, then wires the commit state
// through to unlock the chat box.

import { useEffect, useState } from "react";
import SkillCapturedCard, {
  type Workflow,
} from "@/components/SkillCapturedCard";
import CommitToBrainButton from "@/components/CommitToBrainButton";
import AskBrainChat from "@/components/AskBrainChat";

type SkillResponse = {
  session_id: string;
  recording?: string;
  duration_sec?: number;
  confidence?: number;
  workflow: Workflow;
};

export default function DemoFlow() {
  const [skill, setSkill] = useState<SkillResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [committed, setCommitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/mock/skill")
      .then((res) => {
        if (!res.ok) throw new Error(`capture failed (${res.status})`);
        return res.json();
      })
      .then((data: SkillResponse) => {
        if (!cancelled) setSkill(data);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "capture failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p style={errorBox}>Could not load the captured skill: {error}</p>;
  }

  if (!skill) {
    return <p style={{ opacity: 0.6 }}>Loading captured skill…</p>;
  }

  return (
    <>
      <SkillCapturedCard
        workflow={skill.workflow}
        confidence={skill.confidence}
        durationSec={skill.duration_sec}
        recording={skill.recording}
        committed={committed}
      >
        <CommitToBrainButton
          workflow={skill.workflow}
          committed={committed}
          onCommitted={() => setCommitted(true)}
        />
      </SkillCapturedCard>

      <AskBrainChat enabled={committed} />
    </>
  );
}

const errorBox: React.CSSProperties = {
  border: "1px solid var(--border-error-box)",
  background: "var(--bg-error-box)",
  color: "var(--fg-error-text)",
  borderRadius: 8,
  padding: "12px 16px",
  fontSize: 14,
};
