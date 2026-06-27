---
feature: prescription-create
status: draft
spec: ./spec.md
project: optical-pos
updated: 2026-06-28
depends_on: specs/002-common-components
---

# Implementation plan — Prescription create

## Spec reference

- Feature spec: [`specs/003-prescription-create/spec.md`](./spec.md)
- Data model: [`data-model.md`](./data-model.md)
- Visual references:
  - [`raw-knowledge/files/POSScreen.png`](../../raw-knowledge/files/POSScreen.png) — eye Rx grid + shell
  - [`raw-knowledge/files/frameprescription.jpeg`](../../raw-knowledge/files/frameprescription.jpeg) — frame lines + Rx (adapt to mobile cards)
  - [`raw-knowledge/files/framelensprescription.jpeg`](../../raw-knowledge/files/framelensprescription.jpeg) — frames + lenses + Rx
- Sell tab summary (read-only): [`specs/005-sell-dashboard/spec.md`](../005-sell-dashboard/spec.md)

## Goal

Deliver a **PrescriptionFormComponent** at `/home/prescription` with collapsible **FRAMES** and **LENSES** accordions, OD/OS grid, shared measurements, customer banner from `SellSessionStore`, and Save / Print / Cancel. **Date and doctor are not on this tab.** Mock save updates Sell **Latest Prescription** and per-customer history via `SellSessionStore`. **PrescriptionHistoryComponent** at `/home/prescription/history` supports selection and **View on Sell Dashboard**. **Phase 3 — Prescription API integration** replaces in-memory persistence with server APIs.

## Current status

| Phase | Status | Notes |
|-------|--------|--------|
| **1 — UI shell** | **Done** | Form layout, routing, stub print |
| **2 — Validation & UX** | **Done** | Validators, dirty guard, inline messages, unit tests |
| **2b — Frames & lenses (mock)** | **Done** | Accordions, frame/lens line components, computed totals |
| **2c — Mock persistence & Sell sync** | **Done** | `applySavedPrescription`, `toPrescriptionSummary`, latest Rx on Sell |
| **3 — Prescription API integration** | **Next** | Server save/load; replace in-memory store |
| **4 — History (mock)** | **Done** | `/home/prescription/history`, selection, View on Sell |
| **4b — History API** | Planned | Load history list from server |

**App path:** `optical-pos-angular-capacitor-ux/`  
**Routes today:**
- `/home/prescription` → `PrescriptionFormComponent`
- `/home/prescription/history` → `PrescriptionHistoryComponent` (lazy-loaded)  
**Shell:** `PosShellComponent` + tablet header + bottom nav ([`002-common-components`](../002-common-components/spec.md))

## Technical approach

### File structure (implemented)

```
optical-pos-angular-capacitor-ux/src/app/
├── features/pos/
│   └── prescription/
│       ├── prescription-form.component.ts
│       ├── prescription-form.component.html
│       ├── prescription-form.component.css
│       ├── prescription-form.component.spec.ts
│       ├── prescription-history.component.ts
│       ├── prescription-history.component.html
│       ├── prescription-history.component.css
│       ├── prescription-history.component.spec.ts
│       ├── prescription-frame-line/
│       │   ├── prescription-frame-line.component.ts
│       │   ├── prescription-frame-line.component.html
│       │   └── prescription-frame-line.component.css
│       ├── prescription-lens-line/
│       │   ├── prescription-lens-line.component.ts
│       │   ├── prescription-lens-line.component.html
│       │   └── prescription-lens-line.component.css
│       ├── models/
│       │   ├── prescription.models.ts
│       │   └── prescription.validators.ts
│       └── services/
│           ├── prescription.service.ts
│           └── prescription.service.spec.ts
├── shared/ui/
│   └── prescription-grid/
│       ├── prescription-grid.component.ts
│       ├── prescription-grid.component.html
│       └── prescription-grid.component.css
└── app.routes.ts                        # prescription + prescription/history children
```

**Sell feature (cross-tab):**

```
features/pos/sell/services/
├── sell-session.store.ts              # latestPrescription, prescriptionHistory, applySavedPrescription
└── prescription-summary.mapper.ts     # PrescriptionRecord → PrescriptionSummary
```

### Routing

Child of `PosShellComponent`:

```typescript
{
  path: 'prescription',
  children: [
    { path: '', component: PrescriptionFormComponent },
    { path: 'history', loadComponent: () => import('...PrescriptionHistoryComponent') },
  ],
}
```

`PosShellComponent` sets active tab to **prescription** when URL contains `/home/prescription` (including history).

