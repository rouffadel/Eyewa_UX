---
feature: prescription-create
status: draft
owner: 
created: 2026-06-20
updated: 2026-06-28
reference: Eyewa POS — Prescription form (Prescription tab + lower-left panel)
depends_on: specs/002-common-components
route: /home/prescription
primary_target: tablet (iPad / Android tablet)
---

# Feature: Prescription create / entry

## Summary

Provide a **Prescription** tab in the POS shell where store staff enter a customer's optical order: **frame lines**, optional **lens lines**, and **Right Eye (OD) / Left Eye (OS)** values with shared measurements (PD, Near PD, VD, notes). Tapping **Prescription** in the bottom navigation loads a mobile-first form inside `PosShellComponent` with **Save Prescription**, **Print**, and **Cancel** actions.

**Date and doctor are not part of this tab** — they are omitted from the POS prescription UI (clinical metadata may be supplied by the backend or other ERP screens if required).

Phase 1–2 deliver the UI, validation, and mock persistence. **Phase 2c — Mock persistence & Sell sync** saves in memory and updates the Sell tab latest Rx summary and **Sell cart** (frame/lens lines mapped to cart items with payment totals). **Phase 2d — Catalog APIs** loads frame/lens **categories** and frame **brands** from the backend (`FillCategory`, `GetBrand`). **Phase 4 — History (mock)** delivers `/home/prescription/history` from Sell **View All** / **View History**, with selectable entries and **View on Sell Dashboard**. **Phase 3 — Prescription API integration** wires save, load, and print to the backend (aligned with `GetOrderLense` / sale order patterns in [`005-sell-dashboard`](../005-sell-dashboard/spec.md)).

The **read-only latest prescription summary** and **customer profile card** on the Sell tab are owned by [`005-sell-dashboard`](../005-sell-dashboard/spec.md); this spec owns the **full entry form** on the Prescription tab.

## Screen regions (reference)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HEADER (002-common-components)                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  PRESCRIPTION TAB — IN SCOPE (this spec)                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  PRESCRIPTION                              + New Prescription         │  │
│  │  Customer: {name}  (or select-customer banner)                        │  │
│  │  ▼ FRAMES (accordion)                          [+ Add Frame]          │  │
│  │     Frame line cards: category, brand, model, price, qty, discount  │  │
│  │  ▼ LENSES (accordion)                    [Order Lens toggle]        │  │
│  │     Lens line cards when enabled: category, order lens, price, qty  │  │
│  │  EYE PRESCRIPTION                                                     │  │
│  │  RIGHT EYE (OD)          LEFT EYE (OS)     │  PD, Near PD, VD, Notes  │  │
│  │  [ Save Prescription ]  [ Print ] [ Cancel ]                          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│  SELL TAB — RELATED (005)                                                   │
│  Latest prescription summary ← updated on save; View All → history route     │
│  Cart + payment ← frame/lens lines synced on save (rx-* line ids)            │
├─────────────────────────────────────────────────────────────────────────────┤
│  PRESCRIPTION HISTORY — `/home/prescription/history` (Phase 4 mock)         │
│  Selectable list per customer → View on Sell Dashboard                      │
│  BOTTOM NAV (002-common-components) — Prescription tab active               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Implementation status

| Phase | Scope | Status |
|-------|--------|--------|
| **1 — UI shell** | Prescription tab route, Rx grid, buttons (stubs) | **Done** |
| **2 — Validation & UX** | Numeric rules, reactive form, cancel/reset, dirty guard | **Done** |
| **2b — Frames & lenses (mock)** | Accordion sections, frame/lens line cards, mock save payload | **Done** |
| **2c — Mock persistence & Sell sync** | In-memory save; latest Rx on Sell; cart + payment sync | **Done** |
| **2d — Catalog APIs** | `CategoryService` + `BrandService` on prescription form | **Done** |
| **3 — Prescription API integration** | Save/load frames, lenses, Rx; print; server persistence | **Next** |
| **4 — History (mock)** | History route, selection, View on Sell Dashboard | **Done** (mock) |
| **4b — History API** | Load list from server; edit from history | Planned |

