---
feature: prescription-create
status: draft
owner: 
created: 2026-06-20
updated: 2026-06-20
source: raw-knowledge/files/POSScreen.png
reference: Eyewa POS — Prescription form (Prescription tab + lower-left panel)
depends_on: specs/002-common-components
route: /home/prescription
primary_target: tablet (iPad / Android tablet)
---

# Feature: Prescription create / entry

## Summary

Provide a **Prescription** tab in the POS shell where store staff enter or update a customer's optical prescription. Tapping **Prescription** in the bottom navigation loads a form with date, doctor, **Right Eye (OD)** and **Left Eye (OS)** grids, shared measurements (PD, Near PD, VD, notes), and **Save Prescription**, **Print**, and **Cancel** actions—matching the prescription card in `POSScreen.png`.

Phase 1–2 deliver the UI, validation, and mock persistence inside `PosShellComponent`. **Phase 3 — Prescription API integration** wires save, load, doctors list, and print to the backend (same phased pattern as [`001-staff-login`](../001-staff-login/spec.md)). **Phase 4** adds prescription history (View All / View History from the Sell dashboard) and links saves to the active customer session.

The **read-only latest prescription summary** and **customer profile card** (including Last Visit row layout) on the Sell tab are owned by [`005-sell-dashboard`](../005-sell-dashboard/spec.md); this spec owns the **full entry form** on the Prescription tab and future history routes.

## Screen regions (reference)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HEADER (002-common-components)                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  PRESCRIPTION TAB — IN SCOPE (this spec)                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  PRESCRIPTION                              + New Prescription         │  │
│  │  Date | Doctor                                                        │  │
│  │  RIGHT EYE (OD)          LEFT EYE (OS)     │  PD, Near PD, VD, Notes  │  │
│  │  SPH CYL AXIS ADD        SPH CYL AXIS ADD  │                          │  │
│  │  [ Save Prescription ]  [ Print ] [ Cancel ]                          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│  SELL TAB — RELATED (005, read-only summary + customer profile)              │
│  Latest prescription summary card → navigates here via + New Prescription    │
│  Customer profile (Last Visit: label left, date right) → see 005 Card 1      │
├─────────────────────────────────────────────────────────────────────────────┤
│  BOTTOM NAV (002-common-components) — Prescription tab active                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Implementation status

| Phase | Scope | Status |
|-------|--------|--------|
| **1 — UI shell** | Prescription tab route, form layout, copy, buttons (stubs) | **Done** |
| **2 — Validation & UX** | Numeric rules, reactive form, cancel/reset, dirty guard | **Done** |
| **3 — Prescription API integration** | Save/load, doctors API, print payload, customer link | **Next** |
| **4 — History & list** | View All / View History routes, list UI, session customer id | Planned |

**Current state:** `/home/prescription` renders `PrescriptionFormComponent` with mock doctors, mock save, stub print, and full client-side validation (Phases 1–2 complete). Sell dashboard **+ New Prescription** navigates here; **View All** / **View History** remain stubs until Phase 4.

**Implementation plan:** [`plan.md`](./plan.md)

## Scope

| In scope | Out of scope |
|----------|--------------|
| Prescription form UI inside POS shell (header + bottom nav remain) | Full Sell-tab dashboard grid ([`005`](../005-sell-dashboard/spec.md)) |
| Date + doctor fields | Measurements tab ([`004`](../004-measurements-create/spec.md)) |
| OD / OS grid: SPH, CYL, AXIS, ADD | Eye diagram illustration (optional POC+) |
| Shared fields: PD, Near PD, VD, Notes | Backend API implementation in Phase 1–2 |
| Save, Print, Cancel actions (mock Phase 1–2; API Phase 3) | PDF/Bluetooth printer driver (stub print in Phase 1–2) |
| Responsive layout phone + tablet + rotation | Delivery / Order tab |
| `PrescriptionGridComponent` reusable OD/OS block | Latest Rx **summary card** on Sell tab (see [`005`](../005-sell-dashboard/spec.md)) |
| Prescription history list (Phase 4) | OCR / e-prescription submission |

## Reference

![Eyewa POS reference — prescription panel](../../raw-knowledge/files/POSScreen.png)

Related: [`knowledge/architecture/pos-dashboard-components.md`](../../knowledge/architecture/pos-dashboard-components.md) — `PrescriptionFormCardComponent`, `PrescriptionGrid`

---

## Navigation

