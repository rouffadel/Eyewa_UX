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
| `prescriptionRecordByCustomer` | Full `PrescriptionRecord` for cart restore from history |
| `catalogCategory`, `catalogSearch` | Catalog filters |
| `filteredProducts` | Computed product list |
| `cartItems`, `cartSubtotal`, `cartItemCount` | Cart lines — **starts empty** on Sell load |
| `paymentDraft`, `paymentTotals`, `canPay` | Checkout state |
| `lastInvoice` | Built on **Pay & Print** for invoice preview |
| `statusMessage`, `addToCartBlockedMessage` | Dashboard banners |
| `selectCustomer()` / `selectCreatedCustomer()` | Header + create flow |
| `applySavedPrescription()` | Prescription tab → latest Rx + history + cart sync |
| `syncCartFromPrescription(record)` | Maps saved frames/lenses to cart (`rx-*` line ids) |
| `selectPrescriptionFromHistory(id)` | History selection; syncs cart when full record stored |
| `addProductToCart()` | Catalog → cart (customer required) |
| `scanProductBarcode()` / `applyScannedBarcode()` | Barcode → search + cart |
| `setPaymentMethod()`, `setMixedCashAmount()`, `setMixedCardAmount()` | Payment draft |
| `pay(staffName)` | Validate → mock payment → toast; stay on Sell |
| `payAndPrint(staffName)` | Validate → build invoice → navigate invoice |
| `runPaymentRegisterAction()` | Register/report stubs |

**Cart behavior:**

- Initial `cartItems` is `[]` (no seed data).
- Prescription save replaces lines with `lineId` starting `rx-`; catalog lines remain.
- Payment totals recalculate after prescription sync.

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

## Prescription cart mapper — **Done**

| Function | Purpose |
|----------|---------|
| `cartItemsFromPrescription(record)` | Frame/lens lines → `CartLineItem[]` with discounts |
| `isPrescriptionCartLine(item)` | True when `lineId` starts with `rx-` |

**File:** `services/prescription-cart.mapper.ts`

## BrandService — **Done**

| Item | Value |
|------|--------|
| **Endpoint** | `GET products/GetBrand?BrandName={name}` (prod: `Admin/GetBrand`) |
| **Response** | `objresult` array: `{ BrandID, BrandName }` (also legacy `objresult.table` + camelCase) |
| **Maps to** | `{ brandId, brandName }[]` |
| **Consumer** | `PrescriptionFrameLineComponent` brand autocomplete |

**Files:** `services/brand.service.ts`, `models/brand.models.ts`

## CategoryService — **Done** (prescription feature)

| Item | Value |
|------|--------|
| **Endpoint** | `GET products/FillCategory?CategoryType=Frame\|Lens` |
| **Maps to** | `{ categoryId, categoryName }[]` |
| **Fallback** | `FRAME_CATEGORIES` / `LENS_CATEGORIES` mock lists on API failure |
| **Consumer** | `PrescriptionFormComponent` → frame/lens line category selects |

**Files:** `prescription/services/category.service.ts`, `prescription/models/category.models.ts`

## OrderLenseService — **Done**

| Item | Value |
|------|--------|
| **Endpoint** | `GET prescriptions/GetOrderLense?SalesId={id}` |

**Consumer (planned):** [latest-prescription-summary](../components/latest-prescription-summary/spec.md), prescription form pre-fill

## Mock data (Phase 1–2)

**File:** `services/sell.mock-data.ts`

- `MOCK_PRODUCTS` with optional `barcode` per SKU
- `findProductBySku()`, `findProductByBarcode()`, `filterProducts()`
- **No seed cart** — cart starts empty until catalog add or prescription save

## CustomerSearchService — **Done** (header)

| Item | Value |
|------|--------|
| **Endpoint** | `GET sales/customersearchfilter?mobileNumber={query}` |
| **Consumer** | app-header → `SellSessionStore.selectCustomer()` |

## Phase 3 roadmap

| Service | Endpoint / feature | Status |
|---------|-------------------|--------|
| Brand | `products/GetBrand` | **Done** |
| Categories | `products/FillCategory` | **Done** |
| Prescription → cart | `prescription-cart.mapper` + store sync | **Done** |
| Order lens | `prescriptions/GetOrderLense` | **Done** (form pre-fill TBD) |
| Catalog products | TBD | Planned |
| Customer search | `sales/customersearchfilter` | **Done** |
| Checkout / payment | TBD | Planned |
| Daily / cash reports | TBD | Planned |
| Open / close register | TBD | Planned |
| Invoice persist + print | TBD | Planned |
| Cart persistence | Server order draft | Planned |

## App settings

```json
{
  "getBrandPath": "products/GetBrand",
  "fillCategoryPath": "products/FillCategory",
  "frameCategoryType": "Frame",
  "lensCategoryType": "Lens",
  "getOrderLensePath": "prescriptions/GetOrderLense",
  "customerSearchPath": "sales/customersearchfilter",
  "insertSalesPath": "sales/InsertSales",
  "vatRate": 0.15,
  "currencyCode": "SAR"
}
```

Prod overrides: `getBrandPath` → `Admin/GetBrand`, `getOrderLensePath` → `Admin/GetOrderLense`.