**Current state:** `/home/prescription` renders `PrescriptionFormComponent` with collapsible **FRAMES** and **LENSES** accordions, customer banner from `SellSessionStore`, mock save via `PrescriptionService`, and stub print. Frame/lens **Category** dropdowns load from `products/FillCategory` (fallback to mock lists). Frame **Brand** uses debounced `GetBrand` autocomplete. On save, `SellSessionStore.applySavedPrescription()` updates **Latest Prescription**, appends per-customer history, and **`syncCartFromPrescription()`** replaces prescription cart lines (`rx-*` ids) while keeping catalog items. **View All** / **View History** on Sell navigate to `/home/prescription/history`. Data is **in-memory only** (lost on refresh) until Phase 3 API.

**Implementation plan:** [`plan.md`](./plan.md)

## Scope

| In scope | Out of scope |
|----------|--------------|
| Prescription form UI inside POS shell (header + bottom nav remain) | Full Sell-tab dashboard grid ([`005`](../005-sell-dashboard/spec.md)) |
| **Frames** accordion with add/remove line cards | Measurements tab ([`004`](../004-measurements-create/spec.md)) |
| **Lenses** accordion with Order Lens toggle and line cards | Eye diagram illustration (optional POC+) |
| OD / OS grid: SPH, CYL, AXIS, ADD | Backend API implementation in Phase 1–2 |
| Shared fields: PD, Near PD, VD, Notes | PDF/Bluetooth printer driver (stub print in Phase 1–2) |
| Customer context banner from `SellSessionStore` | Delivery / Order tab |
| Save, Print, Cancel (mock Phase 1–2; API Phase 3) | Latest Rx **summary card** layout on Sell tab ([`005`](../005-sell-dashboard/spec.md)) |
| Mock save → Sell latest Rx + history list (in-memory) | Server persistence (Phase 3) |
| Prescription history route + selection (mock Phase 4) | OCR / e-prescription submission |
| `PrescriptionGridComponent`, frame/lens line components | **Date and doctor fields on this tab** |
| Responsive mobile-first layout (cards, not ERP tables) | Edit prescription from history row (deferred) |

## Reference

| Asset | Usage |
|-------|--------|
| [`POSScreen.png`](../../raw-knowledge/files/POSScreen.png) | Eye Rx grid + shell layout |
| [`frameprescription.jpeg`](../../raw-knowledge/files/frameprescription.jpeg) | Frame line + Rx domain fields (adapt to mobile cards, not desktop tables) |
| [`framelensprescription.jpeg`](../../raw-knowledge/files/framelensprescription.jpeg) | Frame + lens lines + Rx (adapt to mobile cards) |

Related: [`knowledge/architecture/pos-dashboard-components.md`](../../knowledge/architecture/pos-dashboard-components.md) — `PrescriptionFormCardComponent`, `PrescriptionGrid`

---

## Navigation

| Trigger | Result |
|---------|--------|
| Bottom nav **Prescription** tab | Navigate to `/home/prescription`; render prescription form in `router-outlet` |
| Sell tab **+ New Prescription** (summary card) | Navigate to `/home/prescription` (implemented in [`005`](../005-sell-dashboard/spec.md)) |
| **Cancel** | Discard unsaved changes; reset form to defaults (confirm if dirty) |
| **+ New Prescription** (form header) | Same as Cancel when dirty; reset to empty defaults |
| **Save Prescription** | Validate → mock save (Phase 2) or API (Phase 3) → update Sell latest Rx + history |
| **Print** | Stub message until saved; API/native print Phase 3 |
| **View All** / **View History** (Sell summary) | Navigate to `/home/prescription/history` |
| **View on Sell Dashboard** (history page) | Set selected Rx as latest on Sell; navigate to `/home/sell` |

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

