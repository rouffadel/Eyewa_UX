---
component: payment-card
parent: specs/005-sell-dashboard
status: done
created: 2026-06-20
updated: 2026-06-18
---

# Component: Payment card

**Parent index:** [`../../spec.md`](../../spec.md)

**Column 3** — totals, loyalty redemption, payment methods, **Pay & Print**.

## Title

**PAYMENT** — bold uppercase

## Summary rows

| Row | Notes |
|-----|-------|
| Subtotal | From cart |
| Discount | Editable input |
| VAT (15%) | From `AppConfigService.vatRate` |
| Total | Subtotal − discount + VAT |

## Loyalty block

| Element | Reference |
|---------|-----------|
| Label | Redeem Loyalty Points |
| Toggle | On/off |
| Points input | Numeric |
| Deduction | Green negative amount |

## Payable amount

Large bold blue: **{amount} SAR**

## Payment methods (2×2 grid)

| Method | Default |
|--------|---------|
| Cash | Selected (green border + check) |
| Card | Outline |
| Mixed | Outline |
| More (…) | Outline |

## Primary CTA

| Button | Notes |
|--------|-------|
| **PAY & PRINT** | Full-width blue; optional **F9** hint |

Disabled when cart empty or no customer.

## Copy

| Element | Text |
|---------|------|
| Title | PAYMENT |
| Subtotal / Discount / VAT / Total | As labeled |
| Loyalty | Redeem Loyalty Points |
| Payable | Payable Amount |
| CTA | PAY & PRINT |
| Currency | SAR |

## User stories

- [x] Subtotal, discount, VAT, total, loyalty toggle, methods
- [x] Pay & Print stub with valid cart + customer
- [x] Totals update when cart or discount changes
- [ ] Live payment API + print (Phase 3–4)

## Implementation

| File | Role |
|------|------|
| `payment-card/payment-card.component.*` | UI |
| `models/payment.models.ts` | `PaymentDraft`, methods |
| `services/payment.service.ts` | VAT/totals math |
| `services/sell-session.store.ts` | `paymentDraft`, `paymentTotals`, `canPay` |
