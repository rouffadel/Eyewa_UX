---
feature: prescription-create
status: draft
spec: ./spec.md
project: optical-pos
updated: 2026-06-20
depends_on: specs/002-common-components
---

# Implementation plan — Prescription create

## Spec reference

- Feature spec: [`specs/003-prescription-create/spec.md`](./spec.md)
- Data model: [`data-model.md`](./data-model.md)
- Visual reference: [`raw-knowledge/files/POSScreen.png`](../../raw-knowledge/files/POSScreen.png) — prescription panel (Prescription tab / lower-left)
- Sell tab summary (read-only): [`specs/005-sell-dashboard/spec.md`](../005-sell-dashboard/spec.md)

## Goal

Deliver a **PrescriptionFormComponent** at `/home/prescription` that matches the reference card: date, doctor, OD/OS grid, shared measurements, and Save / Print / Cancel. Phase 1–2 use mock doctors and mock save; **Phase 3 — Prescription API integration** is the next backend milestone (same pattern as staff-login Phase 3). **Phase 4** connects Sell dashboard history actions and customer session.

## Current status

| Phase | Status | Notes |
|-------|--------|--------|
| **1 — UI shell** | **Done** | Form layout, routing, mock doctors, stub print |
| **2 — Validation & UX** | **Done** | Validators, dirty guard, inline messages, unit tests |
| **3 — Prescription API integration** | **Next** | Service scaffold exists; OpenAPI + load-latest + session customer |
| **4 — History & list** | Planned | View All / View History from Sell; history route |

