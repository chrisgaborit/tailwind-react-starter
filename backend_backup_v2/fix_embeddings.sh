#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Fixing embedding dimension mismatch (switching to 1536 dims: text-embedding-3-small)"

# 1) Safety: backup .env
if [ -f ".env" ]; then
  cp .env .env.backup.$(date +%Y%m%d-%H%M%S)
  echo "📦 Backed up .env -> .env.backup.*"
fi

# 2) Ensure OPENAI_EMBED_MODEL is set to text-embedding-3-small
if ! grep -q '^OPENAI_EMBED_MODEL=' .env 2>/dev/null; then
  echo "OPENAI_EMBED_MODEL=text-embedding-3-small" >> .env
  echo "📝 Added OPENAI_EMBED_MODEL=text-embedding-3-small to .env"
else
  # macOS/BSD sed compat; falls back to GNU if available
  sed -i '' 's/^OPENAI_EMBED_MODEL=.*/OPENAI_EMBED_MODEL=text-embedding-3-small/' .env 2>/dev/null \
  || sed -i 's/^OPENAI_EMBED_MODEL=.*/OPENAI_EMBED_MODEL=text-embedding-3-small/' .env
  echo "📝 Updated OPENAI_EMBED_MODEL in .env to text-embedding-3-small"
fi

# 3) Replace any hardcoded model names in code (ingest + any scripts)
#    (Adjust paths if your ingest script lives elsewhere)
FILES=$(git ls-files | grep -E 'backend/.*\.(ts|tsx|js)$' || true)
if [ -n "$FILES" ]; then
  # macOS/BSD sed inline
  for f in $FILES; do
    sed -i '' 's/text-embedding-3-large/text-embedding-3-small/g' "$f" 2>/dev/null \
    || sed -i 's/text-embedding-3-large/text-embedding-3-small/g' "$f"
  done
fi

echo "🔎 Changes made (showing diffs where applicable):"
git --no-pager diff -- backend | sed -n '1,200p' || true

# 4) Install deps (in case ingest script needs them)
( cd backend && npm i )

# 5) Quick sanity: does backend default also point to small?
#    (Your server already uses EMBED_MODEL env; this is just a reminder.)
echo "✅ Ensured env + code use text-embedding-3-small (1536 dims)."

echo "ℹ️ You can now re-run ingestion, e.g.:"
echo "   npx ts-node -r dotenv/config backend/scripts/ingestStoryboards.ts \"\$HOME/Downloads/STORYBOARDS FOR APP 0825\""

# 6) Optional: run a single-file smoke test if a SAMPLE_FILE is provided
if [ "${SAMPLE_FILE:-}" != "" ]; then
  echo "🧪 Smoke test with SAMPLE_FILE=$SAMPLE_FILE"
  npx ts-node -r dotenv/config backend/scripts/ingestStoryboards.ts "$SAMPLE_FILE"
fi

echo "🎉 Done. Re-run your full ingestion when ready."
