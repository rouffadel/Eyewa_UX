#!/usr/bin/env bash
# Run iOS simulator with DerivedData outside iCloud-synced Documents/.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

"$ROOT/scripts/ios-prebuild.sh"

# shellcheck source=resolve-ios-simulator.sh
source "$ROOT/scripts/resolve-ios-simulator.sh"

TARGET_ID="${1:-}"
if [ -z "$TARGET_ID" ]; then
  TARGET_ID="$(resolve_ios_simulator)"
  echo "Auto-selected simulator: $TARGET_ID"
fi

DERIVED_DATA="${DERIVED_DATA:-$HOME/Library/Developer/Xcode/DerivedData/optical-pos-cap-run}"
WORKSPACE="App.xcworkspace"
SCHEME="App"
CONFIG="Debug"

echo "Building with DerivedData at: $DERIVED_DATA"
COPYFILE_DISABLE=1 xcrun xcodebuild \
  -workspace "ios/App/$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration "$CONFIG" \
  -destination "id=$TARGET_ID" \
  -derivedDataPath "$DERIVED_DATA" \
  build

APP_PATH="$DERIVED_DATA/Build/Products/${CONFIG}-iphonesimulator/${SCHEME}.app"
echo "Launching $APP_PATH on $TARGET_ID"
npx native-run ios --app "$APP_PATH" --target "$TARGET_ID"
