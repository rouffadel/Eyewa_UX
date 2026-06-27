---
feature: sell-dashboard
status: in-progress
owner: 
created: 2026-06-20
updated: 2026-06-28
source: raw-knowledge/files/POSScreen.png
reference: Eyewa POS — Sell tab upper dashboard (top cards only)
depends_on: specs/002-common-components
route: /home/sell
primary_target: tablet (iPad / Android tablet)
---

# Feature: Sell tab dashboard (index)

## Summary

Tablet-first **Sell tab** at `/home/sell`: three-column layout with **five cards** for customer context, catalog, cart, and payment. Each card has its own spec under [`components/`](./components/).

**Upper section only** — not the lower Prescription / Measurements / Delivery panels ([`003`](../003-prescription-create/spec.md), [`004`](../004-measurements-create/spec.md)).

## Component registry

| Card / area | Spec | Column | Status |
|-------------|------|--------|--------|
| **Customer profile** | [`components/customer-profile-card/spec.md`](./components/customer-profile-card/spec.md) | 1 (top) | **Done** |
| **Latest Rx summary** | [`components/latest-prescription-summary/spec.md`](./components/latest-prescription-summary/spec.md) | 1 (bottom) | **Done** (mock Rx) |
| **Product catalog** | [`components/product-catalog-card/spec.md`](./components/product-catalog-card/spec.md) | 2 (top) | **Done** (mock catalog) |
| **Cart** | [`components/cart-card/spec.md`](./components/cart-card/spec.md) | 2 (bottom) | **Done** |
| **Payment** | [`components/payment-card/spec.md`](./components/payment-card/spec.md) | 3 | **Done** |
| **Invoice preview** | [`components/invoice-preview/spec.md`](./components/invoice-preview/spec.md) | — (route) | **Done** (mock) |
| **Services & state** | [`services/spec.md`](./services/spec.md) | — | Partial (checkout APIs next) |

**Shell:** [`SellDashboardComponent`](../../../optical-pos-angular-capacitor-ux/src/app/features/pos/sell/sell-dashboard.component.ts) composes all cards.

## Screen regions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HEADER ([002-common-components](../002-common-components/spec.md))          │
├─────────────────────────────────────────────────────────────────────────────┤
│  UPPER SECTION — IN SCOPE                                                    │
│  ┌──────────────┬────────────────────────────┬──────────────────────────┐  │
│  │ Customer     │ Product catalog            │ Payment                  │  │
│  │ Latest Rx    │ Cart                       │                          │  │
│  └──────────────┴────────────────────────────┴──────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│  LOWER SECTION — OUT OF SCOPE (003 / 004 / delivery TBD)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  BOTTOM NAV ([002-common-components](../002-common-components/spec.md))    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Implementation status

| Phase | Scope | Status |
|-------|--------|--------|
| **1 — Layout & cards** | Grid, five cards, mock data | **Done** |
| **2 — Interaction & state** | Cart, catalog tabs, payment, barcode scan, invoice preview | **Done** |
| **3 — API integration** | Brand, order lens, catalog, payment, register APIs | **In progress** |
| **4 — Native** | Receipt print, register reports | Partial (barcode scan **Done**) |

**Implementation plan:** [`plan.md`](./plan.md)

## Layout — tablet (primary)

```
┌─────────────────┬──────────────────────────────┬─────────────────────┐
│ COL 1 (~25%)    │ COL 2 (~45%)                 │ COL 3 (~30%)        │
│ Customer card   │ Product catalog              │ Payment card        │
│ Latest Rx       │ Cart                         │                     │
└─────────────────┴──────────────────────────────┴─────────────────────┘
```

| Breakpoint | Behavior |
|------------|----------|
| **Tablet** | CSS grid: 3 columns (25% / 42% / 33% on a 12-col grid); catalog + cart stacked in column 2; panels scroll independently |
| **Phone** | Stack: Customer → Rx → Catalog → Cart → Payment |
| **Rotation** | Reflow; scroll within cards |