| Trigger | Result |
|---------|--------|
| Bottom nav **Prescription** tab | Navigate to `/home/prescription`; render prescription form in `router-outlet` |
| Sell tab **+ New Prescription** (summary card) | Navigate to `/home/prescription` (implemented in [`005`](../005-sell-dashboard/spec.md)) |
| **Cancel** | Discard unsaved changes; reset form to defaults (confirm if dirty) |
| **+ New Prescription** (form header) | Same as Cancel when dirty; reset to today's date and empty fields |
| **Save Prescription** | Validate → persist (mock Phase 1–2; API Phase 3) → success feedback |
| **Print** | Stub message until saved; API/native print Phase 3 |
| **View All** / **View History** (Sell summary) | Status stub Phase 1–2; history route Phase 4 |

Shell chrome (app header, bottom nav) unchanged per [`002-common-components`](../002-common-components/spec.md).

---

## Visual design (must match reference)

Prescription form lives in a **white card** with light grey border, rounded corners (~12px), inside the main content area below the fixed header and above the bottom nav.

### Card header row

```
┌─────────────────────────────────────────────────────────┐
│  PRESCRIPTION                    + New Prescription     │
└─────────────────────────────────────────────────────────┘
```

| Element | Style |
|---------|--------|
| **Title** | `PRESCRIPTION` — bold, uppercase, dark text |
| **+ New Prescription** | Right-aligned link; POS blue text (`--color-pos-accent`) |

> Back chevron from reference is **omitted** — bottom nav is primary navigation. Drill-in from Sell summary uses **+ New Prescription** only.

### Meta row (date + doctor)

| Field | Type | Reference example |
|-------|------|-------------------|
| **Date** | Native date input | `21-05-2024` (stored ISO `YYYY-MM-DD`) |
| **Doctor** | Select / dropdown | `Dr. Khalid` |

Layout: two fields on one row on tablet; stack vertically on narrow phone if needed.

### Prescription grid — Right Eye (OD) and Left Eye (OS)

Two labeled columns side by side on tablet; stack on small phone. Implemented via `PrescriptionGridComponent`.

| Column header | Fields (each labeled above input) |
|---------------|-----------------------------------|
| **RIGHT EYE (OD)** | SPH, CYL, AXIS, ADD |
| **LEFT EYE (OS)** | SPH, CYL, AXIS, ADD |

Reference example values (for visual QA—not hard-coded defaults):

| Eye | SPH | CYL | AXIS | ADD |
|-----|-----|-----|------|-----|
| OD | -1.50 | -0.75 | 180 | +1.25 |
| OS | -1.25 | -1.00 | 175 | +1.25 |

### Shared measurements (right column on tablet)

| Field | Reference example | Notes |
|-------|-------------------|--------|
| **PD** | 62.0 | Pupillary distance (mm) |
| **Near PD** | +1.25 | Near PD or add-on per product rules |
| **VD** | 12.0 | Vertex distance (mm) |
| **Notes** | placeholder `Optional` | Free text, optional |

On phone: shared fields below OD/OS grid, full width.

### Action buttons (footer)

| Button | Style | Behavior |
|--------|--------|----------|
| **Save Prescription** | Primary — solid POS blue, white text | Submit valid form |
| **Print** | Secondary — white fill, grey border, printer icon | Stub until saved + API Phase 3 |
| **Cancel** | Secondary — white fill, grey border | Reset / discard (confirm if dirty) |

Button row: Save full-width above; Print and Cancel side by side (tablet). On phone: stack Save → Print + Cancel row.

### Field styling

- Labels: small, medium grey, above input
- Inputs: white background, light grey border, rounded ~6–8px, dark value text
- Invalid fields: red border via `--invalid` class when touched
- Numeric fields: decimal-friendly; AXIS integer 0–180
- Font: Inter (inherits shell tokens)
- Touch targets ≥44px height on mobile

### Colors (reuse shell tokens)

| Token | Usage |
|-------|--------|
| `--color-pos-accent` | Save button, + New Prescription link |
| `--color-text-heading` | Title, input values |
| `--color-text-body` / `--color-text-muted` | Labels, placeholders |
| `--color-border` | Input and card borders |
| `--color-surface` | Card and input backgrounds |

---

## Copy (exact strings)

