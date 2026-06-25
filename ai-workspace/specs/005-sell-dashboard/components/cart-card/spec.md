---
component: cart-card
parent: specs/005-sell-dashboard
status: done
created: 2026-06-20
updated: 2026-06-18
---

# Component: Cart card

**Parent index:** [`../../spec.md`](../../spec.md)

**Column 2 (bottom)** — line items, quantity steppers, clear cart.

## Header

| Element | Copy |
|---------|------|
| Title | **CART ({n} Items)** — dynamic count |
| Action | **Clear Cart** (red + trash icon) |

## Line item columns

**Item** | **Qty** | **Price** | **Discount** | **Total** | delete

Reference example:

| Item | Qty | Price | Discount | Total |
|------|-----|-------|----------|-------|
| Ray-Ban RB 2140, Black \| Size 52 | stepper | 650.00 | 0.00 | 650.00 |
| Blue Cut HMC Lenses | stepper | 450.00 | 0.00 | 450.00 |

- Qty stepper min 1
- Red trash per row
- Confirm before **Clear Cart**

## States

| State | UI |
|-------|-----|
| **Empty** | “Cart is empty” |
| **Has items** | List; feeds [payment card](../payment-card/spec.md) totals |

## Behavior

- Mutations update `SellSessionStore.cartItems` and payment computed totals
- Add blocked when no customer (`addToCartBlockedMessage`)

## Copy

| Element | Text |
|---------|------|
| Title | CART ({n} Items) |
| Clear | Clear Cart |

## User stories

- [x] Line items with qty stepper and remove
- [x] Clear cart with confirmation
- [x] Totals sync to payment card
- [ ] Persist cart to order API (Phase 3)

## Implementation

| File | Role |
|------|------|
| `cart-card/cart-card.component.*` | UI |
| `models/cart.models.ts` | `CartLineItem`, `lineTotal()` |
| `services/sell-session.store.ts` | Cart mutations |