**App path:** `optical-pos-angular-capacitor-ux/`  
**Route today:** `/home/prescription` → `PrescriptionFormComponent`  
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
└── app.routes.ts                        # prescription → PrescriptionFormComponent
```

### Routing

Child of `PosShellComponent`:

```typescript
{
  path: 'prescription',
  component: PrescriptionFormComponent,
}
```

Bottom nav navigates to `/home/prescription` via `PosShellComponent.onTabChange`. Sell dashboard **+ New Prescription** uses `router.navigate(['/home/prescription'])`.

### PrescriptionFormComponent

**Reactive form groups:**

```typescript
form = fb.group({
  prescriptionDate: ['', Validators.required],
  doctorId: ['', Validators.required],
  rightEye: fb.group({ sph, cyl, axis, add }),  // optionalDecimalValidator / optionalAxisValidator
  leftEye: fb.group({ sph, cyl, axis, add }),
  pd: [null, optionalDecimalValidator(40, 80)],
  nearPd: [null, optionalDecimalValidator(0, 20)],
  vd: [null, optionalDecimalValidator(0, 30)],
  notes: [''],
});
```

**Actions (implemented):**

| Action | Phase 1–2 | Phase 3 |
|--------|-----------|---------|
| Save | `PrescriptionService.save()` mock + inline success | `POST /prescriptions` (fetch scaffold in service) |
| Print | Info message when no save / mock mode | `GET /prescriptions/{id}/print` |
| Cancel | `resetToDefaults()` + confirm if dirty | same |
| + New Prescription | same as cancel flow | same |

**Mock doctors (Phase 1–2):**

```typescript
[{ id: '1', displayName: 'Dr. Khalid' }, { id: '2', displayName: 'Dr. Sarah' }]
```

**Default form value:** today's ISO date, `doctorId: '1'`, empty eye fields (`createDefaultPrescriptionFormValue()`).

### PrescriptionGridComponent

Shared sub-component in `shared/ui/prescription-grid/` — renders SPH, CYL, AXIS, ADD for one eye with reactive form group binding.

### PrescriptionService

| Method | Mock (`useMockPrescription: true`) | API (`false`) |
|--------|-----------------------------------|---------------|
| `getDoctors()` | Returns `MOCK_DOCTORS` | `GET {apiUrl}/doctors` |
| `save(payload)` | `mockSave()` → `rx-mock-{timestamp}` | `POST {apiUrl}/prescriptions` |
| `print(id)` | Rejects (stub message in UI) | `GET {apiUrl}/prescriptions/{id}/print` |
| `getLastSaved()` | In-memory last mock/API record | same |

Mock save attaches `customerId: 'cust-demo-001'` when not provided.

### Layout CSS

- Outer: `.prescription-page` padding inside shell content safe areas
- Card: `.prescription-card` white, border, radius 12px
- Body grid: OD/OS two columns on `≥640px`; shared fields third column on tablet (`≥768px`)
- Footer: `.prescription-actions` — primary Save full width; Print + Cancel row with printer SVG icon
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

| Sell action | Current behavior | Phase 4 target |
|-------------|------------------|----------------|
| **+ New Prescription** | `router.navigate(['/home/prescription'])` | same |
| **View All** | Status: "Prescription history is not connected yet." | History route |
| **View History** | Same stub | History route filtered |
| Save customer link | Mock `cust-demo-001` | `SellSessionStore.selectedCustomer().id` |

## Phased delivery

### Phase 1 — UI shell ✅

| Task | Status |
|------|--------|
| Create `PrescriptionFormComponent` + template + CSS | Done |
| Create `PrescriptionGridComponent` | Done |
| Wire route `/home/prescription` | Done |
| Mock doctors via `PrescriptionService.getDoctors()` | Done |
| Save / Print / Cancel button stubs | Done |
| Copy matches spec table | Done |

**Outcome:** Prescription tab shows reference form on tablet and phone.

### Phase 2 — Validation & UX ✅

| Task | Status |
|------|--------|
| `optionalDecimalValidator` / `optionalAxisValidator` | Done |
| Required date + doctor; markAllAsTouched on invalid save | Done |
| Dirty confirm on Cancel and + New Prescription | Done |
| Inline success / error / info messages | Done |
| Unit tests: form, save, axis range, cancel | Done |
| `PrescriptionService` mock save + lastSaved | Done |

**Outcome:** Production-ready client form on mock data.

### Phase 3 — Prescription API integration (next)

| Task | Detail |
|------|--------|
| OpenAPI contracts | Prescription paths under `ai-workspace/contracts/openapi/` |
| Verify `POST /prescriptions` payload mapping | Align with [`data-model.md`](./data-model.md) |
| `GET /doctors` error handling | Spinner/skeleton on load failure |
| `GET /customers/{id}/prescriptions/latest` | Optional pre-fill on tab open |
| Customer id from session | Inject `SellSessionStore` or shared session service |
| Print endpoint | PDF URL or defer native bridge |
| Prod config | `useMockPrescription: false` already in `appsettings.prod.json` |
| Integration tests | Service tests with mocked `fetch` |

**Outcome:** Persisted prescriptions linked to real customers.

### Phase 4 — History & list

| Task | Detail |
|------|--------|
| `PrescriptionHistoryComponent` + route | e.g. `/home/prescription/history` |
| Wire Sell **View All** / **View History** | Replace status stub in `SellDashboardComponent` |
| List + detail UI | Date, doctor, OD/OS snapshot |
| Sync latest summary on Sell tab | After save, refresh `SellSessionStore` latest Rx (coordinate with [`005`](../005-sell-dashboard/plan.md) Phase 3) |

**Outcome:** Full Rx workflow from Sell summary through history.

## Components affected

| Area | Path | Change |
|------|------|--------|
| Routes | `app.routes.ts` | ✅ `PrescriptionFormComponent` |
| Prescription feature | `features/pos/prescription/*` | ✅ Implemented |
| Prescription grid | `shared/ui/prescription-grid/*` | ✅ Implemented |
| Config | `src/config/appsettings*.json` | ✅ `useMockPrescription` |
| Sell dashboard | `features/pos/sell/sell-dashboard.component.ts` | Phase 4: history navigation |
| Contracts | `ai-workspace/contracts/openapi/` | Phase 3 |

## Test strategy

### Unit (implemented)

| Target | Cases |
|--------|--------|
| `PrescriptionFormComponent` | Renders headings/buttons; loads doctors; blocks invalid save; axis 0–180; cancel reset |
| `PrescriptionService` | Mock doctors; mock save stores `lastSaved` |

### Unit (Phase 3+)

| Target | Cases |
|--------|--------|
| `PrescriptionService` API mode | Mock `fetch` for doctors, save, print |
| Session customer id | Payload includes selected customer |

### Manual / visual

- [x] Prescription tab active state in bottom nav
- [x] Form matches `POSScreen.png` structure at 375px and 1024px
- [ ] Landscape: form scrolls; buttons reachable above bottom nav (verify on device)
- [x] Save / Print / Cancel visible and styled correctly
- [x] Sell **+ New Prescription** opens Prescription tab form

## Definition of done

### Phase 1–2 (MVP) ✅

- [x] `PrescriptionFormComponent` at `/home/prescription`
- [x] All labels and buttons match spec copy table
- [x] OD/OS + shared fields present via `PrescriptionGridComponent`
- [x] Mock save, stub print, cancel reset with dirty confirm
- [x] Unit tests for form create, validation, and save stub
- [ ] Visual sign-off against prescription panel in `POSScreen.png` (product QA)

### Phase 3

- [ ] `PrescriptionService` API mode verified with `useMockPrescription: false`
- [ ] Doctors from `GET /doctors`
- [ ] Save via `POST /prescriptions` with session customer id
- [ ] OpenAPI YAML in `ai-workspace/contracts/openapi/`
- [ ] Print endpoint integrated or documented deferral

### Phase 4

- [ ] History route from Sell View All / View History
- [ ] Prescription list UI
- [ ] Latest Rx summary refresh after save

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Customer id mismatch between Sell and Prescription tabs | Phase 3 inject shared `SellSessionStore` |
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
