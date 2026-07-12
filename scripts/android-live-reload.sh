#!/usr/bin/env bash
# Capacitor live reload — Android emulator or USB device.
# Terminal 1: npm run start:mobile
# Terminal 2: npm run android:live
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-4200}"

echo "Ensure 'npm run start:mobile' is running (port $PORT)."
echo "Capacitor will point the native app at your dev server and revert config on Ctrl+C."

npx cap run android \
  --live-reload \
  --port "$PORT" \
  --forwardPorts "${PORT}:${PORT}" \
  "$@"