| Element | Text |
|---------|------|
| Section title | PRESCRIPTION |
| New link | + New Prescription |
| Date label | Date |
| Doctor label | Doctor |
| Right eye header | RIGHT EYE (OD) |
| Left eye header | LEFT EYE (OS) |
| Field labels | SPH, CYL, AXIS, ADD, PD, Near PD, VD, Notes |
| Notes placeholder | Optional |
| Primary button | Save Prescription |
| Print button | Print |
| Cancel button | Cancel |
| Save success (inline) | Prescription saved |
| Validation error (generic) | Please check the highlighted fields |
| Print stub message | Print preview is not connected yet |
| Discard confirm | Discard unsaved prescription changes? |
| Sell View All stub | Prescription history is not connected yet. |

---

## User stories

### Story 1 — Open prescription from bottom nav

**As a** store staff member  
**I want** to tap **Prescription** in the bottom navigation  
**So that** I see the prescription entry form without leaving the POS shell

**Acceptance criteria**

- [x] Tapping Prescription sets active tab styling (blue icon, label, indicator) per shell spec
- [x] Route `/home/prescription` loads `PrescriptionFormComponent` inside `PosShellComponent`
- [x] Header and bottom nav remain visible and functional
- [x] Form card matches reference layout: title, date, doctor, OD/OS grid, shared fields, three buttons

### Story 2 — Enter OD and OS values

**As an** optician or sales associate  
**I want** to enter SPH, CYL, AXIS, and ADD for each eye  
**So that** the customer's lens order is recorded accurately

**Acceptance criteria**

- [x] Separate **RIGHT EYE (OD)** and **LEFT EYE (OS)** sections with four fields each
- [x] Fields accept signed decimals for SPH, CYL, ADD; integer 0–180 for AXIS
- [x] Labels match copy table
- [x] Layout readable on phone (stacked) and tablet (two columns) and in landscape

### Story 3 — Date, doctor, and shared measurements

**As a** store staff member  
**I want** to set prescription date, prescribing doctor, PD, Near PD, VD, and notes  
**So that** the record is complete for dispensing and audit

**Acceptance criteria**

- [x] Date defaults to **today** on new form; native date input
- [x] Doctor dropdown populated with mock list in Phase 1–2 (`Dr. Khalid`, `Dr. Sarah`)
- [x] PD, Near PD, VD accept numeric input; Notes optional text
- [x] Notes placeholder: `Optional`

### Story 4 — Save, print, and cancel

**As a** store staff member  
**I want** Save, Print, and Cancel actions  
**So that** I can commit, output, or abandon the form

**Acceptance criteria**

- [x] **Save Prescription** validates required fields (date, doctor); shows success feedback on mock save
- [x] **Print** shows stub message when no saved record or mock mode
- [x] **Cancel** clears dirty state and resets to defaults with confirm if dirty
- [x] Button styles match reference (primary blue Save; outlined Print/Cancel)

### Story 5 — New prescription

**As a** store staff member  
**I want** **+ New Prescription** to start a fresh form  
**So that** I can enter another Rx without stale data

**Acceptance criteria**

