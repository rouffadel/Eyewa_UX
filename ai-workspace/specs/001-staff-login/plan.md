---
feature: staff-login
status: in-progress
spec: ./spec.md
project: optical-pos
updated: 2026-06-28
---

# Implementation plan — Staff login

## Spec reference

- Feature spec: [`specs/001-staff-login/spec.md`](./spec.md)
- Visual reference: [`raw-knowledge/files/EyewaLogin.png`](../../raw-knowledge/files/EyewaLogin.png)

## Goal

Deliver a form-only login screen in `optical-pos` that matches the Eyewa reference (right panel) for layout, copy, colors, and control styling. Wire routing and form behavior; integrate real auth APIs when the identity service is available.

## Current status

| Phase | Status | Notes |
|-------|--------|--------|
| 1 — UI shell | **Complete** | Login form, tokens, validation, password toggle |
| 2 — Navigation | **Complete** | `/forgot-password`, `/otp-login`, `/home` stubs; mock auth |
| **3 — Auth API integration** | **Complete** | Eyewa `VerifyUserLogin`, JWT, `FillStore`, auth guard |
| **3c — Tablet keyboard layout** | **Complete** | Compact layout when IME open; Android 9–10 `adjustPan`; Android 11+ `adjustResize` |
| 4 — OTP & recovery | Planned | Depends on identity API OTP endpoints |

**App path:** `optical-pos-angular-capacitor-ux/`  
**Mock login (dev):** `staff@eyewa.com` / `demo1234` when `useMockAuth: true`

## Technical approach

### Architecture

Use a **standalone Angular feature** with no UI component library defaults exposed to the user. Styling is custom CSS with design tokens—no Material/Bootstrap theme leakage.

```
optical-pos/src/
├── styles.css                          # Global tokens + Inter font
├── app/
│   ├── app.ts / app.html               # Shell: router-outlet only
│   ├── app.routes.ts                   # /login default, /home guarded
│   └── features/
│       └── auth/
│           ├── login/
│           │   ├── login.component.ts
│           │   ├── login.component.html
│           │   └── login.component.css
│           ├── forgot-password/          # Phase 2 — route stub in Phase 1
│           ├── otp-login/                # Phase 2 — route stub in Phase 1
│           ├── services/
│           │   └── auth.service.ts
│           └── models/
│               └── login-credentials.ts
```

### Phased delivery

| Phase | Scope | Outcome | Status |
|-------|--------|---------|--------|
| **1 — UI shell** | Layout, tokens, static form, validation, password toggle | Pixel-matched login screen; no backend | **Done** |
| **2 — Navigation** | Routes for forgot password, OTP, contact admin | Links navigate; placeholder screens | **Done** |
| **3 — Auth API integration** | Real API, remember-me, session storage, auth guard | Production sign-in against identity service | **Next** |
| **4 — OTP & recovery** | OTP send/verify, password reset flows | Full stories 3–4 complete | Planned |

Phases 1–2 shipped as **MVP** (visual + mock auth). **Phase 3 is the immediate next step** after login screen sign-off.

### Design tokens

Define CSS variables in `styles.css` (values sampled from `EyewaLogin.png`):

```css
:root {
  --color-primary: /* purple — sample from reference */;
  --color-text-heading: /* dark grey */;
  --color-text-body: /* medium grey */;
  --color-text-muted: /* light grey */;
  --color-border: /* input border */;
  --color-surface: #ffffff;
  --radius-input: 8px;
  --radius-button: 8px;
  --font-family: 'Inter', system-ui, sans-serif;
  --form-max-width: 440px;
  --input-height: 48px;
  --button-height: 48px;
}
```

Load Inter via `index.html` (Google Fonts or self-hosted). All login styles reference tokens only—no hard-coded one-off colors in the component.

### Login component

