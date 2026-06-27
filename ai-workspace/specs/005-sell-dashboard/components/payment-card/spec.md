---
component: payment-card
parent: specs/005-sell-dashboard
status: done
created: 2026-06-20
updated: 2026-06-28
---

# Component: Payment card

**Parent index:** [`../../spec.md`](../../spec.md)

**Column 3** — totals, loyalty redemption, payment methods, checkout actions, register shortcuts.

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
| Toggle | Off by default; resets on customer change and after pay |
| Points input | Read-only; populated when toggle on |
| Deduction | Green negative amount when redeemed |

## Payable amount

Bold blue: **{amount} SAR**

## Payment methods (4-column grid)

| Method | Behavior |
|--------|----------|
| Cash | Full payable on cash; auto-synced |
| Card | Full payable on card; auto-synced |
| Mixed | Independent cash + card inputs |
| More (…) | Blocks pay until another method selected |

**Responsive:** `@container (max-width: 320px)` → methods reflow to **2×2**.

### Mixed method panel

| Field | Behavior |
|-------|----------|
| Cash | Editable; does **not** auto-fill card |
| Card | Editable; does **not** auto-fill cash |
| Amount Paid | `cash + card` (read-only summary) |
| Balance | `payable − amount paid`; red when &gt; 0 |

Pay enabled only when balance is **0.00** (within ±0.01), both mixed amounts &gt; 0, customer selected, cart non-empty.

## Footer — checkout actions

| Row | Buttons |
|-----|---------|
| Primary | **PAY** (outline) · **PAY & PRINT** (blue primary) |
| Hint | F9 Pay & Print |
| Register | **Daily report** · **Cash report** · **Open register** · **Close register** (2×2 grid) |

| Button | Behavior (Phase 2) |
|--------|---------------------|
| **PAY** | Validate → record mock payment → status toast with breakdown → stay on Sell |
| **PAY & PRINT** | Validate → build invoice → navigate `/home/sell/invoice` |
| Register actions | Status toast stubs via `runPaymentRegisterAction()` |

Disabled when `canPay()` is false.

## Copy

| Element | Text |
|---------|------|
| Title | PAYMENT |
| Payable | Payable Amount |
| Mixed summary | Amount Paid, Balance |
| CTAs | PAY, PAY & PRINT |
| Register | Daily report, Cash report, Open register, Close register |
| Currency | SAR |

## User stories

- [x] Subtotal, discount, VAT, total, loyalty toggle, methods
- [x] Cash / Card / Mixed payment validation
- [x] Mixed shows Amount Paid and Balance while entering split
- [x] **Pay** records payment and stays on dashboard
- [x] **Pay & Print** opens [invoice preview](../invoice-preview/spec.md)
- [x] Register report buttons (stubs)
- [x] Sticky footer with scrollable body (mixed inputs do not hide CTAs)
- [ ] Live payment API (Phase 3)
- [ ] Register reports + open/close register APIs (Phase 3)
- [ ] Receipt print (Phase 4)

## Implementation

| File | Role |
|------|------|
| `payment-card/payment-card.component.*` | UI |
| `models/payment.models.ts` | `PaymentDraft`, `PaymentRegisterAction` |
| `services/payment.service.ts` | Totals, mixed balance helpers, validation |
| `services/sell-session.store.ts` | `paymentDraft`, `canPay`, `pay()`, `payAndPrint()` |
