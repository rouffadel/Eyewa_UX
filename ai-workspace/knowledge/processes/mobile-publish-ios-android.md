---
status: active
project: optical-pos
updated: 2026-06-20
app_path: optical-pos-angular-capacitor-ux/
stack: Angular 20 + Capacitor 8
stores: Apple App Store, Google Play
---

# Publish to App Store (iOS) and Google Play (Android)

Step-by-step guide to ship **optical-pos** (Eyewa ERP) as a production native app on **iOS** and **Android**.

For local dev/simulator runs, see [`mobile-run-ios-android.md`](./mobile-run-ios-android.md).  
For iOS CodeSign xattr errors during build, see [`ios-codesign-xattr-fix.md`](./ios-codesign-xattr-fix.md).

---

## App identifiers (this project)

| Item | Value |
|------|--------|
| App root | `optical-pos-angular-capacitor-ux/` |
| Capacitor app ID | `com.ishaq.opticalpos` |
| Display name (Capacitor) | `optical-pos` |
| iOS project | `ios/App/App.xcworkspace` |
| Android project | `android/` |
| Web build output | `dist/optical-pos/browser` |
| Production config | `src/config/appsettings.prod.json` |

Update **version** before each store release:

| Platform | Where to bump |
|----------|----------------|
| **Android** | `android/app/build.gradle` → `versionCode` (integer, must increase) and `versionName` (e.g. `1.0.1`) |
| **iOS** | Xcode → App target → **General** → **Version** (`MARKETING_VERSION`) and **Build** (`CURRENT_PROJECT_VERSION`), or edit `ios/App/App.xcodeproj/project.pbxproj` |

---

## Prerequisites

### Accounts (one-time)