> Back chevron from reference is **omitted** — bottom nav is primary navigation.

### Customer context

| Element | Behavior |
|---------|----------|
| **Customer banner** | Shows `Customer: {displayName}` when `SellSessionStore.selectedCustomer()` is set |
| **No customer** | Info banner: "Select a customer from the header before saving this prescription." |
| **Save blocked** | Save disabled with error when no customer selected |

### Frames accordion (collapsible)

Mobile-first **cards** per frame line — **not** the wide ERP table in `frameprescription.jpeg`.

| Field | Type | Notes |
|-------|------|--------|
| **Category** | Select | Loaded from `GET products/FillCategory?CategoryType=Frame`; fallback: `Frames - P/S/U` |
| **Brand** | Combobox | Required; debounced `GET GetBrand?BrandName={query}` autocomplete; free text allowed |
| **Model No** | Text | Required |
| **Selling Price** | Number | Optional decimal |
| **Quantity** | Number | Min 1; default 1 |
| **Discount (%)** | Number | 0–100 |
| **Discount** | Read-only | Computed from price × qty × discount % |
| **Total Selling Price** | Read-only | Computed |

| Control | Behavior |
|---------|----------|
| **Accordion header** | Tap to expand/collapse; shows item count summary |
| **Default state** | Expanded |
| **+ Add Frame** | Adds line; keeps accordion open |
| **Remove** | Removes line when more than one exists |

### Lenses accordion (collapsible)

| Field | Type | Notes |
|-------|------|--------|
| **Order Lens** | Toggle | Off by default; enables lens lines |
| **Category** | Select | Loaded from `GET products/FillCategory?CategoryType=Lens`; fallback: Single Vision, Progressive, Bifocal, Other |
| **Order Lens** | Text | Required when section active (e.g. `CR39`, `1.67 grey`) |
| **Price** | Number | Optional decimal |
| **Quantity** | Number | Min 1 |
| **Total** | Read-only | Per line; section shows **Lens Total** |

| Control | Behavior |
|---------|----------|
| **Accordion header** | Tap to expand/collapse; summary shows `Off` or line count |
| **Default state** | Collapsed |
| **Order Lens on** | Auto-expands; adds first line if empty |
| **+ Add Lens Line** | Adds another line |

### Eye prescription — Right Eye (OD) and Left Eye (OS)

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
| **PD** | 62.0 | Pupillary distance (mm); UI range 20–85 |
| **Near PD** | 60.0 or +1.25 | mm or additive; UI range 0–85 |
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
- PD / Near PD / VD: `step="any"` on inputs; form uses `novalidate` (Angular validators only)
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
| Frames section | FRAMES |
| Add frame | + Add Frame |
| Lenses section | LENSES |
| Order lens toggle | Order Lens |
| Add lens | + Add Lens Line |
| Lens total | Lens Total: |
| Eye section | EYE PRESCRIPTION |
| Right eye header | RIGHT EYE (OD) |
| Left eye header | LEFT EYE (OS) |
| Field labels | SPH, CYL, AXIS, ADD, PD, Near PD, VD, Notes |
| Frame labels | Category, Brand, Model No, Selling Price, Quantity, Discount (%), Discount, Total Selling Price |
| Lens labels | Category, Order Lens, Price, Quantity, Total |
| Notes placeholder | Optional |
| Customer banner | Customer: |
| No customer banner | Select a customer from the header before saving this prescription. |
| No customer save error | Select a customer from the header before saving. |
| Lenses hint (toggle off, expanded) | Turn on Order Lens to add lens lines for this prescription. |
| Primary button | Save Prescription |
| Print button | Print |
| Cancel button | Cancel |
| Save success (inline) | Prescription saved |
| Validation error (generic) | Please check the highlighted fields |
| Print stub message | Print preview is not connected yet |
| Discard confirm | Discard unsaved prescription changes? |
| History title | PRESCRIPTION HISTORY |
| History hint | Select a prescription to view on the Sell dashboard. |
| History back | ← Back to Sell |
| History view button | View on Sell Dashboard |
| History empty | No saved prescriptions for this customer yet. |
| History no customer | Select a customer from the header to view prescriptions. |

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
- [x] Form card matches layout: title, customer banner, frames/lenses accordions, OD/OS grid, shared fields, three buttons

