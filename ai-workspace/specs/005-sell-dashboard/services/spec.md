---
area: sell-services
parent: specs/005-sell-dashboard
status: in-progress
created: 2026-06-20
updated: 2026-06-24
---

# Sell tab — services & state

**Parent index:** [`../spec.md`](../spec.md)

Shared services under `src/app/features/pos/sell/services/`.

## SellSessionStore (central state)

| Signal / method | Purpose |
|-----------------|---------|
| `selectedCustomer` | Active customer for sale |
| `latestPrescription` | Rx summary (mock → `GetOrderLense`) |
| `catalogCategory`, `catalogSearch` | Catalog filters |
| `filteredProducts` | Computed product list |
| `cartItems` | Cart lines |
| `paymentDraft`, `paymentTotals` | Checkout state |
| `canPay` | Customer + cart required |
| `searchAndSelectCustomer()` | Legacy mock search (not used by header) |
| `selectCustomer(customer)` | Set active customer (header search + create flow) |
| `selectCreatedCustomer()` | After [`006-create-customer`](../../../006-create-customer/spec.md) |
| `addProductToCart()` | Catalog → cart |

**File:** `services/sell-session.store.ts`

## PaymentService

- `calculateTotals(subtotal, draft)` — discount, VAT, loyalty, payable
- VAT rate from `AppConfigService.vatRate`

**File:** `services/payment.service.ts`

## BrandService — **Done**

| Item | Value |
|------|--------|
| **Endpoint** | `GET products/GetBrand?BrandName={name}` |
| **Config** | `getBrandPath` in appsettings |
| **Returns** | `BrandOption[]` (`brandId`, `brandName`) |

**Files:** `services/brand.service.ts`, `models/brand.models.ts`

## OrderLenseService — **Done**

| Item | Value |
|------|--------|
| **Endpoint** | `GET prescriptions/GetOrderLense?SalesId={id}` |
| **Config** | `getOrderLensePath` in appsettings |
| **Returns** | `OrderLenseOrder` — lenses[], od, os, additional readings |

**Files:** `services/order-lense.service.ts`, `models/order-lense.models.ts`

**Consumer (planned):** [latest-prescription-summary](../components/latest-prescription-summary/spec.md)

## Mock data (Phase 1–2)

**File:** `services/sell.mock-data.ts` — products, seed cart (customer search now live via header)

## CustomerSearchService — **Done** (header)

| Item | Value |
|------|--------|
| **Endpoint** | `GET sales/customersearchfilter?mobileNumber={query}` |
| **Config** | `customerSearchPath` in appsettings |
| **Consumer** | [`002` app-header](../../../002-common-components/components/app-header/spec.md) → `PosShellComponent` → `SellSessionStore.selectCustomer()` |

**Files:** `features/pos/customer/services/customer-search.service.ts`, `models/customer-search.models.ts`

## Related (outside sell/)

| Service | Location | Role |
|---------|----------|------|
| `CustomerSessionService` | `features/pos/customer/services/` | Post-create customer persistence |
| `CustomerService` | `features/pos/customer/services/` | `InsertSales` |
| `CustomerSearchService` | `features/pos/customer/services/` | Header customer lookup |

## Phase 3 roadmap

| Service | Endpoint | Status |
|---------|----------|--------|
| Brand | `products/GetBrand` | **Done** |
| Order lens | `prescriptions/GetOrderLense` | **Done** (not wired to UI) |
| Catalog products | TBD | Planned |
| Customer search | `sales/customersearchfilter` | **Done** (header) |
| Payment / order complete | TBD | Planned |

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
