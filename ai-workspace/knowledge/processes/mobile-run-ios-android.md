---
status: active
project: optical-pos
updated: 2026-06-18
app_path: optical-pos-angular-capacitor-ux/
stack: Angular 20 + Capacitor 8
---

# Running on iOS and Android

How to run **optical-pos** (Eyewa ERP) on simulators/emulators and devices via Capacitor.

## Project layout

| Item | Value |
|------|--------|
| App root | `optical-pos-angular-capacitor-ux/` |
| Web build output | `dist/optical-pos/browser` |
| Capacitor config | `capacitor.config.ts` |
| iOS native project | `ios/App/App.xcworkspace` |
| Android native project | `android/` |
| App ID | `com.ishaq.opticalpos` |

## Prerequisites

### All platforms

```bash
cd optical-pos-angular-capacitor-ux
npm install
```

### Web-only (fastest iteration)

```bash
npm start
```

Open **http://localhost:4200/** — no native toolchain required.

### iOS

| Requirement | Notes |
|-------------|--------|
| macOS | Required for iOS builds |
| Xcode | Install from App Store |
| Xcode Command Line Tools | `xcode-select --install` |
| CocoaPods | Used by `cap sync ios` (installed via pod install) |
| iOS Simulator runtime | Xcode → Settings → Platforms → iOS (download if missing) |

Verify simulators:

```bash
xcrun simctl list devices available
```

### Android

| Requirement | Notes |
|-------------|--------|
| Android Studio | Install with Android SDK |
| JDK | Android Studio bundled JDK is fine |
| Emulator or USB device | Create AVD in Device Manager |

Verify devices:

```bash
adb devices
```

## Standard native workflow

After **any** web code change, rebuild and sync before running on a device:

```bash
cd optical-pos-angular-capacitor-ux

npm run build
COPYFILE_DISABLE=1 npx cap sync
```

Then run the target platform (see below).

> `COPYFILE_DISABLE=1` prevents macOS from copying resource forks into the web bundle. Recommended on Mac, especially when the repo is under iCloud-synced `Documents/`.

## Live reload (fastest native dev)

Push Angular changes to a simulator or physical device **without** `ng build` + `cap sync` on every save.

### How it works

| Item | Value |
|------|--------|
| Web output folder | `dist/optical-pos/browser` (already set in `capacitor.config.ts`) |
| Dev server | `ng serve` on port **4200**, bound to `0.0.0.0` |
| Native loader | Capacitor `--live-reload` temporarily sets `server.url` in the native `capacitor.config.json` |

Capacitor auto-detects your LAN IP for physical devices. Press **Ctrl+C** in the `cap run` terminal to revert the native config.

### Two terminals

**Terminal 1 — Angular dev server (keep running):**

```bash
cd optical-pos-angular-capacitor-ux
npm run start:mobile
```

**Terminal 2 — iOS or Android with live reload:**

```bash
# iOS simulator or device
npm run ios:live

# Optional: pick a simulator
npm run ios:live -- "A443C992-4D9B-493B-8F75-DA97C7C9522A"

# Android emulator or USB device
npm run android:live
```

### Requirements

| Platform | Notes |
|----------|--------|
| **Same Wi‑Fi** | Phone/tablet and Mac must be on the same network (physical device) |
| **Firewall** | Allow incoming connections on port 4200 |
| **Android USB** | `android:live` runs `adb reverse` via `--forwardPorts 4200:4200` |
| **iOS** | `Info.plist` allows HTTP for dev (`NSAllowsArbitraryLoads`) |
| **Android** | `usesCleartextTraffic="true"` in `AndroidManifest.xml` for HTTP dev server |

### Manual config (alternative)

You can temporarily add this to `capacitor.config.ts` instead of `--live-reload` (remember to remove before release):

```typescript
server: {
  url: 'http://192.168.1.100:4200', // your Mac's LAN IP
  cleartext: true
}
```

Then run `npx cap sync` and open Xcode / Android Studio. Prefer the npm scripts above — they revert config automatically.

### When to use standard build instead

Use `npm run build` + `cap sync` + `cap run` when testing **production bundles**, native plugins, or store-like performance — not for everyday UI iteration.

## iOS

### Run on simulator (CLI)

```bash
cd optical-pos-angular-capacitor-ux

npm run ios
```

`npm run ios` builds, syncs, auto-picks an iPad simulator (or booted device), and runs — use this instead of bare `npx cap run ios`, which hangs on an interactive device picker when multiple simulators exist.

Manual steps (equivalent):

```bash
npm run build
COPYFILE_DISABLE=1 npx cap sync ios
COPYFILE_DISABLE=1 npx cap run ios --target "<SIMULATOR-UUID>"
```

Pick a specific simulator:

```bash
# List simulators
xcrun simctl list devices available

# Example: iPad (A16)
npm run ios -- --target "123EBED7-3366-4157-897B-318AF39D19FB"

# Or via env var
IOS_SIMULATOR_TARGET="A443C992-4D9B-493B-8F75-DA97C7C9522A" npm run ios
```

### Run from Xcode

```bash
npx cap open ios
```

