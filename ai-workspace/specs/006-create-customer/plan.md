---
feature: create-customer
status: in-progress
spec: ./spec.md
project: optical-pos
updated: 2026-06-23
depends_on: specs/001-staff-login, specs/002-common-components
---

# Implementation plan — Create customer

## Spec reference

- Feature spec: [`specs/006-create-customer/spec.md`](./spec.md)
- Auth + stores: [`specs/001-staff-login/spec.md`](../001-staff-login/spec.md)
- Header entry: [`specs/002-common-components/spec.md`](../002-common-components/spec.md)
- Sell tab customer card: [`specs/005-sell-dashboard/spec.md`](../005-sell-dashboard/spec.md)

## Goal

Deliver **CreateCustomerFormComponent** at `/home/createcustomer` with customer fields and **Save** wired to Eyewa **`sales/InsertSales`**. Open from header **+ New Customer**; hide POS shell chrome; return via Back to previous tab.

## Current status

| Phase | Status | Notes |
|-------|--------|--------|
| **1 — UI shell** | **Done** | Route, form, back bar, chrome hide |
| **2 — InsertSales API** | **Done** | Live POST, validation, tests |
| **3 — Sell integration** | Planned | `SellSessionStore` after save |
| **4 — Search / lookup** | Planned | Customer search API |

**App path:** `optical-pos-angular-capacitor-ux/`  
**Route:** `/home/createcustomer` → `CreateCustomerFormComponent`  
**Shell:** Chrome hidden (same as profile)

## Technical approach

### File structure (implemented)

```
optical-pos-angular-capacitor-ux/src/app/
├── features/pos/
│   └── customer/
│       ├── create-customer-form.component.ts
│       ├── create-customer-form.component.html
│       ├── create-customer-form.component.css
│       ├── create-customer-form.component.spec.ts
│       ├── models/
│       │   └── customer-sales.models.ts
│       └── services/
│           ├── customer.service.ts
│           └── customer.service.spec.ts
├── features/auth/services/
│   ├── store.service.ts              # FillStore — store dropdown
│   └── auth.service.ts               # loginId, selectedStore
├── features/pos/shell/
│   └── pos-shell.component.ts        # onNewCustomer, hideShellChrome
└── app.routes.ts                     # createcustomer child route
```

### Routing

Child of `PosShellComponent` (authenticated):

```typescript
{ path: 'createcustomer', component: CreateCustomerFormComponent }
```

**Navigation in:**

```typescript
// pos-shell.component.ts
protected onNewCustomer(): void {
  void this.router.navigate(['/home/createcustomer'], {
    queryParams: { returnTo: this.activeTab() },
  });
}
```

**Chrome hide:**

```typescript
this.hideShellChrome.set(segment === 'profile' || segment === 'createcustomer');
```

### CreateCustomerFormComponent

**Reactive form:**

```typescript
form = fb.group({
  storeId: ['', Validators.required],
  customerName: ['', Validators.required],
  customerNo: ['', Validators.required],
  invoiceNo: [''],
});
```

**Read-only invoice date:** `invoiceDateLabel = formatInvoiceDate()` — not a form control; sent on save only.

**Store load (`ngOnInit`):**

1. `StoreService.fillStores(loginId, 0)`
2. Pre-select `authService.selectedStore()?.storeId` or first store
3. Disable store control while loading; enable when stores arrive

**Save payload assembly:**

```typescript
{
  storeId: String(raw.storeId),
  customerName: raw.customerName.trim(),
  customerNo: raw.customerNo.trim(),
  loginId: String(authService.user().loginId),
  invoiceNo: raw.invoiceNo.trim() ?? '',
  invoiceDate: formatInvoiceDate(),  // e.g. "18-6-2026"
}
```

### CustomerService

| Method | Implementation |
|--------|----------------|
| `insertSales(payload)` | `HttpClient.post<InsertSalesResponse>(url, payload)` |
| URL | `{apiUrl}/{insertSalesPath}` default `sales/InsertSales` (dev) |
| Success | Requires `objresult[0].ID` (or legacy `objresult.table[0].id`); returns `invoiceNo`, `customerNo`, `id` |
| Errors | Safe `Error` messages; no raw HTTP body in UI |

No mock path — always calls live API (same as `StoreService`).

### Date formatting

```typescript
export function formatInvoiceDate(date: Date = new Date()): string {
  return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
}
```

Matches Eyewa demo format (`22-6-2026`).

### Config

`src/config/appsettings.json` and `appsettings.prod.json`:

```json
{
  "apiUrl": "https://demo.api.eyewacloud.com/api",
  "storesPath": "stores/FillStore",
  "insertSalesPath": "sales/InsertSales",
  "customerSearchPath": "sales/customersearchfilter"
}
```

