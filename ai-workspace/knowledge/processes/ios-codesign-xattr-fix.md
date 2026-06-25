---
status: active
project: optical-pos
updated: 2026-06-20
app_path: optical-pos-angular-capacitor-ux/
applies_to: iOS Capacitor builds (npx cap run ios, Xcode)
---

# iOS CodeSign error — resource fork / xattr fix

Guide for the native iOS build failure that often appears when running the Eyewa POS app from this repo on a Mac.

## Is this your error?

You see something like this during **`npx cap run ios`** or an Xcode build (not during `npm run build`):

```text
Code Signing .../Capacitor.framework with Identity Sign to Run Locally
.../Capacitor.framework: resource fork, Finder information, or similar detritus not allowed
Command PhaseScriptExecution failed with a nonzero exit code

** BUILD FAILED **

The following build commands failed:
  PhaseScriptExecution [CP] Embed Pods Frameworks
```

| Build step | Usually passes? |
|------------|-----------------|
| `npm run build` (Angular) | Yes |
| `npx cap sync ios` | Yes |
| Xcode / `npx cap run ios` (CodeSign) | **Fails** |

So the web app is fine — the **iOS native codesign** step is failing.

---

## Why it happens

macOS can attach **extended attributes** (xattrs) and **resource forks** to files — especially when the project is under **iCloud-synced folders** such as:

- `~/Documents/...`
- Desktop with iCloud Drive enabled

Apple’s `codesign` tool **rejects** binaries and frameworks that carry this metadata. CocoaPods copies `Capacitor.framework` into the app bundle and signs it during **`[CP] Embed Pods Frameworks`** — that is when the error surfaces.

This is an environment/path issue, not an Angular or TypeScript bug.

---

## What to do (fix now)

Run from the app root:

```bash
cd optical-pos-angular-capacitor-ux

# 1. Build the web app first
npm run build

# 2. Strip extended attributes from build outputs and iOS tree
xattr -cr dist ios/App/App/public ios node_modules/@capacitor

# 3. Remove Finder junk files (optional but helpful)
find ios node_modules/@capacitor -name .DS_Store -delete 2>/dev/null

# 4. Clear stale Xcode build caches
rm -rf ios/DerivedData ios/App/build

# 5. Sync and run (COPYFILE_DISABLE avoids new resource forks on copy)
COPYFILE_DISABLE=1 npx cap sync ios
COPYFILE_DISABLE=1 npx cap run ios
```

To target a specific simulator without a prompt:

```bash
xcrun simctl list devices available
COPYFILE_DISABLE=1 npx cap run ios --target "<SIMULATOR-UUID>"
```

Example (iPhone 17 Pro Max):

```bash
COPYFILE_DISABLE=1 npx cap run ios --target "A443C992-4D9B-493B-8F75-DA97C7C9522A"
```

---

## If it still fails

1. **Repeat the cleanup** — iCloud may re-attach xattrs after sync.
2. **Open in Xcode** and Product → Clean Build Folder, then run again:
   ```bash
   npx cap open ios
   ```
3. **Re-run pod install** after deleting DerivedData:
   ```bash
   cd ios/App && pod install && cd ../..
   COPYFILE_DISABLE=1 npx cap sync ios
   ```
4. **Move the repo** off iCloud-synced paths (see long-term fix below).

---

## What is already in this project

Do **not** remove these — they reduce how often the error appears:

### 1. `ios/App/Podfile`

Post-install hook adds **`Strip xattrs before codesign`** to each CocoaPods target after the framework is built.

### 2. `ios/App/App.xcodeproj` (App target build phases)

Order matters:

| Order | Build phase | Purpose |
|-------|-------------|---------|
| Before embed | **Strip xattrs before codesign** | Strips xattrs on pod `.framework` files in `BUILT_PRODUCTS_DIR` **before** CocoaPods signs them |
| Embed | `[CP] Embed Pods Frameworks` | Copies and codesigns Capacitor / Cordova frameworks |
| After embed | **Strip xattrs on app bundle** | Strips xattrs on the final `App.app` |

> **Important:** The pre-embed strip phase must run **before** `[CP] Embed Pods Frameworks`. If CodeSign fails *during* embed, moving the strip phase to after embed will not fix it.

---

## Prevention

| Action | Why |
|--------|-----|
| Use `COPYFILE_DISABLE=1` before `cap sync` / `cap run` on Mac | Stops `cp` from copying resource forks into the web bundle |
| Avoid editing the project only on iCloud-synced Macs | Reduces xattr re-attachment |
| **Long-term:** clone to `~/Developer/` or another non-iCloud path | Most reliable fix for teams hitting this repeatedly |

Example long-term setup:

```bash
mkdir -p ~/Developer
git clone <repo-url> ~/Developer/fadelsoft-optical-pos
cd ~/Developer/fadelsoft-optical-pos/optical-pos-angular-capacitor-ux
```

---

## Quick reference

| Symptom | Action |
|---------|--------|
| Error on **Embed Pods Frameworks** | Run cleanup commands above |
| `npm run build` fails | Different issue — fix Angular/TypeScript errors first |
| `Could not delete ios/App/build` | `rm -rf ios/App/build ios/DerivedData` then `npx cap sync ios` |
| No simulators listed | Xcode → Settings → Platforms → download iOS runtime |

---

## Related docs

- Full iOS/Android runbook: [`mobile-run-ios-android.md`](./mobile-run-ios-android.md)
- Run entry (Web / iOS / Android): [`run.md`](./run.md)
