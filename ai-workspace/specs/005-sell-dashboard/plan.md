---
feature: sell-dashboard
status: draft
spec: ./spec.md
project: optical-pos
updated: 2026-06-28
depends_on: specs/002-common-components
---

# Implementation plan — Sell tab dashboard

## Spec reference

- **Index:** [`spec.md`](./spec.md)
- **Component specs:**
  - [`components/customer-profile-card/spec.md`](./components/customer-profile-card/spec.md)
  - [`components/latest-prescription-summary/spec.md`](./components/latest-prescription-summary/spec.md)
  - [`components/product-catalog-card/spec.md`](./components/product-catalog-card/spec.md)
  - [`components/cart-card/spec.md`](./components/cart-card/spec.md)
  - [`components/payment-card/spec.md`](./components/payment-card/spec.md)
  - [`components/invoice-preview/spec.md`](./components/invoice-preview/spec.md)
- **Services:** [`services/spec.md`](./services/spec.md)
- Visual reference: [`raw-knowledge/files/POSScreen.png`](../../raw-knowledge/files/POSScreen.png) — **upper section only**
- Architecture: [`knowledge/architecture/pos-dashboard-components.md`](../../knowledge/architecture/pos-dashboard-components.md)

## Goal

Replace the `/home/sell` **`WelcomeComponent`** placeholder with a **tablet-first Sell dashboard**: three columns, five cards (customer profile, latest prescription summary, product catalog, cart, payment). Phase 1–2 use mock data and local state; **Phase 3 — Sell API integration** wires customer, catalog, cart, and payment endpoints (same phased pattern as [`001-staff-login`](../001-staff-login/spec.md) and [`003-prescription-create`](../003-prescription-create/spec.md)).

**Out of scope for this plan:** lower-section Prescription / Measurements / Delivery form panels and full Prescription tab form UI (see specs 003 / 004).

## Current status

| Phase | Status | Notes |
|-------|--------|--------|
| **1 — Layout & cards (UI shell)** | **Done** | Grid + five cards, static mock data, stub actions |
| **2 — Interaction & state** | **Done** | Cart, payment (Pay / Pay & Print), mixed balance, invoice preview, barcode scan, header customer |
| **3 — Sell API integration** | In progress | Catalog checkout, register APIs |
| **4 — Native** | Partial | Barcode scan **Done**; receipt print + register reports planned |

**App path:** `optical-pos-angular-capacitor-ux/`  
**Route today:** `/home/sell` → `SellDashboardComponent`  
**Shell:** `PosShellComponent` + tablet header + bottom nav already implemented ([`002-common-components`](../002-common-components/spec.md))

## Technical approach

### File structure

```
optical-pos-angular-capacitor-ux/src/app/
├── features/pos/
│   └── sell/
│       ├── sell-dashboard.component.ts
│       ├── sell-dashboard.component.html
│       ├── sell-dashboard.component.css
│       ├── customer-profile-card/
│       ├── latest-prescription-summary/
│       ├── product-catalog-card/
│       ├── cart-card/
│       ├── payment-card/
│       ├── invoice-preview/
│       ├── models/
│       │   ├── customer.models.ts
│       │   ├── product.models.ts
│       │   ├── cart.models.ts
│       │   ├── payment.models.ts
│       │   └── invoice.models.ts
│       └── services/
│           ├── sell-session.store.ts
│           ├── sell.mock-data.ts
│           ├── payment.service.ts
│           ├── barcode-scan.service.ts
│           ├── invoice.mapper.ts
│           ├── brand.service.ts
│           └── order-lense.service.ts
├── shared/ui/                             # optional Phase 1+ primitives
│   ├── pos-card/                          # white card chrome (title bar + body)
│   ├── quantity-stepper/
│   ├── summary-row/
│   └── toggle-switch/
└── app.routes.ts                          # sell → SellDashboardComponent
```

> **Phase 1 shortcut:** Card sub-components may live inline in `sell-dashboard` templates; extract to folders when files exceed ~150 lines.

### Routing

Update child of `PosShellComponent`:

```typescript
{
  path: 'sell',
  component: SellDashboardComponent,
},
{
  path: 'sell/invoice',
  loadComponent: () => import('./features/pos/sell/invoice-preview/...'),
},
```

Remove or delete `features/pos/welcome/` after migration. Default redirect `/home` → `sell` unchanged.

### Layout — `SellDashboardComponent`

