---
feature: common-components
status: in-progress
owner: 
created: 2026-06-18
updated: 2026-06-24
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
```

## Open questions (shared)

- [ ] Exact hex for header navy and POS blue — sample from PNG or brand guide?
- [ ] Hide bottom nav on keyboard open?
- [ ] Barcode scan wired to Capacitor plugin in POC+?

## Implementation plan

[`plan.md`](./plan.md)
