---
component: bottom-nav
parent: specs/002-common-components
status: done
created: 2026-06-18
updated: 2026-06-18
source: raw-knowledge/files/POSScreen.png
---

# Component: Bottom navigation

**Parent index:** [`../../spec.md`](../../spec.md)

Persistent **bottom tab bar** for primary POS section switching. Fixed bar with five tabs (not a drawer).

## Visual design

| Token | Usage |
|-------|--------|
| `--color-nav-bg` | Bar background — white |
| `--color-nav-border` | Top border — light grey |
| `--color-nav-active` | Active icon + label + indicator — bright blue |
| `--color-nav-inactive` | Inactive icon + label — medium grey |

## Tab items (exact labels)

| # | Icon | Label | Route key |
|---|------|-------|-------------|
| 1 | Shopping bag | Sell | `sell` |
| 2 | Eyeglasses | Prescription | `prescription` |
| 3 | Ruler / measure | Measurements | `measurements` |
| 4 | Delivery truck | Delivery / Order | `delivery` |
| 5 | Ellipsis | More | `more` |

## Active state

- Icon and label in **active blue**
- **Blue horizontal line** above the label (reference: Measurements tab)
- Inactive: grey icon + label, no indicator

## Layout

```
┌─────────────────────────────────────────────────────────┐
│  ───   (blue line above active tab only)                │
│  🛍️      👓       📏        🚚        ⋯                │
│ Sell  Prescription Measurements Delivery/Order  More    │
└─────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|--------|
| Height | ~56–64px + `env(safe-area-inset-bottom)` |
| Item layout | Equal width (5 columns) |
| Label | Single line; truncate on small screens |
| “Delivery / Order” | Two-line label on mobile if needed |
| Z-index | Fixed above content |

Main content must add **bottom padding** equal to nav height.

## Responsive

| Property | Tablet | Mobile |
|----------|--------|--------|
| Visibility | Always on POS shell | Always on POS shell |
| Labels | Always shown | Always shown |

## Component API

**Inputs:** `activeTab`

**Outputs:** `tabChange`

## User stories

### Story 2 — Bottom navigation

**As a** store staff member  
**I want** bottom tabs for Sell, Prescription, Measurements, Delivery, and More  
**So that** I can switch POS areas with one tap

**Acceptance criteria**

- [x] Five tabs with icons and labels per reference
- [x] Active tab: blue icon, label, indicator line above label
- [x] Inactive tabs grey
- [x] Fixed bottom with safe-area padding
- [x] Tab change updates route/state
- [x] Default active tab: **Sell**

## Implementation

| File | Role |
|------|------|
| `src/app/shared/ui/bottom-nav/bottom-nav.component.ts` | Tab bar, active state |
| `src/app/shared/ui/bottom-nav/bottom-nav.component.html` | Markup |
| `src/app/shared/ui/bottom-nav/bottom-nav.component.css` | Styles |
