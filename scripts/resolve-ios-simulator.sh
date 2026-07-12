#!/usr/bin/env bash
# Resolve an iOS simulator UUID for non-interactive `cap run ios`.
# Override with IOS_SIMULATOR_TARGET or pass --target explicitly.

_extract_uuid() {
  sed -n 's/.*(\([A-F0-9-]\{36\}\)).*/\1/p' | head -1
}

resolve_ios_simulator() {
  if [ -n "${IOS_SIMULATOR_TARGET:-}" ]; then
    echo "$IOS_SIMULATOR_TARGET"
    return 0
  fi

  local booted
  booted="$(xcrun simctl list devices booted 2>/dev/null | _extract_uuid || true)"
  if [ -n "$booted" ]; then
    echo "$booted"
    return 0
  fi

  local devices
  devices="$(xcrun simctl list devices available 2>/dev/null || true)"

  if [ -z "$devices" ]; then
    echo "Unable to list iOS simulators. Open Xcode once, then retry." >&2
    return 1
  fi

  # Tablet-first for POS; fall back to any available iPhone simulator.
  local target
  target="$(printf '%s\n' "$devices" | grep -E 'iPad.*\([A-F0-9-]{36}\)' | _extract_uuid || true)"
  if [ -n "$target" ]; then
    echo "$target"
    return 0
  fi

  target="$(printf '%s\n' "$devices" | grep -E 'iPhone.*\([A-F0-9-]{36}\)' | _extract_uuid || true)"
  if [ -n "$target" ]; then
    echo "$target"
    return 0
  fi

  echo "No iOS simulators found. Install one in Xcode → Settings → Platforms." >&2
  return 1
}
