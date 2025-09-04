#!/usr/bin/env bash
set -euo pipefail

echo "=== DEV DIAG ==="
echo "Node: $(node -v)  npm: $(npm -v)"
echo "PWD:  $(pwd)"
echo

# ---------- 1) FRONTEND env ----------
FRONT_DIR="./frontend"
if [ -d "./frontend" ]; then FRONT_DIR="./frontend"; elif [ -d "." -a -f "./package.json" -a -f "./vite.config.ts" ]; then FRONT_DIR="."; fi

echo "-> Checking $FRONT_DIR/.env.local"
if [ -f "$FRONT_DIR/.env.local" ]; then
  echo "----- $FRONT_DIR/.env.local -----"
  cat "$FRONT_DIR/.env.local" | sed 's/^\(VITE_SUPABASE_ANON=\).*/\1***redacted***/'
  echo "---------------------------------"
else
  echo "!! $FRONT_DIR/.env.local not found"
fi
echo

echo "-> Grepping for leftover hardcoded URLs in frontend/src"
grep -R --line-number -E "http://localhost:8080|https://localhost:8080|VITE_API_BASE" "$FRONT_DIR/src" || echo "(clean)"
echo

# ---------- 2) BACKEND HTTP vs HTTPS ----------
echo "-> Backend HEAD (HTTP)  http://localhost:8080"
set +e
HTTP_HEAD=$(curl -sSI http://localhost:8080/ 2>/dev/null | tr -d '\r')
set -e
echo "$HTTP_HEAD"
if echo "$HTTP_HEAD" | grep -qi '^location: https://localhost:8080'; then
  echo "!! Redirecting to HTTPS. Disable force-HTTPS in dev."
fi
echo

# Try a likely health path (adjust if you have different):
for P in /health /healthz /api/health /api/v1/health /; do
  echo "-> Probe GET http://localhost:8080$P"
  set +e
  R=$(curl -sSI "http://localhost:8080$P" 2>/dev/null | tr -d '\r')
  CODE=$(echo "$R" | awk 'toupper($0) ~ /^HTTP/ {print $2; exit}')
  echo "$R"
  set -e
  if [ -n "$CODE" ]; then break; fi
done
echo

# ---------- 3) PROXY via Vite (frontend must be running on 5173) ----------
echo "-> Proxy check GET http://localhost:5173/api/health (or similar)"
set +e
VITE_R=$(curl -sSI http://localhost:5173/api/health 2>/dev/null | tr -d '\r')
set -e
echo "$VITE_R"
echo

# ---------- 4) Minimal POST to endpoint ----------
JSON='{"formData":{"moduleName":"Diag","moduleType":"E-Learning","complexityLevel":"Level 1","tone":"Professional","outputLanguage":"English (UK)","durationMins":1,"content":"Hello"}}'

echo "-> Direct POST http://localhost:8080/api/v1/generate-from-text"
set +e
D_R=$(curl -sS -o /dev/null -w "HTTP:%{http_code} REDIR:%{redirect_url}\n" -H "Content-Type: application/json" -d "$JSON" http://localhost:8080/api/v1/generate-from-text)
set -e
echo "$D_R"

echo "-> Proxy POST http://localhost:5173/api/v1/generate-from-text"
set +e
P_R=$(curl -sS -o /dev/null -w "HTTP:%{http_code} REDIR:%{redirect_url}\n" -H "Content-Type: application/json" -d "$JSON" http://localhost:5173/api/v1/generate-from-text)
set -e
echo "$P_R"
echo

# ---------- 5) Summary ----------
echo "=== SUMMARY ==="
echo "If you saw 'Location: https://localhost:8080' anywhere, the backend is forcing HTTPS in dev."
echo "If proxy GET/POST to :5173 failed but direct :8080 worked, fix vite proxy or VITE_BACKEND_URL."
echo "If both fail, check backend route paths and logs."