### Story 2 — Add frame lines

**As a** store staff member  
**I want** to add one or more frame lines with pricing  
**So that** the frame portion of the order is captured on the prescription tab

**Acceptance criteria**

- [x] **FRAMES** accordion with **+ Add Frame**
- [x] Each line: category, brand, model, price, qty, discount %, computed discount and total
- [x] Brand and model required before save
- [x] Remove line when multiple frames exist
- [x] Mobile card layout (not desktop table)

### Story 3 — Add lens lines (optional)

**As a** store staff member  
**I want** to optionally order lenses with typed lens specifications  
**So that** frame + lens + Rx can be captured in one flow

**Acceptance criteria**

- [x] **LENSES** accordion collapsed by default
- [x] **Order Lens** toggle enables lens lines
- [x] Each line: category, order lens description, price, qty, computed total
- [x] **Lens Total** shown when section active
- [x] Lens lines cleared when toggle off

### Story 4 — Enter OD and OS values

**As an** optician or sales associate  
**I want** to enter SPH, CYL, AXIS, and ADD for each eye  
**So that** the customer's lens order is recorded accurately

**Acceptance criteria**

- [x] Separate **RIGHT EYE (OD)** and **LEFT EYE (OS)** sections with four fields each
- [x] Fields accept signed decimals for SPH, CYL, ADD; integer 0–180 for AXIS
- [x] Labels match copy table
- [x] Layout readable on phone (stacked) and tablet (two columns) and in landscape

### Story 5 — Shared measurements

**As a** store staff member  
**I want** to enter PD, Near PD, VD, and notes  
**So that** the Rx record is complete for dispensing

**Acceptance criteria**

- [x] PD, Near PD, VD accept numeric input; Notes optional text
- [x] PD range 20–85 mm; Near PD range 0–85 (supports mm and small additive values)
- [x] Form `novalidate`; number inputs use `step="any"` to avoid browser blocking save
- [x] Notes placeholder: `Optional`

### Story 6 — Save, print, and cancel

**As a** store staff member  
**I want** Save, Print, and Cancel actions  
**So that** I can commit, output, or abandon the form

**Acceptance criteria**

- [x] **Save Prescription** validates frame lines and Rx; requires selected customer; mock save includes frames/lenses/Rx
- [x] After mock save, **Latest Prescription** on Sell tab updates via `SellSessionStore.applySavedPrescription()`
- [x] **Print** shows stub message when no saved record or mock mode
- [x] **Cancel** clears dirty state and resets to defaults with confirm if dirty
- [x] Button styles match reference (primary blue Save; outlined Print/Cancel)

### Story 6b — Mock persistence (Phase 2c)

**As a** store staff member  
**I want** saved prescriptions to appear on the Sell tab  
**So that** I see the Rx I just entered without an API

**Acceptance criteria**

- [x] `PrescriptionService.save()` stores record in memory (`lastSaved`) when `useMockPrescription: true`
- [x] `PrescriptionFormComponent` calls `SellSessionStore.applySavedPrescription(record)` on success
- [x] Sell **Latest Prescription** card shows mapped OD/OS, PD, Near PD, and save date
- [x] History list per customer updated on each save (newest first)
- [x] Frame/lens lines sync to Sell **cart** and **payment** totals via `syncCartFromPrescription()`
- [ ] Data survives page refresh (requires Phase 3 API — not in mock scope)

### Story 7 — New prescription

**As a** store staff member  
**I want** **+ New Prescription** to start a fresh form  
**So that** I can enter another Rx without stale data

**Acceptance criteria**

