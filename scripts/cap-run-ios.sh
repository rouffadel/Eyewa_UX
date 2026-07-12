#!/usr/bin/env bash
# Non-interactive replacement for `npx cap run ios` (avoids simulator picker hang).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck source=resolve-ios-simulator.sh
source "$ROOT/scripts/resolve-ios-simulator.sh"

TARGET_ID=""
CAP_ARGS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --target)
      TARGET_ID="${2:-}"
      shift 2
      ;;
    *)
      CAP_ARGS+=("$1")
      shift
      ;;
  esac
done

if [ -z "$TARGET_ID" ]; then
  TARGET_ID="$(resolve_ios_simulator)"
  echo "Auto-selected simulator: $TARGET_ID"
  echo "Override with: npm run ios -- --target <UUID>  or  IOS_SIMULATOR_TARGET=<UUID> npm run ios"
fi

"$ROOT/scripts/ios-prebuild.sh"

COPYFILE_DISABLE=1 npx cap run ios --no-sync --target "$TARGET_ID" ${CAP_ARGS+"${CAP_ARGS[@]}"}
