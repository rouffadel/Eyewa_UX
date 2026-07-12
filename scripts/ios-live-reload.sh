#!/usr/bin/env bash
# Capacitor live reload — iOS simulator or device.
# Terminal 1: npm run start:mobile
# Terminal 2: npm run ios:live [-- <SIMULATOR-UUID>]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-4200}"
ARGS=()

# shellcheck source=resolve-ios-simulator.sh
source "$ROOT/scripts/resolve-ios-simulator.sh"

if [ "${1:-}" = "--target" ] && [ -n "${2:-}" ]; then
  ARGS+=(--target "$2")
  shift 2
elif [ -n "${1:-}" ] && [[ "$1" != --* ]]; then
  ARGS+=(--target "$1")
  shift
else
  TARGET_ID="$(resolve_ios_simulator)"
  ARGS+=(--target "$TARGET_ID")
  echo "Auto-selected simulator: $TARGET_ID"
fi

echo "Ensure 'npm run start:mobile' is running (port $PORT)."
echo "Capacitor will point the native app at your dev server and revert config on Ctrl+C."

COPYFILE_DISABLE=1 npx cap run ios \
  --live-reload \
  --port "$PORT" \
  "${ARGS[@]}" \
  "$@"
