#!/usr/bin/env bash
set -euo pipefail

# Move to project root (scripts/ is inside project)
cd "$(dirname "$0")/.."

# Defaults (can be overridden by environment variables)
PORT="${PORT:-5173}"
HOST="${HOST:-0.0.0.0}"
OPEN="${OPEN:-true}"

# Open flag
if [ "$OPEN" = "true" ] || [ "$OPEN" = "1" ]; then
  OPEN_FLAG="--open"
else
  OPEN_FLAG=""
fi

echo "Starting Vite dev server on ${HOST}:${PORT} (open=${OPEN})"
# Use npm script so project-local vite binary is used; forward extra flags
npm run dev -- --host "$HOST" --port "$PORT" --strictPort $OPEN_FLAG