### Layout CSS

- Page: `.create-customer-page` — full height white background
- Top bar: `.create-customer-page__top-bar` — mirrors profile back bar
- Form: `.create-customer-card` — stacked fields, max-width 480px on tablet
- Fields: `.create-customer-field` — label + input, 44px min height
- Save: `.create-customer-actions__save` — full-width `--color-pos-accent`
- Messages: success (green) / error (red) banners

## Phased delivery

### Phase 1 — UI shell ✅

| Task | Status |
|------|--------|
| Create `CreateCustomerFormComponent` + template + CSS | Done |
| Route `/home/createcustomer` | Done |
| Hide shell chrome on route | Done |
| Wire header **+ New Customer** | Done |
| Back navigation with `returnTo` | Done |
| Store dropdown (FillStore) | Done |
| Read-only invoice date | Done |

**Outcome:** Navigable create-customer screen with all fields.

### Phase 2 — InsertSales API ✅

| Task | Status |
|------|--------|
| `CustomerService.insertSales()` POST | Done |
| `customer-sales.models.ts` payload/response types | Done |
| Form validation + save feedback | Done |
| `insertSalesPath` in appsettings | Done |
| Unit tests: service POST + form save | Done |

**Outcome:** End-to-end save against Eyewa demo API.

### Phase 3 — Sell integration (next)

| Task | Detail |
|------|--------|
| Map `InsertSalesResult` → `Customer` model | Extend `sell/models/customer.models.ts` or adapter |
| `SellSessionStore.selectCustomer()` after save | Name, mobile, id from API `id` / `customerNo` |
| Auto-navigate to Sell (optional UX) | `goBack()` after 1s or explicit "Continue" button |
| Update [`005-sell-dashboard`](../005-sell-dashboard/spec.md) | Replace "New Customer stub" note |

**Outcome:** Create → Sell flow without manual search.

### Phase 4 — Search / lookup

| Task | Detail |
|------|--------|
| Customer search API | Wire header search to real endpoint |
| Duplicate mobile warning | Pre-save check if API supports |
| Edit existing customer route | Out of scope unless specified |

## Components affected

| Area | Path | Change |
|------|------|--------|
| Routes | `app.routes.ts` | ✅ `CreateCustomerFormComponent` |
| Customer feature | `features/pos/customer/*` | ✅ Implemented |
| Shell | `pos-shell.component.ts` | ✅ navigate + hide chrome |
| Config | `src/config/appsettings*.json` | ✅ `insertSalesPath` |
| Sell session | `sell/services/sell-session.store.ts` | Phase 3 |
| Specs cross-ref | `002-common-components/spec.md` | Update "New customer stub" out of scope |

## Test strategy

### Unit (implemented)

| Target | Cases |
|--------|--------|
| `CustomerService` | POST URL, body, response mapping |
| `CreateCustomerFormComponent` | Renders fields; save calls service with payload |

### Unit (Phase 3+)

| Target | Cases |
|--------|--------|
| Post-save navigation | `SellSessionStore` updated |
| Store pre-select | Uses `selectedStore` from session |

### Manual / E2E

- [x] **+ New Customer** opens create screen
- [x] Store dropdown shows API stores
- [x] Save creates record; invoice number in success message
- [x] Back returns to Sell tab
- [ ] Phase 3: new customer visible on Sell dashboard
- [ ] iOS safe area on top bar and Save button

## Definition of done

### Phase 1–2 (MVP) ✅

- [x] `CreateCustomerFormComponent` at `/home/createcustomer`
- [x] All form fields per spec
- [x] Live `InsertSales` API integration
- [x] Header navigation wired
- [x] Unit tests passing
- [ ] Product QA sign-off on tablet layout

### Phase 3

- [ ] Sell tab shows customer after save
- [ ] Documented mapping from API result to sell customer model

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| API path casing (`Admin` vs `sales`) | Config key `insertSalesPath`; dev uses `sales/InsertSales`, prod may use `Admin/InsertSales` |
| Invoice date timezone | Use local device date; document if server expects store timezone |
| No customer id in obvious field | Use `objresult.table[0].id` as sales record id until customer API clarified |
| Duplicate creates on double-tap Save | Disable button while `isSaving()` (implemented) |
| Sell dashboard still mock customer | Phase 3 coordinates with [`005`](../005-sell-dashboard/spec.md) |

## Related

- Spec: [`./spec.md`](./spec.md)
- Login / stores: [`../001-staff-login/`](../001-staff-login/)
- Header: [`../002-common-components/`](../002-common-components/)
- Sell dashboard: [`../005-sell-dashboard/`](../005-sell-dashboard/)