- **Reactive form** (`FormGroup`): `identifier`, `password`, `rememberMe`
- **Validators**: required on identifier and password; optional email format hint (single field accepts username or email per spec)
- **Password visibility**: component signal `hidePassword`; toggle swaps `type="password"` / `type="text"` and icon
- **Submit**: disable button while pending; call `AuthService.login()`; show generic error on failure
- **Template**: semantic HTML (`form`, `label`, `button`); icons as inline SVG matching reference weight/size

### Routing

| Path | Component | Notes |
|------|-----------|--------|
| `/login` | `LoginComponent` | Default route; redirect `/` → `/login` |
| `/home` | Placeholder dashboard | Post-login destination (temporary) |
| `/forgot-password` | Stub | Phase 2 |
| `/otp-login` | Stub | Phase 2 |

Auth guard on `/home` deferred until `AuthService` has session state (Phase 3).

### Auth service (Phase 3 stub in Phase 1)

```typescript
interface LoginCredentials {
  identifier: string;
  password: string;
  rememberMe: boolean;
}

// Phase 1: mock delay + console log
// Phase 3: POST /auth/login, store token, respect rememberMe
```

Until the API exists, use an environment flag `useMockAuth: true` and accept a documented test credential for QA only.

### Secondary actions (Phase 1 behavior)

| Action | Phase 1 | Phase 2+ |
|--------|---------|----------|
| Forgot Password? | `routerLink` → `/forgot-password` | Full recovery flow |
| Login with OTP | `routerLink` → `/otp-login` | OTP send/verify UI |
| Contact administrator | `mailto:` or `href` TBD | Config-driven support URL |

### Mobile (Capacitor)

- Full-viewport white background; safe-area padding via `env(safe-area-inset-*)`
- Input font-size ≥ 16px on iOS to prevent zoom-on-focus
- Verify on iOS/Android simulators after web sign-off

### Tablet keyboard (Phase 3c — **done**)

**Problem:** On Android tablets (especially **Exceed EX8S1**, Android 10), opening the IME left a large white gap and pushed **Sign In** off-screen. See [`raw-knowledge/issues/issues.jpeg`](../../raw-knowledge/issues/issues.jpeg).

**Fix (verified on Exceed EX8S1):**

| Layer | Android 9–10 (API ≤ 29) | Android 11+ / iOS |
|-------|-------------------------|-------------------|
| **Native** | `MainActivity`: `SOFT_INPUT_ADJUST_PAN` | `SOFT_INPUT_ADJUST_RESIZE` |
| **JS** | `KeyboardViewportService`: `android-legacy-kb` + `focusin`/`focusout` → `keyboard-open` | Capacitor `keyboardWillShow`/`Hide` → `keyboard-open` |
| **Login CSS** | `html.android-legacy-kb.keyboard-open`: `position: fixed; inset: 0`; scroll; hide OTP/footer | `:host-context(html.keyboard-open)` compact rules |
| **Avoid** | `--app-height`, `visualViewport` math, `scrollIntoView` — caused white flash | — |

**Global:** `html.keyboard-open` hides bottom nav (`styles.css`).

**QA:** `npm run build` → `npx cap sync android` → reinstall APK. Focus password on device; no white gap; Sign In reachable.

## Components affected

| Area | Path | Change type |
|------|------|-------------|
| App shell | `optical-pos/src/app/app.html` | Replace Angular starter with `<router-outlet>` |
| App component | `optical-pos/src/app/app.ts` | Remove starter logic |
| Routes | `optical-pos/src/app/app.routes.ts` | Add login + stubs |
| Global styles | `optical-pos/src/styles.css` | Design tokens, reset, font |
| Document | `optical-pos/src/index.html` | Inter font, page title |
| Login feature | `optical-pos/src/app/features/auth/login/*` | Compact keyboard layout (CSS-driven) |
| Keyboard service | `src/app/services/keyboard-viewport.service.ts` | `keyboard-open`; Android 9–10 focus listeners |
| MainActivity | `android/.../MainActivity.java` | `adjustPan` (API ≤ 29) / `adjustResize` (API 30+) |
| Android manifest | `android/app/src/main/AndroidManifest.xml` | Default `adjustResize`; overridden in `MainActivity` per API |
| Auth service | `optical-pos/src/app/features/auth/services/auth.service.ts` | **New** |
| Unit tests | `login.component.spec.ts` | Form validation, toggle, submit |

