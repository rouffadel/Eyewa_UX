---
feature: common-components
status: in-progress
owner: 
created: 2026-06-18
updated: 2026-06-28
source: raw-knowledge/files/POSScreen.png
reference: Eyewa POS shell — tablet header + bottom navigation
used_by: poc-landing and future POS features
primary_target: tablet (iPad / Android tablet)
---

# Feature: Common shell components (index)

## Summary

Reusable **POS shell components** for the Eyewa ERP Capacitor app: **tablet ERP header**, **profile page**, **bottom navigation**, and **POS shell composition**. Each component has its own spec under [`components/`](./components/).

Post-login only — login styling remains in [`001-staff-login`](../001-staff-login/spec.md).

## Component registry

| Component | Spec | Status | Primary files |
|-----------|------|--------|---------------|
| **App header** | [`components/app-header/spec.md`](./components/app-header/spec.md) | **Done** | `shared/ui/app-header/*` |
| **Profile page** | [`components/profile-page/spec.md`](./components/profile-page/spec.md) | **Done** | `features/pos/profile/*` |
| **Bottom navigation** | [`components/bottom-nav/spec.md`](./components/bottom-nav/spec.md) | **Done** | `shared/ui/bottom-nav/*` |
| **POS shell** | [`components/pos-shell/spec.md`](./components/pos-shell/spec.md) | **Done** | `features/pos/shell/*` |

## Implementation status (rollup)

| Area | Spec | Status |
|------|------|--------|
| Tablet ERP header layout | [app-header](./components/app-header/spec.md) | **Done** |
| Header auth binding (name, initials, loyalty) | [app-header](./components/app-header/spec.md) | **Done** |
| Store dropdown (FillStore API) | [app-header](./components/app-header/spec.md) | **Done** |
| Header customer search (`customersearchfilter`) | [app-header](./components/app-header/spec.md) | **Done** |
| Bearer token on API calls | [`001-staff-login`](../001-staff-login/spec.md) `authInterceptor` | **Done** |
| **+ New Customer** → create customer screen | [app-header](./components/app-header/spec.md) + [`006`](../006-create-customer/spec.md) | **Done** |
| Profile page (sign out, account details) | [profile-page](./components/profile-page/spec.md) | **Done** |
| Bottom navigation (five tabs) | [bottom-nav](./components/bottom-nav/spec.md) | **Done** |
| Shell composition (header + outlet + nav) | [pos-shell](./components/pos-shell/spec.md) | **Done** |
| Notification panel | [app-header](./components/app-header/spec.md) | Planned |

## Reference

![Eyewa POS reference](../../raw-knowledge/files/POSScreen.png)

Related inventory: [`knowledge/architecture/pos-dashboard-components.md`](../../knowledge/architecture/pos-dashboard-components.md)

## Shared design tokens

Add to `src/styles.css` (extends login tokens from `001-staff-login`):

| Token | Usage |
|-------|--------|
| `--color-header-bg` | Header background — dark navy (`#1e293b`) |
| `--color-header-text` | Header logo and labels — white |
| `--color-pos-accent` | POS label, + New Customer, links — blue (`#2563eb`) |
| `--color-header-search-bg` | Search field — white |
| `--color-loyalty-positive` | Loyalty points — green (`#16a34a`) |
| `--color-notification-badge` | Bell badge — red |
| `--color-nav-bg` | Bottom nav — white |
| `--color-nav-border` | Bottom nav top border — light grey |
| `--color-nav-active` | Active tab icon, label, indicator — blue |
| `--color-nav-inactive` | Inactive tab — grey |
| `--header-height-app-bar` | App bar height (~56–72px) |
| `--bottom-nav-height` | Bottom nav height (~56–64px) |
| `--breakpoint-tablet` | Wide tablet threshold — `768px` |
| `--breakpoint-tablet-portrait-min` | Narrow tablet portrait min width — `600px` |
| `--breakpoint-tablet-portrait-height` | Narrow tablet portrait min height — `700px` |
| `--breakpoint-phone-max` | Phone max width — `599px` |
| `--breakpoint-tablet-wide` | Wide tablet padding/grid tuning — `1024px` |

## Responsive breakpoints (canonical)

All POS shell and Sell features share one breakpoint strategy. CSS variables above document the values; **media queries repeat the pixel literals** (CSS does not allow `var()` inside `@media`).

### Why two tablet paths?

