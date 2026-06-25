---
component: app-header
parent: specs/002-common-components
status: done
created: 2026-06-18
updated: 2026-06-24
source: raw-knowledge/files/POSScreen.png
---

# Component: App header (tablet ERP style)

**Parent index:** [`../../spec.md`](../../spec.md)

Persistent **tablet POS chrome** at the top — matches `POSScreen.png`. Optimized for Capacitor on **tablet**; phone uses the same layout with tighter spacing.

## Design principle

| Do (tablet POS) | Do not |
|-----------------|--------|
| **Single full-width header row** as in reference | Compact phone-only app bar hiding search/profile |
| **Search + New Customer in header center** | Customer search only on a separate profile page |
| **Staff name, branch, loyalty visible in header** | Profile details hidden until another screen |
| **Left avatar initials** (e.g. `A`) → [profile page](../profile-page/spec.md) | Hamburger slide-out drawer for profile |
| **Right profile block** (name + branch + chevron) → **store dropdown** | Profile block navigating to profile page |
| Sticky header + safe areas | Website mega-nav or multi-row marketing header |

## Color palette

| Token | Usage | Reference appearance |
|-------|--------|----------------------|
| `--color-header-bg` | Header background | Dark navy / charcoal (`#1e293b`) |
| `--color-header-text` | Logo, labels | White |
| `--color-pos-accent` | “POS” label, + New Customer accent | Bright blue (`#2563eb`) |
| `--color-header-search-bg` | Search field | White |
| `--color-header-search-border` | Search outline | Light grey / none |
| `--color-loyalty-positive` | Loyalty points | Green (`#16a34a`) |
| `--color-notification-badge` | Bell badge | Red circle with white count |

## Layout (tablet — primary)

**Single header row** (~64–72px + safe-area top). Layout left → center → right.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ (A) Eyewa ERP  POS   [🔍 Search customer by name / mobile / ID  📷] [+ New Customer]     │
│                      Loyalty 250 PTS                                    🔔²  A Ameer ▼   │
│                                                                           Main Branch    │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

| Region | Elements | Behavior |
|--------|----------|----------|
| **Left — brand** | Avatar initials + `Eyewa` + `ERP` + `POS` | **Left avatar** → [profile page](../profile-page/spec.md); brand static |
| **Center — customer** | Search (debounced API) + results dropdown + scan icon + `+ New Customer` | Search calls `customersearchfilter`; select result → Sell customer |
| **Right — staff** | Loyalty, bell (badge), profile block (avatar, name, store, chevron) | Bell stub; **profile block** → store dropdown |

| Element | Text / copy |
|---------|-------------|
| Brand | Eyewa **ERP** |
| Module label | POS (accent blue) |
| Search placeholder | Search customer by name / mobile / ID |
| New customer | + New Customer |
| Loyalty label | Loyalty |
| Loyalty value | `{n} PTS` |

> **No hamburger menu.** Left avatar → profile; right profile block → store selector.

## Store dropdown

Tapping the **right profile block** toggles a dropdown. Stores from Eyewa **`FillStore`** API ([`001-staff-login`](../../../001-staff-login/spec.md) Story 9).

| Property | Behavior |
|----------|----------|
| **Trigger** | Right `.app-header__profile` button only |
| **Data source** | `GET {apiUrl}/{storesPath}?LoginId={loginId}&StoreId=0` via `StoreService` |
| **Prefetch** | On init when authenticated; also after login in `AuthService` |
| **Selection** | `AuthService.selectStore()` — persists in `eyewa_auth_session` |
| **Branch label** | `userBranch` = `selectedStore.storeName` |
| **Loading / error** | “Loading stores…”, error, or empty state |
| **Dismiss** | Click outside or after selection |
| **Accessibility** | `aria-haspopup="listbox"`, `aria-expanded`, `role="listbox"` / `role="option"` |

## Customer search dropdown — **Done**

Tapping or typing in the header search field queries the Eyewa **`customersearchfilter`** API and shows results in a dropdown below the search input.