- [x] Link clears form to defaults (today's date, empty numeric fields, first doctor)
- [x] Prompt if current form is dirty

---

## Phase 3 — Prescription API integration (next)

Wire the prescription form to the optical/clinical backend. Mock/local persistence remains for dev when `useMockPrescription: true` (default in `appsettings.json`; `false` in prod).

> **Partial scaffold:** `PrescriptionService` already branches on `useMockPrescription` and includes `fetch` calls for `GET /doctors`, `POST /prescriptions`, and `GET /prescriptions/{id}/print`. Phase 3 completes contracts, load-latest, error UX, and customer id from sell session.

### Story 6 — Save prescription via API

**As a** store staff member  
**I want** Save to persist the prescription to the server  
**So that** it is linked to the customer and available across devices

**Acceptance criteria**

- [ ] `PrescriptionService.save()` calls `POST {apiUrl}/prescriptions` when mock flag is false
- [ ] Request includes customer id (from active POS session / selected customer), date, doctor id, OD/OS values, PD, near PD, VD, notes
- [ ] Successful response returns prescription id and updated timestamp
- [ ] Failed save shows safe error message; form data retained
- [ ] `apiUrl` from `AppConfigService` — not hard-coded in components
- [ ] OpenAPI contract under `ai-workspace/contracts/openapi/` before or with implementation

### Story 7 — Load doctors and existing Rx

**As a** store staff member  
**I want** the doctor list and any existing prescription loaded from the API  
**So that** I don't re-type static reference data

**Acceptance criteria**

- [ ] `GET {apiUrl}/doctors?branchId=` populates doctor dropdown
- [ ] `GET {apiUrl}/customers/{customerId}/prescriptions/latest` pre-fills form when editing latest (optional toggle vs always-new)
- [ ] Loading and error states on form (skeleton or spinner)

### Story 8 — Print via API or native bridge

**As a** store staff member  
**I want** Print to produce a prescription slip  
**So that** the customer receives a paper copy

**Acceptance criteria**

- [ ] Phase 3 minimum: `GET {apiUrl}/prescriptions/{id}/print` returns PDF URL or HTML payload for WebView print
- [ ] Native print plugin integration documented as follow-up if required
- [ ] Print disabled until prescription is saved (current: stub when no `lastSaved`)

### API contract (draft — confirm with backend)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/doctors` | List prescribing doctors for branch |
| `GET` | `/customers/{customerId}/prescriptions` | List prescriptions |
| `GET` | `/customers/{customerId}/prescriptions/latest` | Latest Rx for pre-fill |
| `GET` | `/prescriptions/{id}` | Single prescription |
| `POST` | `/prescriptions` | Create prescription |
| `PUT` | `/prescriptions/{id}` | Update prescription |
| `GET` | `/prescriptions/{id}/print` | Print payload / PDF |

See [`data-model.md`](./data-model.md) for request/response shapes.

### Out of scope for Phase 3

- Prescription history UI (Phase 4)
- OCR / import from external systems
- Regulatory e-prescription submission
- Multi-customer batch entry

---

## Phase 4 — History & cross-tab workflow

### Story 9 — Prescription history from Sell tab

**As a** store staff member  
**I want** **View All** and **View History** on the Sell dashboard to open prescription history  
**So that** I can review past Rx without hunting through records

**Acceptance criteria**

- [ ] Replace Sell tab status stub with navigation to `/home/prescription/history` (or modal)
- [ ] List shows date, doctor, OD/OS snapshot per row
- [ ] Row tap opens read-only detail or pre-fills form for edit (product decision)
- [ ] Empty state when customer has no prescriptions

### Story 10 — Customer session link

**As a** store staff member  
**I want** saves to use the customer selected on the Sell tab  
**So that** prescriptions attach to the correct customer

**Acceptance criteria**

- [ ] `PrescriptionService.save()` uses `SellSessionStore.selectedCustomer().id` when available
- [ ] Fallback to mock customer id in dev when no customer selected
- [ ] Banner on Prescription tab when no customer selected (optional warning)

---

## Requirements

### Functional

- Prescription tab route integrated with existing bottom nav
- Reactive form with OD/OS structure via `PrescriptionGridComponent`
- Mock doctor list and mock save in Phase 1–2
- Cancel and + New Prescription reset form; dirty check with confirm
- Print stub in Phase 1–2

### Visual / UI

- Match `POSScreen.png` prescription card for structure, labels, and button hierarchy
- Reuse POS shell tokens; no Material/Bootstrap theme leakage
- Works in portrait and landscape (see shell rotation requirements)

### Non-functional

- Capacitor-safe keyboard: form scrolls when inputs focused; no content hidden under bottom nav
- Validation messages accessible (aria-invalid, labels associated, role="alert" on errors)
- Decimal locale: accept `.` separator; normalize for API in Phase 3

## Out of scope

- Latest prescription **summary** card on Sell tab (implemented in [`005-sell-dashboard`](../005-sell-dashboard/spec.md))
- Measurements tab content
- Lens product linking from prescription
- Full printer hardware integration in Phase 1–2

## Dependencies

- [`002-common-components`](../002-common-components/) — `PosShellComponent`, bottom nav, header
- [`005-sell-dashboard`](../005-sell-dashboard/) — customer session, latest Rx summary, navigation stubs
- Selected customer context from Sell session (stub `cust-demo-001` in Phase 1–2)
- Prescription/clinical API — **required for Phase 3**
- OpenAPI contract in `ai-workspace/contracts/openapi/`

## Open questions

- [ ] Is **Near PD** stored as mm or additive value? Reference shows `+1.25`—confirm domain meaning
- [ ] Required vs optional fields for Save (all numeric optional vs SPH required per eye)?
- [ ] Date format: `DD-MM-YYYY` display vs ISO `YYYY-MM-DD` for API (UI uses ISO date input today)
- [ ] Edit latest vs always create new on Prescription tab open
- [ ] Link **+ New Prescription** to same as Cancel+reset or separate draft id