Android tablets (e.g. **Nokia T20 10.4"**, 1200×2000 px) often report a **~600 px CSS viewport width** in portrait because of device pixel ratio. A single `min-width: 768px` rule would incorrectly show the **phone stacked layout** on a large tablet.

### Tablet layout

Apply tablet layout when **either**:

- `(min-width: 768px)` — iPad, landscape tablets, wide Android tablets
- `(min-width: 600px) and (min-height: 700px)` — tall portrait tablets with narrow CSS width (Nokia T20, many 10" Android tablets)

### Phone layout

Apply phone layout when **either**:

- `(max-width: 599px)` — typical phones in portrait
- `(max-width: 767px) and (max-height: 699px)` — phones in landscape (avoids false tablet detection)

### Container queries (card-level)

Where a card sits inside a narrow dashboard column, use **`container-type: inline-size`** on the card root and `@container` rules so grids adapt to **column width**, not only viewport width. Used by product catalog and payment cards on the Sell dashboard.

### Reference viewports (manual QA)

| Device / size | CSS viewport (approx.) | Expected layout |
|---------------|------------------------|-----------------|
| iPhone portrait | 375×667 | Phone stack |
| iPhone landscape | 667×375 | Phone stack |
| Nokia T20 portrait | 600×1000 | Tablet (3-column Sell grid) |
| Nokia T20 landscape | 1200×750 | Tablet (3-column Sell grid) |
| iPad / 1024×768 | 1024×768 | Tablet (full ERP header + 3-column Sell) |

### Adoption status

| Feature | Canonical breakpoints | Notes |
|---------|----------------------|-------|
| Sell dashboard, shell header, login | **Done** | Media + container queries |
| Prescription, measurements, create customer | **Pending** | Still use `min-width: 768px`; align to canonical rules |

## Shared requirements

### Functional

- Authenticated POS shell only; no login chrome here
- **Tablet-first** layout per `POSScreen.png` on all breakpoints
- Store list from [`001-staff-login`](../001-staff-login/spec.md) `FillStore` API
- Create customer flow from header → [`006-create-customer`](../006-create-customer/spec.md)

### Visual / UI

- Match reference **header and bottom nav**
- CSS variables only — no Material/Bootstrap theme leakage

### Non-functional

- Capacitor iOS/Android safe areas (portrait and landscape)
- Layout reflow without clipping fixed chrome
- `viewport-fit=cover` and `env(safe-area-inset-*)` on header and bottom nav

### Keyboard (native)

| Android | Mechanism |
|---------|-----------|
| **9–10** | `adjustPan` in `MainActivity`; `KeyboardViewportService` sets `android-legacy-kb` + `keyboard-open` on input focus |
| **11+** | `adjustResize`; Capacitor `keyboardWillShow`/`Hide` → `keyboard-open` |
| **All** | `html.keyboard-open` hides bottom nav; `--shell-chrome-bottom: 0` |

Login has additional compact CSS under `html.android-legacy-kb.keyboard-open` ([`001-staff-login`](../001-staff-login/spec.md)). Full matrix: [`knowledge/platform-support.md`](../../knowledge/platform-support.md).

## Out of scope (all components)

- Notification panel implementation
- Create customer form / API ([`006-create-customer`](../006-create-customer/spec.md))
- “More” tab menu contents
- Login screen header ([`001-staff-login`](../001-staff-login/spec.md))
- Feature tab content (Sell, Prescription, etc.)

## Dependencies

- [`001-staff-login`](../001-staff-login/) — session, `FillStore`, base tokens
- [`006-create-customer`](../006-create-customer/) — screen opened from header **+ New Customer**
- [`knowledge/architecture/pos-dashboard-components.md`](../../knowledge/architecture/pos-dashboard-components.md)

## Verification (end-to-end)

```bash
cd optical-pos-angular-capacitor-ux
npm start
# Login: Canada / a1b2c3d4
# /home/sell → header + bottom nav visible
# Left avatar → profile (no bottom nav)
# Right profile block → store dropdown
# + New Customer → /home/createcustomer (chrome hidden)
# Header search → type mobile → select result → Sell customer card updates
# Bottom tabs switch Sell / Prescription / Measurements / Delivery / More
# Nokia T20 portrait (~600×1000): Sell tab shows 3-column tablet grid, not phone stack
```

## Open questions (shared)

- [ ] Exact hex for header navy and POS blue — sample from PNG or brand guide?
- [x] Hide bottom nav on keyboard open? **Done** — `html.keyboard-open` in `styles.css` via `KeyboardViewportService` (Capacitor events on Android 11+ / iOS; input focus on Android 9–10)
- [ ] Barcode scan wired to Capacitor plugin in POC+?

## Implementation plan

[`plan.md`](./plan.md)