## Data model

No persistent entities in the client for Phase 1. Phase 3 session model:

| Field | Storage | When |
|-------|---------|------|
| Access token | `sessionStorage` or `localStorage` | `rememberMe` false / true |
| User display name | Memory / session | After login response |

See `data-model.md` if auth API response shape is defined before implementation.

## API / contracts

Draft contract for Phase 3 — **publish to `ai-workspace/contracts/openapi/` before implementation merges.**

### `POST /auth/login`

| | |
|--|--|
| **URL** | `{apiUrl}/auth/login` |
| **Body** | `{ "identifier": string, "password": string }` |
| **Success 200** | `{ "accessToken": string, "displayName"?: string, "user"?: { "name": string } }` |
| **Failure 401** | Generic invalid credentials (client shows single error message) |
| **Config** | `apiUrl` from `src/config/appsettings.json` via `AppConfigService` |

Related endpoints (Phase 4):

- `POST /auth/otp/request` — identifier → challenge id
- `POST /auth/otp/verify` — challenge id, code → token
- `POST /auth/password/forgot` — identifier → acknowledgment

Login UI must not hard-code URLs; use `AppConfigService.settings.apiUrl`.

## Implementation steps

### Step 1 — Foundation
1. Strip Angular starter content from `app.html` / `app.ts`
2. Add design tokens and base resets to `styles.css`
3. Add Inter font to `index.html`
4. Configure routes: `/` → `/login`, `/login`, `/home` placeholder

### Step 2 — Login UI
1. Generate `LoginComponent` (standalone)
2. Build template per spec Copy table and Visual design section
3. Implement input groups with left icons and password toggle
4. Style Remember me / Forgot Password row
5. Style Sign In (primary), divider, Login with OTP (outlined)
6. Add footer link and “Powered by Fadel” watermark
7. Center form; max-width ~440px; responsive padding

### Step 3 — Form behavior
1. Reactive form + validators
2. Submit handler with loading state
3. Generic error message below form on failure
4. Enter key submits form

### Step 4 — Stub navigation
1. `ForgotPasswordComponent` — “Coming soon” or minimal placeholder
2. `OtpLoginComponent` — placeholder
3. Wire `routerLink` / clicks from login

### Step 5 — Visual QA
1. Side-by-side screenshot compare with `EyewaLogin.png` (form panel)
2. Adjust tokens until spacing, colors, and radii match
3. Check breakpoints: 375px phone, 768px tablet, ~600×1000 Nokia T20 portrait (split card visible)

### Step 6 — Auth API integration (Phase 3 — **next**)

Prerequisite: OpenAPI contract for identity service in `ai-workspace/contracts/openapi/`.

1. Confirm `POST /auth/login` request/response shape with backend team
2. Add contract file (e.g. `auth-login.yaml`) under `contracts/openapi/`
3. Harden `AuthService.apiLogin()`:
   - Use `HttpClient` (preferred) or `fetch` with typed response model
   - Map API errors to generic UI message (no credential hints)
   - Handle network failures and timeouts
4. Implement `authGuard` on `/home`; redirect unauthenticated users to `/login`
5. Optional: redirect authenticated users away from `/login` to `/home`
6. Add HTTP interceptor to attach `Authorization: Bearer {token}` on API calls (stub if no APIs yet)
7. Verify remember-me: `sessionStorage` when unchecked, `localStorage` when checked
8. Set `useMockAuth: false` in `appsettings.prod.json`; keep `true` in dev `appsettings.json`
9. Remove or gate mock credentials from production builds
10. Manual QA on web + Capacitor against staging API
11. Unit tests: `AuthService` API path (mock `HttpClient`), auth guard behavior

