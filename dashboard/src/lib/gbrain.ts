import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import path from "node:path";

/**
 * Helpers for driving the `gbrain` CLI from the dashboard API routes.
 *
 * The dashboard runs from `dashboard/`; the brain folder and the gbrain CLI
 * live one level up at the repo root. We never reimplement retrieval here —
 * every call shells out to `gbrain`.
 *
 * Path resolution is done lazily inside functions (not at module scope) so the
 * Next.js / Turbopack build does not trace the whole project into the bundle.
 */

/** Repo root — the directory that contains `brain/`. */
export function repoRoot(): string {
  return process.env.GBRAIN_REPO_ROOT
    ? path.resolve(process.env.GBRAIN_REPO_ROOT)
    : path.join(/* turbopackIgnore: true */ process.cwd(), "..");
}

/** Absolute path to the brain knowledge folder. */
export function brainDir(): string {
  return process.env.BRAIN_DIR
    ? path.resolve(process.env.BRAIN_DIR)
    : path.join(repoRoot(), "brain");
}

/** Directory committed skill pages are written to. */
export function skillsDir(): string {
  return path.join(brainDir(), "skills");
}

/** The gbrain executable — overridable for non-PATH installs. */
export const GBRAIN_BIN = process.env.GBRAIN_BIN ?? "gbrain";

export type GbrainResult = {
  code: number;
  stdout: string;
  stderr: string;
};

/**
 * Spawn `gbrain <args>`. The child inherits the server's environment, so the
 * dev server must be started in a shell where API keys (OPENAI_API_KEY, etc.)
 * are already exported — see brain/README.md.
 */
export function spawnGbrain(args: string[]): ChildProcessWithoutNullStreams {
  return spawn(GBRAIN_BIN, args, {
    cwd: repoRoot(),
    env: process.env,
  });
}

/** Run `gbrain <args>` to completion, buffering stdout/stderr. */
export function runGbrain(args: string[]): Promise<GbrainResult> {
  return new Promise((resolve, reject) => {
    const child = spawnGbrain(args);
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d: Buffer) => {
      stderr += d.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code: code ?? -1, stdout, stderr });
    });
  });
}
