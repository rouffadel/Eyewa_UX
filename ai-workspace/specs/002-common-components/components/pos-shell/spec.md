---
component: pos-shell
parent: specs/002-common-components
status: done
created: 2026-06-18
updated: 2026-06-26
source: raw-knowledge/files/POSScreen.png
---

# Component: POS shell layout

**Parent index:** [`../../spec.md`](../../spec.md)

Composes [app header](../app-header/spec.md) + scrollable main (`router-outlet`) + [bottom nav](../bottom-nav/spec.md).

## Layout

```
┌ Header (tablet ERP row) ────────────┐
│                                     │
├ Main content (router-outlet) ───────┤
│                                     │
│                                     │
├ Bottom nav ─────────────────────────┤
└─────────────────────────────────────┘
```

## Child routes (main outlet)

| Tab | Route segment | Feature spec |
|-----|---------------|--------------|
| Sell | `sell` | [`005-sell-dashboard`](../../../005-sell-dashboard/spec.md) |
| Prescription | `prescription` | [`003-prescription-create`](../../../003-prescription-create/spec.md) |
| Measurements | `measurements` | [`004-measurements-create`](../../../004-measurements-create/spec.md) |
| Delivery / Order | `delivery` | Stub |
| More | `more` | Stub |

## Chrome visibility

| Route segment | Header | Bottom nav |
|---------------|--------|------------|
| `sell`, `prescription`, `measurements`, `delivery`, `more` | Visible | Visible |
| `profile` | Hidden | Hidden |
| `createcustomer` | Hidden | Hidden |

Controlled by `PosShellComponent.hideShellChrome`.

## Wiring

| Header output | Shell handler |
|---------------|---------------|
| `profileClick` | Navigate to `/home/profile` |
| `newCustomer` | Navigate to `/home/createcustomer?returnTo={activeTab}` |
| `customerSelected` | `SellSessionStore.selectCustomer()`; navigate to Sell if needed |
| `notificationsClick` | Stub |

| Bottom nav output | Shell handler |
|-------------------|---------------|
| `tabChange` | Navigate to `/home/{tab}` |

## Responsive main content

Canonical breakpoint rules: [`../../spec.md#responsive-breakpoints-canonical`](../../spec.md#responsive-breakpoints-canonical).

| Breakpoint | Behavior |
|------------|----------|
| **Tablet** | Multi-column grids per feature spec (e.g. Sell dashboard 3-column grid) |
| **Mobile** | Single column; tab switches full-screen section |

## User stories

### Story 3 — Reusable shell

**As a** developer  
**I want** header and bottom nav as standalone components composed in one shell  
**So that** POC landing and future POS screens share one layout

**Acceptance criteria**

- [x] `AppHeaderComponent`, `ProfilePageComponent`, `BottomNavComponent` documented
- [x] `PosShellComponent` composes header + outlet + nav
- [x] Styles use CSS variables only
- [x] Shallow unit/render tests

## Implementation

| File | Role |
|------|------|
| `src/app/features/pos/shell/pos-shell.component.ts` | Composition, routing, chrome hide |
| `src/app/features/pos/shell/pos-shell.component.css` | Shell layout, content padding |
| `src/app/app.routes.ts` | `/home/*` child routes |

## Verification

```bash
npm start
# Login → /home/sell
# Tabs switch routes; profile and createcustomer hide chrome
```