- [x] Link clears form to defaults (one empty frame, lenses off, empty Rx fields)
- [x] Prompt if current form is dirty

---

### Story 6c — Catalog APIs (Phase 2d) ✅

**As a** store staff member  
**I want** frame/lens categories and frame brands loaded from the ERP  
**So that** I pick valid catalog values instead of typing everything manually

**Acceptance criteria**

- [x] `CategoryService.getCategories('frame' | 'lens')` calls `GET products/FillCategory?CategoryType=Frame|Lens`
- [x] Category dropdowns populated on prescription form init; loading state on select
- [x] API failure or empty response falls back to `FRAME_CATEGORIES` / `LENS_CATEGORIES` mock lists
- [x] Frame **Brand** field uses `BrandService.getBrands(query)` with debounced search dropdown
- [x] `GetBrand` response maps `objresult` array with `BrandID` / `BrandName` (also supports legacy `objresult.table` + camelCase)
- [x] Config: `fillCategoryPath`, `frameCategoryType`, `lensCategoryType`, `getBrandPath` in appsettings

---

## Phase 3 — Prescription API integration (next)

Wire the prescription form to the optical/clinical backend. Mock/local persistence remains for dev when `useMockPrescription: true` (default in `appsettings.json`; `false` in prod).

> **Partial scaffold:** `PrescriptionService` mock save; `OrderLenseService`, `BrandService`, and `CategoryService` implemented. Category/brand wired to prescription UI. `GET /doctors` scaffold remains in service but is **not used by this tab**.

### Story 8 — Save prescription via API

**As a** store staff member  
**I want** Save to persist the prescription to the server  
**So that** it is linked to the customer and available across devices

**Acceptance criteria**

- [ ] `PrescriptionService.save()` calls `POST {apiUrl}/prescriptions` when mock flag is false
- [ ] Request includes customer id, frames[], lenses[], OD/OS values, PD, near PD, VD, notes
- [ ] Align save payload with sale order / `GetOrderLense` backend contract
- [ ] Successful response returns prescription id and updated timestamp
- [ ] Failed save shows safe error message; form data retained
- [ ] `apiUrl` from `AppConfigService` — not hard-coded in components
- [ ] OpenAPI contract under `ai-workspace/contracts/openapi/` before or with implementation

### Story 9 — Load existing order / Rx

**As a** store staff member  
**I want** existing frame, lens, and Rx data loaded when a sale exists  
**So that** I don't re-type order lines

**Acceptance criteria**

- [ ] `GET prescriptions/GetOrderLense?SalesId={id}` pre-fills lenses and OD/OS when `salesId` present
- [ ] Frame lines load from sale API (endpoint TBD with backend)
- [ ] Loading and error states on form

### Story 10 — Print via API or native bridge

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
| `GET` | `products/FillCategory?CategoryType=Frame\|Lens` | Frame/lens category dropdowns |
| `GET` | `products/GetBrand?BrandName={name}` (or `Admin/GetBrand` in prod) | Frame brand autocomplete |
| `GET` | `prescriptions/GetOrderLense` | Load lenses + OD/OS for sale ([`005`](../005-sell-dashboard/services/spec.md)) |
| `POST` | `/prescriptions` or sale order endpoint | Create/update order lines + Rx (confirm with backend) |
| `GET` | `/prescriptions/{id}/print` | Print payload / PDF |

See [`data-model.md`](./data-model.md) for request/response shapes.

### Out of scope for Phase 3

- Server-backed prescription history list (Phase 4b)
- OCR / import from external systems
- Regulatory e-prescription submission
- Multi-customer batch entry

---

## Phase 4 — History (mock) ✅ / Phase 4b — History API (planned)

### Story 11 — Prescription history from Sell tab

**As a** store staff member  
**I want** **View All** and **View History** on the Sell dashboard to open prescription history  
**So that** I can review saved Rx for the current customer

**Acceptance criteria**

