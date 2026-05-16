import { execSync, ExecSyncOptions } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Absolute path to the repo root (parent of dashboard/).
 * process.cwd() in Next.js dev mode = the dashboard/ directory.
 * We go one level up to reach the repo root.
 */
export const REPO_ROOT = path.resolve(process.cwd(), "..");

/** Absolute path to the brain directory. */
export const BRAIN_DIR = path.join(REPO_ROOT, "brain");

/** Absolute path to the skills directory inside the brain. */
export const SKILLS_DIR = path.join(BRAIN_DIR, "skills");

/**
 * Parse a shell `export KEY=VALUE` env file (like ~/.gbrain.env).
 * Returns a record of key→value pairs.
 */
function parseEnvFile(filePath: string): Record<string, string> {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const result: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const m = line.match(/^(?:export\s+)?([A-Z0-9_]+)=(.*)$/);
      if (m) {
        // Strip surrounding quotes if present
        result[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
      }
    }
    return result;
  } catch {
    return {};
  }
}

/** Environment to pass to child processes — ensures gbrain is on PATH and keys are loaded. */
export function gbrainEnv(): NodeJS.ProcessEnv {
  const home = process.env.HOME ?? "/root";
  const bunBin = `${home}/.bun/bin`;
  const existingPath = process.env.PATH ?? "";
  const finalPath = existingPath.includes(bunBin)
    ? existingPath
    : `${bunBin}:${existingPath}`;

  // Build env explicitly, spreading process.env then overriding/removing problematic vars.
  // DATABASE_URL from .env.local would cause gbrain to try a remote Postgres connection
  // instead of its local pglite DB. We must exclude it.
  const env: NodeJS.ProcessEnv = { ...process.env };
  // DATABASE_URL from .env.local would cause gbrain to try a remote Postgres
  // connection instead of its local pglite DB. Remove all Postgres vars.
  delete env.DATABASE_URL;
  delete env.POSTGRES_URL;
  delete env.POSTGRES_PRISMA_URL;
  delete env.POSTGRES_URL_NON_POOLING;
  env.PATH = finalPath;

  // Load API keys from ~/.gbrain.env as fallback (in case Next.js didn't inject them).
  // gbrain needs OPENAI_API_KEY for embeddings and ANTHROPIC_API_KEY for synthesis.
  const gbrainKeys = parseEnvFile(`${home}/.gbrain.env`);
  if (!env.OPENAI_API_KEY && gbrainKeys.OPENAI_API_KEY) {
    env.OPENAI_API_KEY = gbrainKeys.OPENAI_API_KEY;
  }
  if (!env.ANTHROPIC_API_KEY && gbrainKeys.ANTHROPIC_API_KEY) {
    env.ANTHROPIC_API_KEY = gbrainKeys.ANTHROPIC_API_KEY;
  }

  return env;
}

/** Default exec options shared across gbrain calls. */
function baseOpts(): ExecSyncOptions {
  return {
    env: gbrainEnv(),
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    // Run from /tmp so gbrain doesn't pick up .env.local from dashboard/ cwd.
    // gbrain scans for .env files starting from cwd, and dashboard/.env.local
    // contains DATABASE_URL which makes gbrain try a remote Postgres connection.
    cwd: "/tmp",
  };
}

/**
 * Run a gbrain command and return stdout as a string.
 * Throws on non-zero exit (unless already swallowed by the shell command itself).
 */
export function gbrain(cmd: string): string {
  return execSync(`gbrain ${cmd}`, {
    ...baseOpts(),
    maxBuffer: 10 * 1024 * 1024,
  }) as unknown as string;
}

/**
 * Run `gbrain query "<question>" --limit 5` with an 8-second timeout,
 * discarding everything after retrieval lines (synthesis hangs).
 * Returns the raw stdout (which may be partial — that is expected).
 */
export function gbrainQuery(question: string): string {
  try {
    const result = execSync(
      `timeout 8 gbrain query ${JSON.stringify(question)} --limit 5 2>/dev/null || true`,
      {
        ...baseOpts(),
        maxBuffer: 10 * 1024 * 1024,
      },
    );
    return result as unknown as string;
  } catch {
    // timeout exits non-zero; stdout is still captured
    return "";
  }
}

/**
 * Parse the first retrieval line from `gbrain query` output.
 * Expected format: `[<score>]  skills/<slug>`
 * Returns the slug (e.g. "skills/medication-refill-processing") or null.
 */
export function parseSlug(queryOutput: string): string | null {
  const match = queryOutput.match(/^\[[0-9.]+\]\s+(skills\/[a-z0-9-]+)/m);
  return match ? match[1] : null;
}

/**
 * Fetch a skill page from gbrain by slug (e.g. "skills/medication-refill-processing").
 * Returns the markdown content of the page.
 */
export function gbrainGet(slug: string): string {
  return gbrain(`get ${JSON.stringify(slug)}`) as unknown as string;
}
