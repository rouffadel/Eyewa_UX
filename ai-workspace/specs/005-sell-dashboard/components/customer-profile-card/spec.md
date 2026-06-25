---
component: customer-profile-card
parent: specs/005-sell-dashboard
status: done
created: 2026-06-20
updated: 2026-06-24
selector: app-customer-profile-card
depends_on: specs/005-sell-dashboard/data-model, specs/006-create-customer
---

# Component: Customer profile card

**Parent index:** [`../../spec.md`](../../spec.md)  
**Data model:** [`../../data-model.md`](../../data-model.md) — `Customer`

## Summary

Presentational card (column 1 top) showing the active customer: name, invoice/ID, phone, last visit. **Loyalty section is hidden** (`showLoyaltySection = false`, `@if` in template) until a future loyalty API exists — markup is kept, not rendered.

## Problem

Staff must confirm the correct customer before adding items and payment.

## Implementation status

| Phase | Scope | Status |
|-------|--------|--------|
| **1 — UI shell** | Layout, empty state | **Done** |
| **2 — Session** | Bind `CustomerSessionService` via store | **Done** |
| **3 — APIs** | Loyalty / detail APIs | Planned (loyalty UI hidden) |

## Scope

| In scope | Out of scope |
|----------|--------------|
| Display `Customer` input | Customer search (header / `CustomerSearchService`) |
| Empty state | Loyalty redemption API |
| Hide loyalty section (`@if (showLoyaltySection)`) — do not delete markup | Customer edit form |
| Outputs `redeemPoints`, `openDetail` (loyalty row not shown) | |

## Screen layout

```
┌─────────────────────────────────────┐
│  (SA)  Name                    ›   │
│        invoiceNo ?? id              │
│  📞 phoneMasked                     │
│  (loyalty row hidden — @if false)   │
│  📅 Last Visit          date        │
└─────────────────────────────────────┘
```

## Component contract

| Kind | Name | Type | Required | Description |
|------|------|------|----------|-------------|
| Input | `customer` | `Customer \| null` | Yes | `null` → empty state |
| Property | `showLoyaltySection` | `boolean` | | Default `false`; set `true` when loyalty API is ready |
| Output | `redeemPoints` | `void` | | Redeem button (hidden while loyalty section off) |
| Output | `openDetail` | `void` | | Header button |

**Rule:** No `HttpClient` or store injection in this component.

Subline template: `{{ c.invoiceNo ?? c.id }}`

## Copy

| Key | Text |
|-----|------|
| loyaltyLabel | Loyalty Balance |
| loyaltyValue | `{n} PTS` |
| redeemButton | Redeem Points |
| lastVisitLabel | Last Visit |
| emptyTitle | Search or select a customer |
| emptyHint | Use the header search to find a customer by name, mobile, or ID. |

## Parent integration

```html
<app-customer-profile-card
  [customer]="store.selectedCustomer()"
  (redeemPoints)="onRedeemPoints()"
  (openDetail)="onOpenCustomerDetail()"
/>
```

## User stories

### Story 1 — Show customer

**As a** staff member  
**I want** to see the selected customer's profile  
**So that** I verify identity before checkout

**Acceptance criteria**

- [x] Shows initials, name, subline, phone, last visit when `customer` set
- [x] Loyalty row not rendered (`showLoyaltySection === false`)
- [x] Subline prefers `invoiceNo` over `id`
- [x] Last visit row: label left, date right

### Story 2 — Empty state

**As a** staff member with no selection  
**I want** a clear empty state  
**So that** I use search or create customer

**Acceptance criteria**

- [x] Exact empty copy when `customer === null`

## Implementation files

| File | Role |
|------|------|
| `customer-profile-card/customer-profile-card.component.*` | Component |
| `models/customer.models.ts` | `Customer` |
| `services/sell-session.store.ts` | `selectedCustomer` |

## Verification

Create customer or header search → card shows name, invoice, mobile on Sell tab (no loyalty row).
