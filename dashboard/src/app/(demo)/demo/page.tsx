import Link from "next/link";
import DemoFlow from "./DemoFlow";

export const metadata = {
  title: "Skill capture demo",
};

export default function DemoPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto" }}>
      <Link href="/" style={backLink}>
        ← Recording sessions
      </Link>
      <h1 style={{ margin: "0.5rem 0 0.25rem" }}>Teach your company Brain</h1>
      <p style={{ opacity: 0.6, marginTop: 0 }}>
        The work was recorded once. We turned it into a reusable skill — commit
        it to your Brain, then ask the Brain how the work gets done.
      </p>

      <DemoFlow />
    </main>
  );
}

const backLink: React.CSSProperties = {
  color: "var(--text-link)",
  textDecoration: "none",
  fontSize: 13,
};