**Existing stub:** `AuthService` already calls `{apiUrl}/auth/login` when `useMockAuth` is false. Phase 3 validates the contract, adds guard/interceptor, and completes error handling + tests.

### Step 7 — OTP & recovery (follow-up)
1. Implement flows per stories 3–4
2. Add contracts and error handling
3. Rate-limit UI feedback for OTP resend

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Purple/grey values drift from reference | Sample hex from PNG once; lock in CSS variables; screenshot diff in QA |
| No auth API blocks end-to-end login | Mock service + env flag; clear Phase 3 boundary in PR |
| Default Angular styles bleed through | No Material imports; scoped component CSS; global reset |
| OTP/recovery scope creep | Phase 1 ships UI + stubs only; separate specs if flows grow |
| iOS keyboard/layout issues | Test Capacitor early; 16px inputs; safe-area padding |
| Tablet keyboard hides Sign In | Android 9–10: `adjustPan` + `android-legacy-kb` login CSS; Android 11+: `adjustResize` + Capacitor — see [`issues.jpeg`](../../raw-knowledge/issues/issues.jpeg), [`platform-support.md`](../../knowledge/platform-support.md) |

## Test strategy

### Unit (`login.component.spec.ts`)
- Form invalid when fields empty
- Submit blocked when invalid
- Password toggle changes input type
- Remember me defaults to unchecked
- Submit calls `AuthService.login` with form values

### Manual / visual
- [ ] Compare against `EyewaLogin.png` — colors, fonts, spacing, icons
- [ ] All copy strings match spec Copy table
- [ ] Tab order: identifier → password → remember → forgot → sign in → OTP
- [ ] Mobile viewport: no horizontal scroll; tap targets ≥ 44px
- [ ] Capacitor iOS/Android smoke test
- [x] Tablet + keyboard: Sign In visible/scrollable; no large gap (Exceed EX8S1 Android 10 verified)

### E2E (later)
- Successful login redirects to `/home`
- Invalid credentials show generic error
- Unauthenticated access to `/home` redirects to `/login`

## Rollout

1. **Dev** — Merge login UI + mock auth; internal visual review against reference
2. **Staging** — Connect staging identity API; QA full sign-in path
3. **Production** — Enable auth guard; disable mock; monitor login error rates

## Open questions (resolve before Phase 3)

| Question | Impact | Default for MVP |
|----------|--------|-----------------|
| OTP channel (SMS vs email) | OTP screen design | Stub route only |
| Username vs email validation | Form validator | Single text field, required only |
| Remember-me duration | Storage TTL | 30 days localStorage if checked |
| Post-login route | Router config | `/home` placeholder |
| Contact administrator URL | Footer link | `mailto:support@fadelsoft.com` or config |

## Definition of done (MVP — Phase 1–2) ✅

- [x] Login route is app entry point
- [x] UI matches spec Visual design and Copy table
- [x] Form validation and password toggle work
- [x] Forgot password, OTP, and contact admin links navigate
- [x] “Powered by Fadel” watermark visible
- [x] No left branding panel
- [x] Unit tests pass for login component
- [ ] Manual visual check signed off against `EyewaLogin.png`

## Definition of done (Phase 3 — Auth API integration)

- [ ] OpenAPI contract for `POST /auth/login` in `contracts/openapi/`
- [ ] `AuthService` calls real API when `useMockAuth: false`
- [ ] Remember-me persists token in correct storage
- [ ] Auth guard protects `/home`; unauthenticated users sent to `/login`
- [ ] Generic error on failed login; safe message on network failure
- [ ] `appsettings.prod.json` has `useMockAuth: false`
- [ ] Staging QA: valid/invalid credentials, remember-me on/off
- [ ] Unit tests for API login path and auth guard
