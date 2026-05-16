#!/usr/bin/env bash
# Re-index the brain after pulling git changes.
# Requires: gbrain on PATH, OPENAI_API_KEY (and optionally ANTHROPIC_API_KEY) in env.
set -euo pipefail

BRAIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v gbrain >/dev/null 2>&1; then
  echo "gbrain CLI not found on PATH. Install it: https://github.com/garrytan/gbrain" >&2
  exit 1
fi

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "OPENAI_API_KEY not set. Source your gbrain env file (e.g. 'source ~/.gbrain.env') first." >&2
  exit 1
fi

echo "→ Importing markdown from $BRAIN_DIR"
gbrain import "$BRAIN_DIR" --no-embed

echo "→ Embedding new/changed pages"
gbrain embed --stale

echo "✓ Brain re-indexed."
