#!/usr/bin/env bash
# Strip iCloud / Finder metadata before iOS native build (Codesign fails otherwise).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Building web app..."
npm run build

echo "Stripping extended attributes..."
xattr -cr dist ios node_modules/@capacitor 2>/dev/null || true
find ios node_modules/@capacitor -name .DS_Store -delete 2>/dev/null || true
find ios node_modules/@capacitor -name '._*' -delete 2>/dev/null || true

echo "Clearing local DerivedData (inside iCloud-synced repo)..."
rm -rf ios/DerivedData ios/App/build

echo "Syncing Capacitor iOS..."
COPYFILE_DISABLE=1 npx cap sync ios

echo "Re-installing CocoaPods hooks..."
(cd ios/App && pod install)

echo "iOS prebuild complete."
