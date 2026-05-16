#!/usr/bin/env bash
# MCP stdio server for this brain. Same env conventions as sync.sh:
#   - GBRAIN_HOME pinned to this directory (in-repo PGLite, gitignored)
#   - DATABASE_URL/GBRAIN_DATABASE_URL unset (the dashboard's .env.local would
#     otherwise switch gbrain to Postgres mode and break local PGLite ops)
#   - ~/.bun/bin on PATH so bun-linked gbrain is found by non-login shells
#   - ~/.gbrain.env sourced for OPENAI_API_KEY (+ optional ANTHROPIC_API_KEY)
#
# Wire this into Claude Code via .mcp.json at the repo root (see project README).
set -euo pipefail

BRAIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export GBRAIN_HOME="${GBRAIN_HOME:-$BRAIN_DIR}"
unset DATABASE_URL GBRAIN_DATABASE_URL GBRAIN_DIRECT_DATABASE_URL

case ":$PATH:" in
  *":$HOME/.bun/bin:"*) ;;
  *) export PATH="$HOME/.bun/bin:$PATH" ;;
esac

# Pull in OPENAI_API_KEY (used by query expansion) if not already set.
if [[ -z "${OPENAI_API_KEY:-}" && -f "$HOME/.gbrain.env" ]]; then
  # shellcheck disable=SC1091
  source "$HOME/.gbrain.env"
fi

if ! command -v gbrain >/dev/null 2>&1; then
  echo "gbrain CLI not found on PATH. Install: https://github.com/garrytan/gbrain" >&2
  exit 1
fi

exec gbrain serve