Bottom nav navigates to `/home/prescription` via `PosShellComponent.onTabChange`. Sell dashboard **+ New Prescription** uses `router.navigate(['/home/prescription'])`. **View All** / **View History** use `router.navigate(['/home/prescription/history'])`.

### PrescriptionFormComponent

**Reactive form shape (implemented):**

```typescript
form = fb.group({
  orderLensEnabled: [false],
  frames: fb.array([createFrameLineGroup()]),   // FormArray
  lenses: fb.array([]),                         // FormArray; populated when Order Lens on
  rightEye: fb.group({ sph, cyl, axis, add }),  // optionalDecimalValidator / optionalAxisValidator
  leftEye: fb.group({ sph, cyl, axis, add }),
  pd: [null, optionalDecimalValidator(20, 85)],
  nearPd: [null, optionalDecimalValidator(0, 85)],
  vd: [null, optionalDecimalValidator(0, 30)],
  notes: [''],
});
```

Form element: `novalidate`. PD / Near PD / VD inputs: `step="any"`.

**Frame line group:** `category`, `brandName` (required), `modelNo` (required), `sellingPrice`, `quantity` (min 1), `discountPercent` (0–100).

**Lens line group:** `category`, `orderLens` (required when section active), `price`, `quantity` (min 1).

**Accordions:**

| Section | Default | Behavior |
|---------|---------|----------|
| FRAMES | Expanded | Tap header to collapse; **+ Add Frame** adds line |
| LENSES | Collapsed | **Order Lens** toggle enables section; auto-expands and adds first line |

**Actions (implemented):**

| Action | Phase 1–2 | Phase 3 |
|--------|-----------|---------|
| Save | `PrescriptionService.save()` mock → `applySavedPrescription(record)` on Sell store | Sale order / prescription API |
| Print | Info message when no save / mock mode | `GET /prescriptions/{id}/print` or native bridge |
| Cancel | `resetToDefaults()` + confirm if dirty | same |
| + New Prescription | same as cancel flow | same |

**Save validation:**

- Selected customer required (`SellSessionStore.selectedCustomer()`)
- Each frame line: `brandName` and `modelNo` required
- When `orderLensEnabled`: each lens line `orderLens` required
- Rx fields: existing optional decimal / axis validators

**Default form value:** `createDefaultPrescriptionFormValue()` — one empty frame, lenses off, empty Rx fields. **No date or doctor.**

### PrescriptionFrameLineComponent / PrescriptionLensLineComponent

Presentational cards bound to `FormGroup` per line. Frame card shows computed **Discount** and **Total Selling Price** via `calculateFrameLineTotals()`. Lens card shows computed **Total** via `calculateLensLineTotal()`.

### PrescriptionGridComponent

Shared sub-component in `shared/ui/prescription-grid/` — renders SPH, CYL, AXIS, ADD for one eye with reactive form group binding.

### PrescriptionService

| Method | Mock (`useMockPrescription: true`) | API (`false`) |
|--------|-----------------------------------|---------------|
| `getDoctors()` | Returns `MOCK_DOCTORS` | `GET {apiUrl}/doctors` — **not used by form** |
| `save(payload)` | `mockSave()` → `rx-mock-{timestamp}` | `POST {apiUrl}/prescriptions` (TBD: sale order endpoint) |
| `print(id)` | Rejects (stub message in UI) | `GET {apiUrl}/prescriptions/{id}/print` |
| `getLastSaved()` | In-memory last mock/API record | same |

Mock save stores in `PrescriptionService.lastSaved` and calls `SellSessionStore.applySavedPrescription(record)` from the form on success.

### SellSessionStore (mock persistence)

| Signal / method | Purpose |
|-----------------|---------|
| `latestPrescription` | Computed `PrescriptionSummary` for selected customer |
| `prescriptionHistory` | Computed `SavedPrescriptionListItem[]` for selected customer |
| `applySavedPrescription(record)` | Map record → summary; update latest + prepend history |
| `selectPrescriptionFromHistory(id)` | Set latest Rx from history selection |

Storage: in-memory `Record<customerId, …>` — cleared on refresh.

### PrescriptionHistoryComponent

- Route: `/home/prescription/history`
- Radio-style selectable cards per saved Rx
- **View on Sell Dashboard** → `selectPrescriptionFromHistory` + navigate to `/home/sell`
- **← Back to Sell**, **+ New Prescription** (empty state)

**Phase 3 load:** reuse `OrderLenseService.getOrderLense(salesId)` from sell feature for lenses + OD/OS pre-fill ([`005`](../005-sell-dashboard/services/spec.md)).

