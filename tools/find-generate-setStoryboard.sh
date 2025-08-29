#!/usr/bin/env bash
# Search the frontend source for any calls to /api/v1/generate-from-files
# and show nearby lines plus any setStoryboard(...) calls in the same file.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/frontend"

if [ ! -d "$FRONTEND" ]; then
  echo "❌ Frontend folder not found at: $FRONTEND" >&2
  exit 1
fi

echo "🔎 Scanning in: $FRONTEND"

# Find files that reference the endpoint (supports both hardcoded and env-based)
MATCH_FILES=$(grep -RIl --exclude-dir=node_modules \
  -e '/api/v1/generate-from-files' \
  -e 'generateFromFiles' \
  "$FRONTEND" || true)

if [ -z "$MATCH_FILES" ]; then
  echo "⚠️  No references to generate-from-files found."
  exit 0
fi

echo
echo "📁 Files that reference 'generate-from-files':"
echo "--------------------------------------------"
echo "$MATCH_FILES" | sed 's/^/ - /'
echo

# For each file, show endpoint usage with 6 lines of context and any setStoryboard references
while IFS= read -r FILE; do
  echo "══════════════════════════════════════════════════════════════════════"
  echo "📄 $FILE"
  echo "──────────────────────────────────────────────────────────────────────"
  echo "▶ Endpoint references (context):"
  echo "----------------------------------------------------------------------"
  grep -n -C 6 --color=always -e '/api/v1/generate-from-files' -e 'generateFromFiles' "$FILE" || true
  echo
  echo "▶ setStoryboard(...) calls in the same file:"
  echo "----------------------------------------------------------------------"
  grep -n --color=always -e 'setStoryboard\s*\(' "$FILE" || echo "  (none)"
  echo
done <<< "$MATCH_FILES"

echo "✅ Done."