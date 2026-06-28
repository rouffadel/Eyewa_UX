---
status: active
project: Eyewa ERP (optical-pos)
updated: 2026-06-28
app_path: optical-pos-angular-capacitor-ux/
---

# Platform & version support

Canonical reference for **which OS versions, devices, and runtimes** Eyewa ERP POS supports. Update this file when `minSdk`, iOS deployment target, or Capacitor major versions change.

**Source of truth in code:**

| Setting | File |
|---------|------|
| Android `minSdk` / `targetSdk` / `compileSdk` | `optical-pos-angular-capacitor-ux/android/variables.gradle` |
| Android orientation & IME | `android/app/src/main/AndroidManifest.xml`, `android/app/src/main/java/.../MainActivity.java` |
| iOS minimum version | `optical-pos-angular-capacitor-ux/ios/App/App.xcodeproj/project.pbxproj` (`IPHONEOS_DEPLOYMENT_TARGET`) |
| iOS orientations | `ios/App/App/Info.plist` |
| Capacitor & npm stack | `optical-pos-angular-capacitor-ux/package.json`, `capacitor.config.ts` |
| Keyboard legacy (Android 9–10) | `MainActivity.java` (`adjustPan`), `keyboard-viewport.service.ts`, `login.component.css` |

---

## Summary

| Platform | Minimum | Target / compile | Primary use |
|----------|---------|------------------|-------------|
| **Android** | API **26** (Android **8.0**) | API **36** (compile & target) | **POS tablets** — landscape |
| **iOS / iPadOS** | **15.0** | Latest Xcode SDK | POS tablets — landscape |
| **Web** | Modern evergreen browsers | — | Dev (`ng serve`), optional browser access |

**Product focus:** tablet POS in **landscape** (8" Android tablets, 10" Android tablets such as Nokia T20, iPad). Phone layouts exist in CSS but are not the primary deployment target.

---

## Android

### Supported versions

| Android version | API level | Support | Notes |
|-----------------|-----------|---------|-------|
| 8.0 Oreo | 26 | **Minimum** | `minSdkVersion = 26` |
| 8.1 | 27 | Supported | |
| 9 Pie | 28 | Supported | Keyboard: **`adjustPan`** + `android-legacy-kb` (see below) |
| 10 | 29 | Supported | **`adjustPan`** — verified on Exceed EX8S1 |
| 11+ | 30+ | Supported | **`adjustResize`** + Capacitor keyboard listeners |
| 15+ | 35+ | Supported | Test after OS upgrades; edge-to-edge behavior differs from API 29 |

Versions **below API 26** are **not** installable from Google Play or sideload builds using the current Gradle config.

### Native configuration (current)

- **App ID:** `com.ishaq.opticalpos`
- **Orientation:** landscape only (`sensorLandscape` in manifest; `SCREEN_ORIENTATION_SENSOR_LANDSCAPE` in `MainActivity`)
- **Keyboard:** API ≤ 29 → `adjustPan` in `MainActivity`; API 30+ → `adjustResize`. Manifest default `adjustResize|stateHidden`.
- **JDK:** Java **21** (Capacitor Android build)
- **Cleartext HTTP:** enabled (`usesCleartextTraffic="true"`) for dev/live-reload; review before production hardening

### Keyboard behavior by Android version

| Android | Mechanism |
|---------|-----------|
| **9–10** | **`SOFT_INPUT_ADJUST_PAN`** (native). JS adds `android-legacy-kb` + `keyboard-open` on input focus. Login uses fixed full-screen scroll layout — **no `--app-height` math** (resize/pan hacks caused white flash on Exceed) |
| **11+** | **`adjustResize`** + Capacitor `keyboardWillShow/Hide` → `keyboard-open`; bottom nav hidden; standard `100dvh` / flex scroll |
| **All native** | `html.keyboard-open` hides bottom nav |

### QA reference devices

| Device class | Example | Specs | Priority |
|--------------|---------|-------|----------|
| **8" landscape POS tablet** | **Exceed EX8S1 (Magna)** | Android **10**, **1280×800**, landscape ~800px CSS height; budget WebView often reports `keyboardHeight: 0` | **P0** |
| 8" landscape tablet | Generic store hardware | Android 10, landscape | **P0** |
| 10" Android tablet | Nokia T20 | ~600×1000 CSS portrait; landscape for POS | P1 |
| 7" Android tablet | Exceed EX7X4 | Android 10, **1024×600** — very short in landscape (~600px height); forms need scroll | P2 |
| Phone | — | Layout stacks; not primary POS target | P3 |

**Exceed EX8S1 keyboard note:** `adjustResize` + JS viewport height caused white screen after ~1s. **Working fix:** native `adjustPan` (API ≤ 29) + compact login CSS under `html.android-legacy-kb.keyboard-open`. Deploy with `npm run build` → `npx cap sync android` → reinstall APK.

---

## iOS / iPadOS

### Supported versions

| iOS / iPadOS | Support |
|--------------|---------|
| **15.0+** | **Minimum** (`IPHONEOS_DEPLOYMENT_TARGET = 15.0`) |
| 16, 17, 18+ | Supported |

### Native configuration (current)

- **Orientations:** landscape left & right only (iPhone and iPad in `Info.plist`)
- **Keyboard:** Capacitor `Keyboard.setResizeMode({ mode: 'body' })`, scroll assist disabled
- **Safe areas:** `viewport-fit=cover` + `env(safe-area-inset-*)` in shell CSS

**Build requirement:** macOS + Xcode. See [`processes/mobile-run-ios-android.md`](processes/mobile-run-ios-android.md).

---

## Web (browser)

| Context | Support |
|---------|---------|
| `ng serve` / dev | Chrome, Edge, Safari (current versions) |
| Production web | Not the primary POS delivery channel; layout works but **native keyboard CSS** (`keyboard-open`) applies only on Capacitor |

Use `npm run start:mobile` for mobile-oriented dev configuration when testing responsive breakpoints in the browser.

---

## Application stack versions

Pinned in `package.json` (approximate; see lockfile for exact resolves):

| Component | Version |
|-----------|---------|
| Angular | **20.1.x** |
| TypeScript | **5.8.x** |
| Capacitor (`core`, `android`, `ios`, `cli`) | **8.4.x** |
| `@capacitor/keyboard` | **8.0.x** |
| `@capacitor/barcode-scanner` | **3.0.x** |
| Zone.js | **0.15.x** |

---

## Responsive layout (CSS, all platforms)

Canonical breakpoints: [`specs/002-common-components/spec.md`](../specs/002-common-components/spec.md#responsive-breakpoints-canonical)

| Layout | Media rule (simplified) |
|--------|-------------------------|
| **Tablet** | `min-width: 768px` **or** `min-width: 600px` and `min-height: 500px` (landscape-native) |
| **Phone** | Narrow width or short height (landscape phones excluded from tablet rules) |

---

## Out of scope / non-goals

- Android **7.x and below** (API &lt; 26)
- iOS **14 and below**
- Portrait-primary POS workflow (app is locked to landscape on native)
- React Native / Expo (stack remains **Angular + Capacitor**)

---

## Related docs

- Run app: [`processes/run.md`](processes/run.md)
- Native build & troubleshoot: [`processes/mobile-run-ios-android.md`](processes/mobile-run-ios-android.md)
- Publish: [`processes/mobile-publish-ios-android.md`](processes/mobile-publish-ios-android.md)
- Login keyboard (Android 10): [`specs/001-staff-login/spec.md`](../specs/001-staff-login/spec.md)
- Shell / tablet breakpoints: [`specs/002-common-components/spec.md`](../specs/002-common-components/spec.md)
