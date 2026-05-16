# Brain

Shared knowledge base for the team, indexed by [gbrain](https://github.com/garrytan/gbrain).

The markdown files in this directory are the source of truth. They sync between team members via this git repo. Each person runs gbrain locally to index, search, and query them — there is no shared database.

## Sync workflow

```bash
# pull teammate edits and re-index
git pull
./brain/sync.sh
```

`sync.sh` runs `gbrain import` + `gbrain embed --stale` against this folder.

## Filing rule

Every page lives in exactly one directory. If unsure, drop it in `inbox/` and resolve later.

- `people/` — one page per person (`first-last.md`)
- `companies/` — one page per organization
- `concepts/` — mental models, frameworks, technical ideas
- `projects/` — things being actively built (has a repo, spec, or team)
- `ideas/` — raw possibilities not yet being built
- `inbox/` — unsorted quick captures (move out when filed)

## Page format

Each page has two sections separated by `---`:

- **Above the line** — compiled truth (always current, rewritten as new info arrives)
- **Below the line** — timeline (append-only evidence log, never rewritten)

## First-time setup for a new teammate

Walks you from zero to a working local brain that mirrors the team's. Should take ~15-20 min, mostly waiting on `bun install`. macOS / Linux.

### 1. Get API keys

- **OpenAI** (required, for embeddings): https://platform.openai.com/api-keys — costs cents/month for a small brain.
- **Anthropic** (optional, improves query synthesis): https://console.anthropic.com/settings/keys

### 2. Install bun + gbrain CLI

```bash
# Install bun (skip if you already have it)
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"

# Install gbrain itself (the tool lives outside this repo)
git clone https://github.com/garrytan/gbrain.git ~/gbrain
cd ~/gbrain && bun install && bun link
gbrain --version   # sanity check
```

> Do NOT use `bun install -g github:garrytan/gbrain` or `npm install -g gbrain` — both break in known ways. Use the `git clone + bun link` path above.

### 3. Stash your API keys outside the repo

```bash
cat > ~/.gbrain.env <<'EOF'
export OPENAI_API_KEY=sk-...your-key...
export ANTHROPIC_API_KEY=sk-ant-...your-key...   # optional
EOF
chmod 600 ~/.gbrain.env
```

**Never commit these keys** — `~/.gbrain.env` lives in your home directory, not in this repo.

### 4. Initialize gbrain and pick the search mode

```bash
source ~/.gbrain.env
gbrain init                                # creates the local PGLite DB in ~/.gbrain/
gbrain config set search.mode balanced     # IMPORTANT: gbrain defaults to "tokenmax" which can cost ~$1K/mo
                                           # at heavy use. "balanced" is the Sonnet-tier sweet spot.
gbrain doctor                              # should report mostly OK with a few empty-brain warnings
```

### 5. Index this repo's brain

From the Hackathon repo root:

```bash
source ~/.gbrain.env
./brain/sync.sh
```

That runs `gbrain import brain/` + `gbrain embed --stale`. First run will embed all pages (~seconds, a few cents on OpenAI). Subsequent runs only re-embed changed pages.

### 6. Use it

```bash
source ~/.gbrain.env
gbrain search "some query"     # fast hybrid retrieval (~100ms)
gbrain query "some question"   # LLM-synthesized answer (slower, needs Anthropic key)
```

### Ongoing — keep your brain in sync with the team

Anytime you `git pull` brain changes from the team, re-index:

```bash
git pull
./brain/sync.sh
```

When you add or edit pages, commit them like any other code change and push. The next person's `./brain/sync.sh` will pick them up.

### Troubleshooting

- `gbrain: command not found` → restart your shell or re-export the bun PATH.
- `OPENAI_API_KEY not set` → you forgot to `source ~/.gbrain.env` in this shell.
- `Timed out waiting for PGLite lock` → another gbrain process is holding it. `ps aux | grep gbrain` and kill the stuck one.
