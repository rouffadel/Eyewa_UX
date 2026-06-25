---
status: active
project: optical-pos
updated: 2026-06-18
app_path: optical-pos-angular-capacitor-ux/
trigger: run the app | launch app | start app | run ios | run android
---

# Run the app

Entry playbook for **optical-pos**. Use this file whenever the user asks to run, launch, or start the application.

## Step 1 — Ask platform (required)

**If the user did not already specify a platform, ask before running anything.**

Present this choice:

| Option | When to use |
|--------|-------------|
| **Web** | Fastest UI check in browser (`localhost:4200`) |
| **iOS** | iPhone/iPad simulator or device via Capacitor + Xcode |
| **Android** | Emulator or device via Capacitor + Android Studio |

Example prompt to the user:

> Where do you want to run the app?
> - **Web** — dev server in browser
> - **iOS** — simulator or device
> - **Android** — emulator or device

Do **not** guess. Do **not** start a platform until the user picks one (unless they explicitly said e.g. “run for ios”).

## Step 2 — Run the chosen platform

All commands run from:

```bash
cd optical-pos-angular-capacitor-ux
```

### Web

```bash
npm start
```

Open **http://localhost:4200/**

No `npm run build` or `cap sync` needed for web-only dev.

### iOS

```bash
npm run build
COPYFILE_DISABLE=1 npx cap sync ios
COPYFILE_DISABLE=1 npx cap run ios
```

- If multiple simulators exist, list them with `xcrun simctl list devices available` and either let the user pick or pass `--target "<UDID>"`.
- Alternative: `npx cap open ios` and Run (▶) in Xcode.

Full iOS/Android details and troubleshooting: [`mobile-run-ios-android.md`](./mobile-run-ios-android.md)

### Android

```bash
npm run build
npx cap sync android
npx cap run android
```

- If multiple devices/emulators exist, let the user pick from `adb devices` output or the Capacitor prompt.
- Alternative: `npx cap open android` and Run (▶) in Android Studio.

Full details: [`mobile-run-ios-android.md`](./mobile-run-ios-android.md)

## Step 3 — After web code changes (native only)

**Fast path (recommended for UI work):** use [live reload](./mobile-run-ios-android.md#live-reload-fastest-native-dev) — `npm run start:mobile` in one terminal and `npm run ios:live` / `npm run android:live` in another. No rebuild per save.

**Standard path:** rebuild bundled assets before running again:

```bash
npm run build
COPYFILE_DISABLE=1 npx cap sync    # or cap sync ios / cap sync android
```

Then re-run the native target from Step 2.

## Mock login (dev)

When `src/config/appsettings.json` has `"useMockAuth": true`:

| Field | Value |
|-------|--------|
| Username / email | `staff@eyewa.com` |
| Password | `demo1234` |

## Agent checklist

- [ ] Platform specified or user was asked (Web / iOS / Android)
- [ ] Working directory is `optical-pos-angular-capacitor-ux/`
- [ ] Native: `npm run build` before `cap sync` / `cap run`
- [ ] iOS on Mac: use `COPYFILE_DISABLE=1` for sync/run
- [ ] On CodeSign or build errors: [`ios-codesign-xattr-fix.md`](./ios-codesign-xattr-fix.md) (resource fork / xattr) or [`mobile-run-ios-android.md`](./mobile-run-ios-android.md)

## Related

- [`mobile-run-ios-android.md`](./mobile-run-ios-android.md) — prerequisites, troubleshooting, config
- [`mobile-publish-ios-android.md`](./mobile-publish-ios-android.md) — App Store & Google Play release steps
- [`ios-codesign-xattr-fix.md`](./ios-codesign-xattr-fix.md) — iOS CodeSign “resource fork” / xattr error
- [`../architecture/pos-dashboard-components.md`](../architecture/pos-dashboard-components.md) — UI architecture