**Tablet detection** (see [`002-common-components`](../002-common-components/spec.md#responsive-breakpoints-canonical)):

- `(min-width: 768px)` **or** `(min-width: 600px) and (min-height: 700px)`

**Phone detection:**

- `(max-width: 599px)` **or** `(max-width: 767px) and (max-height: 699px)`

**Grid columns (tablet):** 12-column grid — left `span 3`, middle `span 5`, right `span 4` (~25% / ~42% / ~33%). Gives the payment column more room than the previous 3-6-3 split on narrow tablets (e.g. Nokia T20 portrait).

**Card-level responsiveness:** Product catalog and payment cards use CSS **container queries** so product tiles and payment methods reflow inside narrow columns without horizontal overflow.

## Navigation

| Trigger | Result |
|---------|--------|
| Bottom nav **Sell** | `/home/sell` → `SellDashboardComponent` |
| Header customer search | `SellSessionStore.searchAndSelectCustomer()` (mock Phase 2) |
| **+ New Customer** | [`006-create-customer`](../006-create-customer/spec.md) → session → Sell tab |
| **New Prescription** (Rx card) | `/home/prescription` |
| **View All** / **View History** (Rx card) | `/home/prescription/history` |
| Product tap | Add to cart (requires customer) |
| Catalog barcode scan | Scan → lookup → add to cart / filter search |
| **Pay** | Mock payment → status toast; stay on Sell |
| **Pay & Print** | Mock payment → [`/home/sell/invoice`](./components/invoice-preview/spec.md) |
| Register actions | Daily report, Cash report, Open/Close register → stubs |

## User stories (rollup)

| Story | Specs | Status |
|-------|-------|--------|
| Sell dashboard on tablet | All cards + layout | **Done** |
| Customer and Rx context | [customer-profile-card](./components/customer-profile-card/spec.md), [latest-prescription-summary](./components/latest-prescription-summary/spec.md) | **Done** (Rx mock) |
| Browse and add products | [product-catalog-card](./components/product-catalog-card/spec.md) | **Done** (mock) |
| Cart and checkout | [cart-card](./components/cart-card/spec.md), [payment-card](./components/payment-card/spec.md), [invoice-preview](./components/invoice-preview/spec.md) | **Done** (mock) |
| Barcode product scan | [product-catalog-card](./components/product-catalog-card/spec.md) | **Done** (Capacitor + mock) |
| Phone layout | Index layout rules | **Done** |

## Shared requirements

### Functional

- Route `/home/sell` inside [`PosShellComponent`](../002-common-components/components/pos-shell/spec.md)
- Shared state via [`SellSessionStore`](./services/spec.md)
- Mock data Phase 1–2; live APIs Phase 3+

### Visual / UI

- Match `POSScreen.png` upper section
- White cards, light borders, POS blue accents
- CSS variables only

### Non-functional

- Tablet-first; portrait and landscape
- Safe-area padding from shell content area

## Phase 3 — API integration (outline)

| Domain | Service / endpoint | Card |
|--------|-------------------|------|
| Customer create / session | [`006`](../006-create-customer/spec.md), `CustomerSessionService` | Customer |
| Order lenses / Rx | `Admin/GetOrderLense` | Latest Rx |
| Brands / catalog | `Admin/GetBrand` | Catalog |
| Payment / order | TBD | Payment, Cart, Invoice |
| Register reports | TBD | Payment footer actions |

Details: [`services/spec.md`](./services/spec.md)

## Dependencies

- [`001-staff-login`](../001-staff-login/) — auth
- [`002-common-components`](../002-common-components/spec.md) — shell, header, bottom nav
- [`006-create-customer`](../006-create-customer/spec.md) — new customer → Sell session
- [`003-prescription-create`](../003-prescription-create/spec.md) — linked from Rx card
- [`004-measurements-create`](../004-measurements-create/spec.md) — separate tab
- [`knowledge/architecture/pos-dashboard-components.md`](../../knowledge/architecture/pos-dashboard-components.md)

## Out of scope

- Full Prescription / Measurements / Delivery lower panels
- Receipt printer hardware (Phase 4); invoice **preview** UI **Done**
- Header / bottom nav

## Open questions

- [ ] Exact column width ratios — **resolved:** 12-col grid spans 3 / 5 / 4 (~25% / ~42% / ~33%)
- [ ] Require customer before add-to-cart? (**Yes** in current app)
- [ ] VAT from `AppConfigService.vatRate`? (**Yes** — 15%)
- [x] **View All** prescriptions — route to `/home/prescription/history` ([`003`](../003-prescription-create/spec.md))
- [ ] Real product images vs placeholder SVG?

## Verification

```bash
cd optical-pos-angular-capacitor-ux
npm start
# Login → Sell tab
# Create customer via header → customer card shows invoice + mobile
# Catalog tabs, add to cart, payment totals update
# Mixed payment: enter cash + card → Balance row updates
# Pay → toast; Pay & Print → invoice preview
# Barcode scan in catalog search (mock SKU 8690001000001)
```