**Tablet grid** — apply when [`002-common-components`](../002-common-components/spec.md#responsive-breakpoints-canonical) tablet rules match:

```css
/* Tablet: (min-width: 768px) OR (min-width: 600px AND min-height: 700px) */
.sell-dashboard {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-rows: minmax(0, 1fr);
  gap: 0.625rem;
  padding: 0.625rem;
  min-height: var(--sell-panel-min-height);
  overflow: hidden;
}

.sell-dashboard__panel--left  { grid-column: 1 / span 3; }  /* ~25% */
.sell-dashboard__panel--middle { grid-column: 4 / span 5; } /* ~42% */
.sell-dashboard__panel--right  { grid-column: 9 / span 4; }  /* ~33% */
```

At `≥1024px`, increase gap/padding only. Panels use `overflow-y: auto` so content scrolls inside fixed chrome (header + bottom nav).

**Phone** — apply when phone rules match: single column — same DOM order as spec (customer → latest Rx → catalog → cart → payment). Phone panels get frosted card wrappers.

**Card chrome (shared):**

```css
.pos-card {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}
```

Add sell tokens to `styles.css` if needed:

```css
--sell-card-radius: 12px;
--sell-grid-gap: 1rem;
--vat-rate: 0.15; /* overridden from config in Phase 3 */
```

### State — `SellSessionStore`

Single injectable store (Angular signals) shared by all sell cards:

| Signal | Type | Purpose |
|--------|------|---------|
| `selectedCustomer` | `Customer \| null` | Drives customer + latest Rx cards |
| `latestPrescription` | `PrescriptionSummary \| null` | Read-only snapshot |
| `catalogCategory` | `CatalogCategory` | Active tab key |
| `catalogSearch` | `string` | Local filter |
| `cartItems` | `CartLineItem[]` | Cart + payment subtotal |
| `paymentDraft` | `PaymentDraft` | discount, loyalty toggle, points, method |

**Computed:**

- `cartItemCount`, `cartSubtotal`
- `paymentTotals` — subtotal, discount, vat, total, loyalty deduction, payable (pure functions in `payment.service.ts`)

Wire header search from `PosShellComponent` in **Phase 2**:

```typescript
// pos-shell: onSearchChange → SellSessionStore or CustomerService.searchAndSelect()
```

Phase 1: pre-select mock customer **Saud Ahmed** so cards match reference screenshot.

### Mock data (Phase 1–2)

**Default customer** (matches spec / PNG):

```typescript
{
  id: 'CUST-000123',
  displayName: 'Saud Ahmed',
  initials: 'SA',
  phoneMasked: '05xxxxxxxxx',
  loyaltyPoints: 250,
  lastVisit: '18-05-2024',
}
```

**Latest prescription summary:**

```typescript
{
  date: '21-05-2024',
  doctorName: 'Dr. Khalid',
  od: { sph: '-1.50', cyl: '-0.75', axis: '180' },
  os: { sph: '-1.25', cyl: '-1.00', axis: '175' },
  pd: '62.0',
  nearPd: '+1.25',
}
```

**Products** (per category, min 4 items for grid):

```typescript
{ sku: 'FRM-0001', name: 'Ray-Ban RB 2140', price: 650, category: 'frames' }
// + Oakley, etc. from reference
```

**Seed cart** (optional Phase 1 static display; Phase 2 mutable):

Two lines matching reference — frame + lenses — so payment card shows 1,100.00 subtotal.

### Component responsibilities

| Component | Inputs | Outputs / actions |
|-----------|--------|-------------------|
| `CustomerProfileCardComponent` | `customer`, `loading` | `redeemPoints`, `openDetail` |

**Customer card — Last Visit row:** calendar icon + “Last Visit” label grouped on the **left**; visit date (e.g. `18-05-2024`) **right-aligned** on the same full-width row (`justify-content: space-between`).

| `LatestPrescriptionSummaryComponent` | `summary`, `hasCustomer` | `viewAll`, `viewHistory`, `newPrescription` → router |
| `ProductCatalogCardComponent` | `category`, `products`, `search` | `categoryChange`, `searchChange`, `productSelect`, `scanClick`, `filterClick` |
| `CartCardComponent` | `items` | `qtyChange`, `removeItem`, `clearCart` |
| `PaymentCardComponent` | `totals`, `draft`, `canPay` | `discountChange`, `loyaltyToggle`, `methodChange`, `cashAmountChange`, `cardAmountChange`, `pay`, `payAndPrint`, `registerAction` |
| `InvoicePreviewComponent` | (reads `SellSessionStore.lastInvoice`) | Print stub, Cancel → Sell |

### Services

| Service | Phase 1–2 | Phase 3 |
|---------|-----------|---------|
| `CustomerService` | Return mock customer; search returns mock list | `GET /customers/search`, `GET /customers/{id}` |
| `CatalogService` | Mock products by category | `GET /products?category=` |
| `CartService` | In-memory add/update/remove/clear | Optional server cart or order draft API |
| `PaymentService` | Local VAT math (`vatRate` from config) | `POST /orders/checkout` |
| `SellSessionStore` | Orchestrates signals | Same; hydrates from API responses |

### Config flags (Phase 3)

Add to `appsettings.json` / `appsettings.prod.json`:

```json
{
  "useMockSell": true,
  "useMockCustomer": true,
  "useMockCatalog": true,
  "vatRate": 0.15,
  "currencyCode": "SAR"
}
```

When `useMockSell: false`, services call real API (mirror `useMockAuth` pattern).

### Navigation wiring

| Action | Implementation |
|--------|----------------|
| **New Prescription** | `router.navigate(['/home/prescription'])` |
| **View All** / **View History** | `router.navigate(['/home/prescription/history'])` — see [`003`](../003-prescription-create/plan.md) Phase 4 |
| **Pay** | Validate → mock payment toast → stay on Sell |
| **Pay & Print** | Validate → `buildInvoiceViewModel()` → `/home/sell/invoice` |
| **Barcode scan** | `BarcodeScanService` → `scanProductBarcode()` → cart / search |
| Register actions | Stubs: daily report, cash report, open/close register |
| **Clear cart** | `window.confirm` then `cartService.clear()` |

### Product rules (defaults)

| Rule | Decision |
|------|----------|
| Add to cart without customer | **Blocked** in Phase 2 — toast “Select a customer first” |
| VAT rate | `AppConfigService.settings.vatRate` default **15%** |
| Pay enabled | Customer + cart + valid payment (`canPay`) |
| Mixed payment | Independent cash/card; **Balance** must reach 0 |
| Product images | Placeholder SVG frame icon Phase 1 |

## Phased delivery

### Phase 1 — Layout & cards (UI shell)

| Task | Detail |
|------|--------|
| Create `SellDashboardComponent` + grid CSS | Tablet 3-col + phone stack |
| Build five card templates | Match spec copy and reference layout |
| Static mock data | Saud Ahmed, latest Rx, 4+ products, 2 cart lines, payment breakdown |
| Stub buttons | Redeem, View All, scan, filter, Pay & Print → toast or no-op |
| Route swap | `WelcomeComponent` → `SellDashboardComponent` |
| Shallow unit tests | Dashboard creates; cards render reference copy |

**Outcome:** Sell tab visually matches **upper section** of `POSScreen.png` on tablet.

### Phase 2 — Interaction & state

| Task | Detail |
|------|--------|
| `SellSessionStore` + `CartService` | Add/remove/qty/clear; reactive totals |
| Catalog tabs + search filter | Switch category; debounced local filter |
| Payment draft | Discount, loyalty, method, `cashAmount` / `cardAmount` for mixed |
| `PaymentService` | Totals, mixed balance, validation |
| Barcode scan | `@capacitor/barcode-scanner` + mock `findProductByBarcode()` |
| Invoice preview | Fields from `Invoice.jpeg`; route `/home/sell/invoice` |
| Header search integration | `PosShellComponent` `customerSelected` → `SellSessionStore.selectCustomer()` via `CustomerSearchService` |
| Empty states | No customer, empty cart, no Rx |
| Confirm clear cart | Dialog before clear |
| Unit tests | Cart math, payment totals, add-to-cart guard |

**Outcome:** Interactive sell flow on mock data end-to-end.

### Phase 3 — Sell API integration

| Task | Detail |
|------|--------|
| OpenAPI contracts | `customers`, `products`, `orders`, `payments` under `ai-workspace/contracts/openapi/` |
| Implement API paths in services | When `useMockSell: false` |
| Latest Rx summary | `GET /customers/{id}/prescriptions/latest` |
| Checkout | `POST /orders` or `/checkout` with payment method + loyalty |
| Error handling | Generic messages; no raw API errors in UI |
| Config | Prod: `useMockSell: false` |

**Outcome:** Real backend sell flow (excluding print).

### Phase 4 — Native & polish

| Task | Detail |
|------|--------|
| Barcode scan | **Done** — `@capacitor/barcode-scanner`, scan icon inside catalog search |
| Pay & Print | Invoice preview **Done**; hardware print Phase 4 |
| Register reports | UI stubs **Done**; APIs Phase 3 |
| Prescription history | View All / View History → `/home/prescription/history` (**Done** mock) |
| F9 shortcut | Optional keyboard listener for Pay & Print (web/tablet keyboard) |
| Visual QA | Side-by-side with `POSScreen.png` |

## Components affected

| Area | Path | Change |
|------|------|--------|
| Routes | `app.routes.ts` | `sell` → `SellDashboardComponent` |
| Sell feature | `features/pos/sell/**` | **New** |
| Welcome | `features/pos/welcome/**` | **Remove** after swap |
| Shell | `pos-shell.component.ts` | Phase 2: expose search to sell store |
| Config | `src/config/appsettings*.json` | Mock flags + `vatRate` Phase 3 |
| Styles | `styles.css` | Optional sell tokens |
| Contracts | `ai-workspace/contracts/openapi/` | Phase 3 |

## Data model (summary)

Full entity definitions → optional [`data-model.md`](./data-model.md) (create when starting Phase 2).

| Entity | Key fields |
|--------|------------|
| `Customer` | `id`, `displayName`, `initials`, `phoneMasked`, `loyaltyPoints`, `lastVisit` |
| `PrescriptionSummary` | `date`, `doctorName`, `od`, `os`, `pd`, `nearPd` |
| `Product` | `sku`, `name`, `description`, `price`, `category`, `imageUrl?` |
| `CartLineItem` | `lineId`, `product`, `qty`, `unitPrice`, `discount`, `lineTotal` |
| `PaymentDraft` | `discountAmount`, `redeemLoyalty`, `loyaltyPoints`, `method`, `cashAmount`, `cardAmount` |
| `PaymentRegisterAction` | `daily-report`, `cash-report`, `open-register`, `close-register` |
| `InvoiceViewModel` | Header, product lines, Rx rows, totals, amount paid, balance |
| `PaymentTotals` | `subtotal`, `discount`, `vat`, `total`, `loyaltyDeduction`, `payable` |

## Test strategy

### Unit

| Target | Cases |
|--------|--------|
| `SellDashboardComponent` | Renders five card regions; grid class on tablet breakpoint |
| `CustomerProfileCardComponent` | Shows Saud Ahmed mock fields; empty state |
| `LatestPrescriptionSummaryComponent` | OD/OS grid; New Prescription navigates |
| `CartService` | Add item, increment qty, remove, clear, item count |
| `PaymentService` | VAT 15%, discount, loyalty, mixed balance, validation |
| `BarcodeScanService` | Capacitor scan wrapper |
| `invoice.mapper` | Build invoice from sell session |
| `CatalogService` | Filter by category + search string |

### Manual / visual

- [ ] Sell tab active in bottom nav at `/home/sell`
- [ ] Tablet 1024×768: three columns match upper reference layout
- [ ] Nokia T20 portrait (~600×1000 CSS): three columns; no phone stack; payment methods readable
- [ ] Phone 375px: vertical stack, no horizontal scroll
- [ ] Landscape tablet: cards scroll independently where needed
- [ ] Compare customer, catalog, cart, payment cards to `POSScreen.png`
- [ ] No lower-section Prescription/Measurements/Delivery panels on Sell route

## Definition of done

### Phase 1–2 (MVP)

- [ ] `SellDashboardComponent` at `/home/sell`
- [ ] Five cards with spec copy and reference mock data
- [ ] Tablet grid + phone stack
- [x] Cart qty changes update payment totals
- [x] Catalog tabs filter products
- [x] Pay + Pay & Print with validation
- [x] Mixed payment Amount Paid / Balance
- [x] Invoice preview after Pay & Print
- [x] Barcode scan in catalog search
- [x] Register action stubs on payment card
- [ ] New Prescription → `/home/prescription`
- [ ] Unit tests for dashboard, cart, and payment math
- [ ] Visual sign-off against **upper section** of `POSScreen.png`

### Phase 3

- [ ] `useMockSell: false` calls real APIs
- [ ] OpenAPI YAML for customer, catalog, checkout
- [ ] Latest Rx loaded by customer ID
- [ ] Generic error handling on failed checkout

### Phase 4

- [ ] Live catalog barcode lookup API
- [ ] Print path after successful payment (hardware)
- [ ] Register open/close + daily/cash report APIs
- [x] Prescription history entry from View All → [`003`](../003-prescription-create/spec.md) history page

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Large CSS surface (5 cards) | Shared `.pos-card` + extract sub-components early |
| Header search not wired in Phase 1 | Default mock customer; wire in Phase 2 |
| Payment math drift vs backend | Single `PaymentService.calculateTotals`; API replaces in Phase 3 |
| Scope creep (full Rx form on Sell) | Summary card only; link to spec 003 |

## Related

- Spec: [`./spec.md`](./spec.md)
- Shell / header: [`../002-common-components/`](../002-common-components/)
- Prescription tab (linked from summary): [`../003-prescription-create/`](../003-prescription-create/)
- Measurements tab (separate nav): [`../004-measurements-create/`](../004-measurements-create/)
- Auth: [`../001-staff-login/`](../001-staff-login/)
