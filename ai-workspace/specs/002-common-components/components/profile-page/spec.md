---
component: profile-page
parent: specs/002-common-components
status: done
created: 2026-06-18
updated: 2026-06-18
source: raw-knowledge/files/POSScreen.png
---

# Component: Profile page

**Parent index:** [`../../spec.md`](../../spec.md)

Dedicated route for staff account actions. Entry from **left avatar** in [app header](../app-header/spec.md) only.

## Route

| Property | Value |
|----------|--------|
| Path | `/home/profile` |
| Bottom nav | **Hidden** (see [pos-shell](../pos-shell/spec.md)) |
| Header | **Hidden** on this route |

## Layout

```
┌ ← Back ─────────────────────────────┐
│            (A)                      │
│           Ameer                     │
│        Main Branch                  │
│          250 PTS                    │
│  [ Sign out                       ] │
└─────────────────────────────────────┘
```

| Section | Content |
|---------|---------|
| **Navigation** | Back → previous POS tab |
| **Profile** | Avatar, name, **selected store name**, loyalty |
| **Account** | Sign out |

## Data binding

| Field | Source |
|-------|--------|
| Name | `AuthService.user().loginName` or session `displayName` |
| Store | `AuthService.selectedStore().storeName` (fallback: `branchName` or `Store {storeId}`) |
| Loyalty | `AuthService.currentSession().loyaltyPoints` |
| Initials | Derived from display name |

## Behavior

| Action | Result |
|--------|--------|
| **Back** | Navigate to previous POS tab |
| **Sign out** | `AuthService.logout()` — clears auth + customer session |

Customer search and **+ New Customer** remain in [app header](../app-header/spec.md) on POS tabs; not duplicated on profile.

## User stories

Part of [app-header Story 1](../app-header/spec.md):

- [x] Profile page has **no bottom nav**
- [x] Back returns to previous tab
- [x] Sign out works

## Implementation

| File | Role |
|------|------|
| `src/app/features/pos/profile/profile-page.component.ts` | Profile UI, sign out |
| `src/app/features/pos/profile/profile-page.component.html` | Markup |
| `src/app/features/pos/shell/pos-shell.component.ts` | Hides chrome on `profile` route |