| Store | Requirement |
|-------|-------------|
| **Apple App Store** | [Apple Developer Program](https://developer.apple.com/programs/) membership ($99/year) |
| **Google Play** | [Google Play Console](https://play.google.com/console) developer account (one-time fee) |

### Machine / tools

| Platform | Required on |
|----------|-------------|
| **iOS publish** | macOS with **Xcode** (same as dev) |
| **Android publish** | macOS, Linux, or Windows with **Android Studio** + JDK |
| **Both** | Node.js, project dependencies (`npm install`) |

### Signing assets (one-time per app)

| Platform | Asset | Notes |
|----------|--------|--------|
| **iOS** | Distribution certificate + App Store provisioning profile | Usually managed by Xcode **Automatically manage signing** |
| **Android** | Release **keystore** (`.jks` or `.keystore`) | **Never commit** to git; store securely (password manager / CI secrets) |

---

## Phase 0 — Pre-publish checklist

Complete before building release artifacts.

- [ ] **Production API** — `src/config/appsettings.prod.json` has correct `apiUrl` and flags:
  - `useMockAuth: false`
  - `useMockPrescription: false`
  - `useMockMeasurements: false`
- [ ] **Version bumped** on Android and iOS (see table above)
- [ ] **App name / icons** — launcher icon and splash meet store guidelines (update in `ios/App/App/Assets.xcassets` and `android/app/src/main/res/` if needed)
- [ ] **Tests pass**
  ```bash
  cd optical-pos-angular-capacitor-ux
  npm test -- --watch=false --browsers=ChromeHeadless
  ```
- [ ] **Privacy / compliance** — privacy policy URL, store listing text, screenshots (required by both stores; not in repo)
- [ ] **Bundle ID / application ID** — `com.ishaq.opticalpos` matches App Store Connect and Play Console app records

---

## Phase 1 — Shared: production web build + Capacitor sync

Run from the app root **every time** you publish (after any web code change).

```bash
cd optical-pos-angular-capacitor-ux

# Install dependencies if needed
npm install

# Production Angular build (default configuration is production)
npm run build

# Sync web assets into native projects
# On Mac, use COPYFILE_DISABLE to avoid iOS codesign xattr issues:
COPYFILE_DISABLE=1 npx cap sync
```

Or sync one platform only:

```bash
COPYFILE_DISABLE=1 npx cap sync ios
npx cap sync android
```

Verify:

- `dist/optical-pos/browser/` exists and is fresh
- `ios/App/App/public/` and `android/app/src/main/assets/public/` contain the new bundle

---

## Phase 2 — Publish to Google Play (Android)

### Step 1 — Create a release keystore (first time only)

```bash
keytool -genkey -v -keystore optical-pos-release.keystore \
  -alias optical-pos \
  -keyalg RSA -keysize 2048 -validity 10000
```

Store the keystore file and passwords **outside the repo** (e.g. secure drive, CI secrets).

### Step 2 — Configure signing in Gradle

Create `android/keystore.properties` (**do not commit** — add to `.gitignore`):

```properties
storeFile=../optical-pos-release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=optical-pos
keyPassword=YOUR_KEY_PASSWORD
```

In `android/app/build.gradle`, add inside `android { }` before `buildTypes`:

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
        storePassword keystoreProperties['storePassword']
    }
}
```

And in `buildTypes { release { ... } }`:

```gradle
release {
    signingConfig signingConfigs.release
    minifyEnabled false
    proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
}
```

> If signing is not configured yet, you can still build an **unsigned** bundle for testing; Play Console requires a **signed** AAB for production.

### Step 3 — Build the release App Bundle (AAB)

Google Play requires **AAB** (not APK) for new apps.

```bash
cd optical-pos-angular-capacitor-ux/android
./gradlew bundleRelease
```

Output:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

Optional — test APK locally:

```bash
./gradlew assembleRelease
# android/app/build/outputs/apk/release/app-release.apk
```

### Step 4 — Create the app in Google Play Console (first time)

1. Open [Google Play Console](https://play.google.com/console)
2. **Create app** → fill store listing basics
3. **Package name** must be **`com.ishaq.opticalpos`** (match `applicationId`)
4. Complete required sections: store listing, content rating, target audience, privacy policy, data safety

### Step 5 — Upload to a release track

1. Play Console → your app → **Release** → **Production** (or **Internal testing** / **Closed testing** first)
2. **Create new release**
3. Upload `app-release.aab`
4. Add **Release notes**
5. Review and **Roll out**

### Step 6 — Verify on device

Install from internal test track or:

```bash
adb install app/build/outputs/apk/release/app-release.apk
```

---

## Phase 3 — Publish to Apple App Store (iOS)

### Step 1 — Register the app in App Store Connect (first time)

1. [App Store Connect](https://appstoreconnect.apple.com/) → **Apps** → **+**
2. **Bundle ID** must be **`com.ishaq.opticalpos`** (register in [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list) if missing)
3. Fill app name, SKU, primary language

### Step 2 — Open the project in Xcode

```bash
cd optical-pos-angular-capacitor-ux
npx cap open ios
```

If CodeSign fails before archive, run the [xattr cleanup](./ios-codesign-xattr-fix.md#what-to-do-fix-now) first.

### Step 3 — Configure signing (Release)

1. Select the **App** target
2. **Signing & Capabilities**
3. Check **Automatically manage signing**
4. Select your **Team** (Apple Developer account)
5. Confirm **Bundle Identifier**: `com.ishaq.opticalpos`
6. Set **Version** and **Build** (must increase build for each upload)

### Step 4 — Select “Any iOS Device” for archive

In the Xcode device dropdown, choose **Any iOS Device (arm64)** — not a simulator.

### Step 5 — Archive

1. Menu **Product** → **Archive**
2. Wait for build to finish
3. **Organizer** window opens with the archive

If archive fails on **Embed Pods Frameworks**, see [`ios-codesign-xattr-fix.md`](./ios-codesign-xattr-fix.md).

### Step 6 — Upload to App Store Connect

1. In Organizer, select the archive → **Distribute App**
2. **App Store Connect** → **Upload**
3. Follow prompts (signing, symbols, etc.)
4. Wait for processing in App Store Connect (often 5–30 minutes)

### Step 7 — Submit for review

1. App Store Connect → your app → **TestFlight** (optional beta) or **App Store** tab
2. Select the uploaded **build**
3. Complete **App Review** information (screenshots, description, privacy, export compliance)
4. **Submit for Review**

### Step 8 — TestFlight (recommended before production)

1. App Store Connect → **TestFlight**
2. Add internal/external testers
3. Install via TestFlight app on iPhone/iPad
4. After validation, promote same build to **App Store** release

---

## Phase 4 — Post-publish

- [ ] Smoke-test installed production app (login, prescription, measurements, navigation)
- [ ] Confirm production API calls (not mock auth)
- [ ] Tag release in git (optional): `v1.0.1`
- [ ] Document release notes for the team

---

## Quick command reference

| Goal | Command |
|------|---------|
| Prod web build | `npm run build` |
| Sync both platforms | `COPYFILE_DISABLE=1 npx cap sync` |
| Android AAB | `cd android && ./gradlew bundleRelease` |
| Open Xcode | `npx cap open ios` |
| Open Android Studio | `npx cap open android` |

---

## Troubleshooting

| Issue | Doc / action |
|-------|----------------|
| iOS `resource fork` / CodeSign on embed | [`ios-codesign-xattr-fix.md`](./ios-codesign-xattr-fix.md) |
| Android Gradle / sync errors | [`mobile-run-ios-android.md`](./mobile-run-ios-android.md#android-troubleshooting) |
| Upload rejected — version not incremented | Bump `versionCode` (Android) or `CURRENT_PROJECT_VERSION` (iOS) |
| Wrong API in production app | Rebuild with `appsettings.prod.json`; confirm hostname is not `localhost` |

---

## Related docs

- [`run.md`](./run.md) — dev run (Web / iOS / Android)
- [`mobile-run-ios-android.md`](./mobile-run-ios-android.md) — simulators, devices, config
- [`ios-codesign-xattr-fix.md`](./ios-codesign-xattr-fix.md) — Mac/iCloud codesign fix

---

## Checklist summary (copy for each release)

```
[ ] Bump Android versionCode + versionName
[ ] Bump iOS MARKETING_VERSION + CURRENT_PROJECT_VERSION
[ ] Verify appsettings.prod.json
[ ] npm test
[ ] npm run build
[ ] COPYFILE_DISABLE=1 npx cap sync
[ ] Android: ./gradlew bundleRelease → upload AAB to Play Console
[ ] iOS: Xcode Archive → Upload → Submit (or TestFlight first)
[ ] Post-release smoke test on real devices
```
