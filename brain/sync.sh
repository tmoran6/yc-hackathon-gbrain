#!/usr/bin/env bash
# Re-index the brain after pulling git changes.
# Requires: gbrain on PATH, OPENAI_API_KEY (and optionally ANTHROPIC_API_KEY) in env.
set -euo pipefail

BRAIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Keep the PGLite brain inside the repo (under brain/.gbrain/) rather than the
# user's home. gbrain treats GBRAIN_HOME as the parent and creates `.gbrain/`
# inside it, so we point it at the brain dir itself. Self-contained per-checkout;
# the `.gbrain/` directory is gitignored.
export GBRAIN_HOME="${GBRAIN_HOME:-$BRAIN_DIR}"

# gbrain reads $DATABASE_URL / $GBRAIN_DATABASE_URL and switches to Postgres
# mode when either is set, ignoring the file-config's `engine: pglite`. The
# dashboard's .env.local exports DATABASE_URL=<supabase>, which leaks into
# spawned children. Force-clear here so the brain is always the local PGLite.
unset DATABASE_URL GBRAIN_DATABASE_URL GBRAIN_DIRECT_DATABASE_URL

# Make bun-linked gbrain visible to non-login shells (e.g. spawned by the
# dashboard's Next.js process).
case ":$PATH:" in
  *":$HOME/.bun/bin:"*) ;;
  *) export PATH="$HOME/.bun/bin:$PATH" ;;
esac

if ! command -v gbrain >/dev/null 2>&1; then
  echo "gbrain CLI not found on PATH. Install it: https://github.com/garrytan/gbrain" >&2
  exit 1
fi

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "OPENAI_API_KEY not set. Source your gbrain env file (e.g. 'source ~/.gbrain.env') first." >&2
  exit 1
fi

# gbrain defaults to search.mode "tokenmax", which can cost ~$1K/mo at heavy
# use. Pin it to "balanced" (the Sonnet-tier sweet spot) on every sync so the
# demo laptop never drifts back to the expensive default.
echo "→ Pinning search mode to balanced"
gbrain config set search.mode balanced

echo "→ Importing markdown from $BRAIN_DIR"
gbrain import "$BRAIN_DIR" --no-embed

echo "→ Embedding new/changed pages"
gbrain embed --stale

echo "✓ Brain re-indexed."