1. Select a simulator (e.g. iPhone 17 Pro) in the device dropdown.
2. Press **Run** (▶).

### Mock login (dev)

When `useMockAuth: true` in `src/config/appsettings.json`:

| Field | Value |
|-------|--------|
| Username / email | `staff@eyewa.com` |
| Password | `demo1234` |

## Android

### Run on emulator or device (CLI)

```bash
cd optical-pos-angular-capacitor-ux

npm run build
npx cap sync android
npx cap run android
```

Capacitor prompts for a target if multiple emulators/devices are connected.

### Run from Android Studio

```bash
npx cap open android
```

1. Wait for Gradle sync.
2. Select an emulator or connected device.
3. Press **Run** (▶).

## Quick reference

| Goal | Command |
|------|---------|
| Web dev server | `npm start` |
| Mobile live reload dev server | `npm run start:mobile` |
| iOS live reload | `npm run ios:live` |
| Android live reload | `npm run android:live` |
| Production web build | `npm run build` |
| Sync both platforms | `npx cap sync` |
| Sync iOS only | `npx cap sync ios` |
| Sync Android only | `npx cap sync android` |
| Run iOS simulator | `npm run ios` |
| Run Android | `npx cap run android` |
| Open Xcode | `npx cap open ios` |
| Open Android Studio | `npx cap open android` |

## iOS troubleshooting

### `Could not delete ios/App/build` / CLEAN FAILED

A stale `ios/App/build` folder (not created by Xcode) blocks `pod install`.

```bash
rm -rf ios/App/build ios/DerivedData
npx cap sync ios
```

Do **not** run `xcodebuild -derivedDataPath ios/App/build` manually.

### CodeSign: `resource fork, Finder information, or similar detritus not allowed`

Common when the repo lives under **iCloud-synced** `~/Documents/`. macOS adds metadata that breaks codesign.

**Full guide (symptoms, cleanup, prevention, project safeguards):**  
[`ios-codesign-xattr-fix.md`](./ios-codesign-xattr-fix.md)

**Quick fix:**

```bash
cd optical-pos-angular-capacitor-ux
npm run build
xattr -cr dist ios/App/App/public ios node_modules/@capacitor
find ios node_modules/@capacitor -name .DS_Store -delete 2>/dev/null
rm -rf ios/DerivedData ios/App/build
COPYFILE_DISABLE=1 npx cap sync ios
COPYFILE_DISABLE=1 npx cap run ios
```

**Already in the project (do not remove):** see [ios-codesign-xattr-fix.md](./ios-codesign-xattr-fix.md#what-is-already-in-this-project).

**Long-term fix:** clone/work from a non-iCloud path (e.g. `~/Developer/fadelsoft-optical-pos`).

### No simulators available / `Unable to retrieve simulator list`

Install an iOS Simulator runtime:

- **Xcode → Settings → Platforms → iOS** → Download  
- Or CLI: `xcodebuild -downloadPlatform iOS` (~8 GB)

### First-time iOS setup

If `ios/` is missing:

```bash
npx cap add ios
npx cap sync ios
```

## Android troubleshooting

### Gradle sync fails

Open Android Studio and use **File → Sync Project with Gradle Files**. Ensure SDK platforms and build tools are installed (SDK Manager).

### No devices listed

```bash
adb devices
```

- Start an emulator from Android Studio → Device Manager, or  
- Enable **USB debugging** on a physical device.

### First-time Android setup

If `android/` is missing:

```bash
npx cap add android
npx cap sync android
```

## Config and environments

| File | Purpose |
|------|---------|
| `src/config/appsettings.json` | Dev config (`useMockAuth: true`) |
| `src/config/appsettings.prod.json` | Prod config (`useMockAuth: false`) |

Config is copied to the native app on `cap sync` via `angular.json` assets (`src/config` → `/config/`).

## Screen rotation

The app supports **all orientations** (portrait, portrait upside-down, landscape left/right) on iOS and Android.

| Platform | Configuration |
|----------|----------------|
| **iOS** | `UISupportedInterfaceOrientations` in `ios/App/App/Info.plist` — all four orientations on iPhone and iPad |
| **Android** | `android:screenOrientation="fullSensor"` on `MainActivity` |
| **Web shell** | `viewport-fit=cover` in `index.html`; shell CSS uses `env(safe-area-inset-*)` and `@media (orientation: landscape)` |

After changing native orientation settings, run `npx cap sync ios` / `npx cap sync android` and rebuild.

**Verify:** rotate simulator (⌘← / ⌘→ in iOS Simulator) — login, header, side menu, and bottom nav should remain usable without overlap.

## Related docs

- **Run entry point (ask Web / iOS / Android first):** [`run.md`](./run.md)
- **Publish to stores:** [`mobile-publish-ios-android.md`](./mobile-publish-ios-android.md)
- **iOS CodeSign xattr fix:** [`ios-codesign-xattr-fix.md`](./ios-codesign-xattr-fix.md)
- Staff login feature: [`specs/001-staff-login/`](../../specs/001-staff-login/)
- UI component architecture: [`architecture/pos-dashboard-components.md`](../architecture/pos-dashboard-components.md)