### Layout CSS

- Outer: `.prescription-page` padding inside shell content safe areas
- Card: `.prescription-card` white, border, radius 12px
- Accordions: `.prescription-accordion` with chevron, summary line (item count / lens total)
- Frame/lens lines: stacked cards on phone; responsive grid on tablet
- Body grid: OD/OS two columns on `≥640px`; shared fields third column on tablet (canonical rules in [`002-common-components`](../002-common-components/spec.md#responsive-breakpoints-canonical))
- Footer: `.prescription-actions` — primary Save full width; Print + Cancel row
- Customer banner: info when no customer; name when selected
- Messages: success / error / info inline banners with `role="status"` / `role="alert"`

### Config flag

`src/config/appsettings.json`:

```json
"useMockPrescription": true
```

`appsettings.prod.json`:

```json
"useMockPrescription": false
```

When `false`, `PrescriptionService` calls real API (mirror `useMockAuth` pattern). Default mock when flag omitted (`!== false`).

### Cross-tab integration (Sell dashboard)

| Sell action | Current behavior |
|-------------|------------------|
| **+ New Prescription** | `router.navigate(['/home/prescription'])` |
| **View All** | `router.navigate(['/home/prescription/history'])` |
| **View History** | Same as View All |
| Save on Prescription tab | `applySavedPrescription` → updates latest + history |
| History selection | `selectPrescriptionFromHistory` → updates latest on Sell |

## Phased delivery

### Phase 1 — UI shell ✅

| Task | Status |
|------|--------|
| Create `PrescriptionFormComponent` + template + CSS | Done |
| Create `PrescriptionGridComponent` | Done |
| Wire route `/home/prescription` | Done |
| Save / Print / Cancel button stubs | Done |
| Copy matches spec table | Done |

**Outcome:** Prescription tab shows form on tablet and phone.

### Phase 2 — Validation & UX ✅

| Task | Status |
|------|--------|
| `optionalDecimalValidator` / `optionalAxisValidator` | Done |
| Dirty confirm on Cancel and + New Prescription | Done |
| Inline success / error / info messages | Done |
| Unit tests: form, save, axis range, cancel | Done |
| `PrescriptionService` mock save + lastSaved | Done |

**Outcome:** Production-ready client Rx form on mock data.

### Phase 2b — Frames & lenses (mock) ✅

| Task | Status |
|------|--------|
| `PrescriptionFrameLine` / `PrescriptionLensLine` models + helpers | Done |
| `PrescriptionFrameLineComponent` / `PrescriptionLensLineComponent` | Done |
| FRAMES / LENSES accordions with Order Lens toggle | Done |
| Frame brand/model required; lens order text when enabled | Done |
| Computed discount and totals | Done |
| Customer banner + save requires customer | Done |
| Remove date/doctor from form | Done |
| Unit tests updated | Done |

**Outcome:** Full mock order capture (frames + optional lenses + Rx) on Prescription tab.

### Phase 2c — Mock persistence & Sell sync ✅

| Task | Status |
|------|--------|
| `toPrescriptionSummary()` mapper | Done |
| `SellSessionStore.applySavedPrescription()` | Done |
| `latestPrescription` computed from per-customer map | Done |
| Form calls store after successful save | Done |
| Unit tests for mapper + form save hook | Done |

**Outcome:** Saved Rx visible on Sell **Latest Prescription** card.

### Phase 3 — Prescription API integration (next)

| Task | Detail |
|------|--------|
| OpenAPI contracts | Prescription + sale line paths under `ai-workspace/contracts/openapi/` |
| Verify save payload | frames[], lenses[], Rx — align with [`data-model.md`](./data-model.md) |
| `GET prescriptions/GetOrderLense` | Pre-fill lenses + OD/OS when `salesId` present |
| Frame lines load | Confirm endpoint with backend (sale lines API) |
| Customer id from session | Already wired via `SellSessionStore` |
| Brand autocomplete | Optional: `BrandService` from sell feature |
| Print endpoint | PDF URL or defer native bridge |
| Prod config | `useMockPrescription: false` already in `appsettings.prod.json` |
| Integration tests | Service tests with mocked `fetch` |

**Outcome:** Persisted order lines + Rx linked to real customers and sales.

### Phase 4 — History (mock) ✅

| Task | Status |
|------|--------|
| `PrescriptionHistoryComponent` + route `/home/prescription/history` | Done |
| Wire Sell **View All** / **View History** | Done |
| Selectable list + **View on Sell Dashboard** | Done |
| `selectPrescriptionFromHistory` on `SellSessionStore` | Done |
| Unit tests for history component + sell navigation | Done |

**Outcome:** Review and pick saved Rx from Sell via history page.

### Phase 4b — History API (planned)

| Task | Detail |
|------|--------|
| `GET /customers/{id}/prescriptions` | Replace in-memory history |
| Edit from history row | Pre-fill Prescription form (product decision) |
| Sync latest summary after API save | Coordinate with [`005`](../005-sell-dashboard/plan.md) Phase 3 |

## Components affected

| Area | Path | Change |
|------|------|--------|
| Routes | `app.routes.ts` | ✅ prescription + history children |
| Prescription feature | `features/pos/prescription/*` | ✅ Form + history |
| Prescription grid | `shared/ui/prescription-grid/*` | ✅ Implemented |
| Sell session | `features/pos/sell/sell-session.store.ts` | ✅ Mock persistence + history |
| Sell mapper | `features/pos/sell/services/prescription-summary.mapper.ts` | ✅ Implemented |
| Sell dashboard | `features/pos/sell/sell-dashboard.component.ts` | ✅ View All / View History navigation |
| Contracts | `ai-workspace/contracts/openapi/` | Phase 3 |

## Test strategy

### Unit (implemented)

| Target | Cases |
|--------|--------|
| `PrescriptionFormComponent` | Renders headings/buttons; frame/lens accordions; blocks save without customer; frame brand/model required; cancel reset |
| `PrescriptionHistoryComponent` | Selection, view on sell, back navigation |
| `toPrescriptionSummary` | Maps record fields to display strings |
| `PrescriptionFormComponent` | Calls `applySavedPrescription` after save |

### Unit (Phase 3+)

| Target | Cases |
|--------|--------|
| `PrescriptionService` API mode | Mock `fetch` for save, print, load |
| `OrderLenseService` integration | Pre-fill form from `GetOrderLense` response |
| Session customer id | Payload includes selected customer |

### Manual / visual

- [x] Prescription tab active state in bottom nav
- [x] Mobile-first frame/lens cards at 375px and tablet breakpoints
- [x] FRAMES expanded by default; LENSES collapsed until Order Lens on
- [x] Save / Print / Cancel visible and styled correctly
- [x] Sell **+ New Prescription** opens Prescription tab form
- [x] Customer banner when customer selected; warning when not

## Definition of done

### Phase 1–2b (MVP) ✅

- [x] `PrescriptionFormComponent` at `/home/prescription`
- [x] All labels and buttons match spec copy table
- [x] FRAMES / LENSES accordions with line components
- [x] OD/OS + shared fields via `PrescriptionGridComponent`
- [x] Mock save, stub print, cancel reset with dirty confirm
- [x] Customer required for save; banner from `SellSessionStore`
- [x] Save updates Sell latest Rx and history (mock)
- [x] History route with selection from Sell View All
- [x] No date or doctor fields
- [x] Unit tests for form, mapper, history, sell navigation

### Phase 3

- [ ] `PrescriptionService` API mode verified with `useMockPrescription: false`
- [ ] Save via API with frames, lenses, Rx, and session customer id
- [ ] Load via `GetOrderLense` (and frame lines endpoint when defined)
- [ ] OpenAPI YAML in `ai-workspace/contracts/openapi/`
- [ ] Print endpoint integrated or documented deferral

### Phase 4b

- [ ] History list from API
- [ ] Optional: open history row in Prescription form for edit

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Customer id mismatch between Sell and Prescription tabs | `SellSessionStore` injected; save blocked without customer |
| Frame/lens API shape differs from ERP tables | Map DTOs in service layer; UI stays card-based |
| Near PD domain ambiguity | Confirm with clinical team before API contract freeze |
| Print requires native plugin | Phase 3 API PDF minimum; Capacitor print documented deferral |
| Duplicate Rx summary ownership (003 vs 005) | Summary read-only on Sell ([`005`](../005-sell-dashboard/spec.md)); full form here |

## Related

- Spec: [`./spec.md`](./spec.md)
- Shell / header: [`../002-common-components/`](../002-common-components/)
- Sell dashboard summary: [`../005-sell-dashboard/`](../005-sell-dashboard/)
- Auth API pattern: [`../001-staff-login/`](../001-staff-login/) Phase 3
- Measurements tab: [`../004-measurements-create/`](../004-measurements-create/)
- Architecture: [`knowledge/architecture/pos-dashboard-components.md`](../../knowledge/architecture/pos-dashboard-components.md)