- [x] **View All** and **View History** navigate to `/home/prescription/history`
- [x] `PrescriptionHistoryComponent` lists saved prescriptions per customer (newest first)
- [x] Each row shows date, OD/OS snapshot (SPH, CYL, AXIS), PD, Near PD
- [x] Doctor shows `—` in mock (no doctor on Prescription tab)
- [x] Empty state when customer has no saved prescriptions
- [x] **← Back to Sell** returns to `/home/sell`
- [ ] Load history from API when `useMockPrescription: false` (Phase 4b)

### Story 12 — Select prescription from history

**As a** store staff member  
**I want** to select a prescription from history  
**So that** I can choose which Rx appears on the Sell dashboard

**Acceptance criteria**

- [x] History items are selectable (radio-style cards with visual selected state)
- [x] Hint: "Select a prescription to view on the Sell dashboard."
- [x] **View on Sell Dashboard** applies selection via `SellSessionStore.selectPrescriptionFromHistory(id)`
- [x] Updates **Latest Prescription** on Sell and navigates to `/home/sell`
- [x] Most recent save auto-selected; selection remembered per customer in session
- [ ] Open selected Rx in Prescription form for edit (deferred)

### Story 13 — Customer session link

**As a** store staff member  
**I want** saves to use the customer selected on the Sell tab  
**So that** prescriptions attach to the correct customer

**Acceptance criteria**

- [x] `PrescriptionService.save()` uses `SellSessionStore.selectedCustomer().id`
- [x] Error when no customer selected on save
- [x] Customer name banner when customer selected
- [x] History and latest Rx scoped per `customerId`

---

## Requirements

### Functional

- Prescription tab route integrated with existing bottom nav
- Reactive form: frames (`FormArray`), lenses (`FormArray`), OD/OS via `PrescriptionGridComponent`
- Collapsible accordions for FRAMES and LENSES
- Mock save includes frames, lenses, and Rx payload; syncs to `SellSessionStore` on success
- Prescription history at `/home/prescription/history` with selection (mock, in-memory)
- Cancel and + New Prescription reset form; dirty check with confirm
- Print stub in Phase 1–2
- **No date or doctor fields on this tab**

### Visual / UI

- Match mobile-first POS card patterns; domain fields from `frameprescription.jpeg` / `framelensprescription.jpeg` as cards, not ERP tables
- Reuse POS shell tokens; canonical tablet breakpoints ([`002-common-components`](../002-common-components/spec.md#responsive-breakpoints-canonical))

### Non-functional

- Capacitor-safe keyboard: form scrolls when inputs focused; no content hidden under bottom nav
- Validation messages accessible (aria-invalid, labels associated, role="alert" on errors)
- Decimal locale: accept `.` separator; normalize for API in Phase 3

## Out of scope

- Latest prescription **summary card layout** on Sell tab ([`005-sell-dashboard`](../005-sell-dashboard/spec.md)) — display owned by 005; data sync owned here
- Measurements tab content
- **Date and doctor on Prescription tab** (handled elsewhere in ERP if needed)
- Full printer hardware integration in Phase 1–2
- Persistent storage across refresh until Phase 3 API

## Dependencies

- [`002-common-components`](../002-common-components/) — `PosShellComponent`, bottom nav, header
- [`005-sell-dashboard`](../005-sell-dashboard/) — `SellSessionStore`, latest Rx summary, View All / View History navigation
- Selected customer context from Sell session
- Prescription/clinical API — **required for Phase 3**
- OpenAPI contract in `ai-workspace/contracts/openapi/`

## Open questions

- [ ] Is **Near PD** stored as mm or additive value? Reference shows `+1.25`—confirm domain meaning
- [ ] Required vs optional fields for Save (all numeric Rx optional vs SPH required per eye)?
- [x] Frame brand: `BrandService` autocomplete on prescription frame lines (free text still allowed after selection)
- [ ] Save endpoint: single `POST /prescriptions` vs sale line APIs aligned with `GetOrderLense`?
- [ ] Edit latest vs always create new on Prescription tab open