| Property | Behavior |
|----------|----------|
| **Endpoint** | `GET {apiUrl}/sales/customersearchfilter?mobileNumber={query}` |
| **Config** | `customerSearchPath` in appsettings |
| **Debounce** | 300ms + `distinctUntilChanged` |
| **Min length** | 2 characters (letters, numbers, `+`, `-`, spaces) |
| **Loading** | “Searching…” in dropdown |
| **Empty** | “No customers found.” |
| **Error** | Safe message in dropdown (network / server) |
| **Select** | Emits `customerSelected` → `PosShellComponent` → `SellSessionStore.selectCustomer()`; navigates to Sell if needed |
| **Dismiss** | Click outside; clears on selection |
| **Auth** | `Authorization: Bearer` via `authInterceptor` |

**Result row:** customer name, mobile, invoice number (when present).

**Files:** `CustomerSearchService`, `customer-search.models.ts`, `app-header.component.*`

## Controls

| Control | Style |
|---------|--------|
| **Header bar** | Dark background; sticky; `padding-top: env(safe-area-inset-top)` |
| **Left avatar** | Circle initials; min **44×44px** |
| **Search input** | White; min height 44px; font **≥16px** |
| **+ New Customer** | White/light button; blue text and border |
| **Loyalty block** | Green points |
| **Bell** | White icon; red badge |
| **Profile block** | Avatar + name + store + chevron; min 44px; opens dropdown |

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| **Tablet (≥768px)** | Full ERP row; search grows; name + store always visible |
| **Phone (<768px)** | Same structure; search may shrink; loyalty label may hide |

## Component API

**Inputs:** `notificationCount`

**Outputs:** `notificationsClick`, `profileClick`, `customerSelected`, `newCustomer`, `scanClick`

**Services (injected):** `AuthService`, `StoreService`, `CustomerSearchService`

## User stories

### Story 1 — Tablet ERP header

- [x] Layout matches `POSScreen.png`: brand, search, New Customer, loyalty, bell, profile block
- [x] No hamburger menu
- [x] Left avatar → profile page
- [x] Right profile block → store dropdown (not profile)
- [x] Search debounced; placeholder matches copy
- [x] Customer search API + dropdown results ([`006` Phase 4 partial](../../../006-create-customer/spec.md))
- [x] Selecting a result sets active customer on Sell tab
- [x] Tap targets ≥44px; safe areas applied

### Story 4 — Store selection

- [x] Name from `AuthService.user().loginName` (title-cased)
- [x] Store from `AuthService.selectedStore().storeName`
- [x] Dropdown toggle; `StoreService.fillStores(loginId, 0)`
- [x] Selection via `AuthService.selectStore()`; click-outside dismiss
- [x] Chevron rotates when open

### Story 5 — New Customer

- [x] Emits `newCustomer` on **+ New Customer** tap
- [x] Shell navigates to `/home/createcustomer?returnTo={activeTab}` ([`006-create-customer`](../../../006-create-customer/spec.md))

## Planned

- Notification panel (bell currently stub)

## Optional enhancements (POC+)

- Hide bottom nav when keyboard open
- Barcode scan on search field

## Implementation

| File | Role |
|------|------|
| `src/app/shared/ui/app-header/app-header.component.ts` | Layout, auth, store dropdown |
| `src/app/shared/ui/app-header/app-header.component.html` | Markup |
| `src/app/shared/ui/app-header/app-header.component.css` | Styles |
| `src/app/features/auth/services/store.service.ts` | `FillStore` client |
| `src/app/features/auth/services/auth.service.ts` | `selectedStore`, `selectStore()` |
| `src/app/features/pos/customer/services/customer-search.service.ts` | `customersearchfilter` client |
| `src/app/features/pos/customer/models/customer-search.models.ts` | Search types, validation, map → `Customer` |
| `src/app/features/auth/interceptors/auth.interceptor.ts` | Bearer token on search + all APIs |
