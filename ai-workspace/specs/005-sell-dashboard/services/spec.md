---
area: sell-services
parent: specs/005-sell-dashboard
status: in-progress
created: 2026-06-20
updated: 2026-06-28
---

# Sell tab — services & state

**Parent index:** [`../spec.md`](../spec.md)

Shared services under `src/app/features/pos/sell/services/`.

## SellSessionStore (central state)

| Signal / method | Purpose |
|-----------------|---------|
| `selectedCustomer` | Active customer for sale |
| `latestPrescription` | Rx summary (mock; sync from prescription save) |
| `prescriptionHistory`, `selectedPrescriptionId` | Per-customer history selection |
| `catalogCategory`, `catalogSearch` | Catalog filters |
| `filteredProducts` | Computed product list |
| `cartItems`, `cartSubtotal`, `cartItemCount` | Cart lines |
| `paymentDraft`, `paymentTotals`, `canPay` | Checkout state |
| `lastInvoice` | Built on **Pay & Print** for invoice preview |
| `statusMessage`, `addToCartBlockedMessage` | Dashboard banners |
| `selectCustomer()` / `selectCreatedCustomer()` | Header + create flow |
| `applySavedPrescription()` | Prescription tab → latest Rx + history |
| `addProductToCart()` | Catalog → cart (customer required) |
| `scanProductBarcode()` / `applyScannedBarcode()` | Barcode → search + cart |
| `setPaymentMethod()`, `setMixedCashAmount()`, `setMixedCardAmount()` | Payment draft |
| `pay(staffName)` | Validate → mock payment → toast; stay on Sell |
| `payAndPrint(staffName)` | Validate → build invoice → navigate invoice |
| `runPaymentRegisterAction()` | Register/report stubs |

**File:** `services/sell-session.store.ts`

## PaymentService — **Done** (local math)

| Method | Purpose |
|--------|---------|
| `calculateTotals()` | Discount → VAT → loyalty → payable |
| `syncAmountsForMethod()` | Cash/card full amount; mixed preserves user inputs |
| `applyMixedCashAmount()` / `applyMixedCardAmount()` | Independent mixed fields |
| `isPaymentComplete()` / `paymentValidationMessage()` | Pay guard |
| `mixedAmountPaid()`, `mixedBalanceRemaining()` | Mixed summary helpers |
| `paymentAmountPaid()`, `paymentBalanceRemaining()` | Invoice totals |

VAT from `AppConfigService.vatRate` (default 15%).

**Files:** `services/payment.service.ts`, `models/payment.models.ts`

## BarcodeScanService — **Done** (Capacitor)

| Item | Value |
|------|--------|
| Plugin | `@capacitor/barcode-scanner@3.x` |
| Method | `scanBarcode()` → trimmed string or `null` if cancelled |

**File:** `services/barcode-scan.service.ts`

## Invoice mapper — **Done** (mock)

| Function | Purpose |
|----------|---------|
| `buildInvoiceViewModel()` | Maps customer, cart, Rx, payment → invoice fields |

**Files:** `services/invoice.mapper.ts`, `models/invoice.models.ts`

## BrandService — **Done**

| Item | Value |
|------|--------|
| **Endpoint** | `GET products/GetBrand?BrandName={name}` |

**Files:** `services/brand.service.ts`, `models/brand.models.ts`

## OrderLenseService — **Done**

| Item | Value |
|------|--------|
| **Endpoint** | `GET prescriptions/GetOrderLense?SalesId={id}` |

**Consumer (planned):** [latest-prescription-summary](../components/latest-prescription-summary/spec.md)

## Mock data (Phase 1–2)

**File:** `services/sell.mock-data.ts`

- `MOCK_PRODUCTS` with optional `barcode` per SKU
- `findProductBySku()`, `findProductByBarcode()`, `filterProducts()`
- Seed cart: frame + lenses (subtotal 1,100 → payable ~1,265 with VAT)

## CustomerSearchService — **Done** (header)

| Item | Value |
|------|--------|
| **Endpoint** | `GET sales/customersearchfilter?mobileNumber={query}` |
| **Consumer** | app-header → `SellSessionStore.selectCustomer()` |

## Phase 3 roadmap

| Service | Endpoint / feature | Status |
|---------|-------------------|--------|
| Brand | `products/GetBrand` | **Done** |
| Order lens | `prescriptions/GetOrderLense` | **Done** (UI wiring TBD) |
| Catalog products | TBD | Planned |
| Customer search | `sales/customersearchfilter` | **Done** |
| Checkout / payment | TBD | Planned |
| Daily / cash reports | TBD | Planned |
| Open / close register | TBD | Planned |
| Invoice persist + print | TBD | Planned |

## App settings

```json
{
  "getBrandPath": "products/GetBrand",
  "getOrderLensePath": "prescriptions/GetOrderLense",
  "customerSearchPath": "sales/customersearchfilter",
  "insertSalesPath": "sales/InsertSales",
  "vatRate": 0.15,
  "currencyCode": "SAR"
}
```
