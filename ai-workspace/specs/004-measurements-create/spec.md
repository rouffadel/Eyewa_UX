---
feature: measurements-create
status: draft
owner: 
created: 2026-06-20
updated: 2026-06-20
source: raw-knowledge/files/POSScreen.png
reference: Eyewa POS — Measurements form (bottom-center panel)
depends_on: specs/002-common-components
---

# Feature: Measurements create / edit

## Summary

Provide a **Measurements** section in the POS shell where store staff record fitting measurements for the current customer. Tapping **Measurements** in the bottom navigation loads a form with PD, Near PD, frame dimensions, wrap angle, face form, and a **face/frame diagram**—plus **Edit** and **Save Measurements** actions—matching the measurements panel in `POSScreen.png`.

Phase 1–2 deliver UI, view/edit modes, validation, and mock persistence. **Phase 3 — Measurements API integration** wires save, load, and update to the backend (same phased pattern as [`003-prescription-create`](../003-prescription-create/spec.md)).

## Implementation status

| Phase | Scope | Status |
|-------|--------|--------|
| **1 — UI shell** | Measurements tab, form fields, diagram, Save (stub) | Planned |
| **2 — View / edit UX** | Load saved mock record, Edit toggle, validation | Planned |
| **3 — Measurements API integration** | GET/POST/PUT measurements | **Next** (after Phase 2) |
| **4 — History** | Latest measurements card on Sell tab | Planned |

**Current state:** `/home/measurements` shows a placeholder. This spec replaces it with the full measurements form.

## Scope

| In scope | Out of scope |
|----------|--------------|
| Measurements form in POS shell | Full tablet multi-panel dashboard |
| Fields per reference diagram | Live camera face scan |
| Schematic face/frame diagram (SVG) | Photo upload |
| Save + Edit modes | Delivery tab |
| Mock save/load/edit | Real API in Phase 1–2 |

## Reference

![Eyewa POS reference — measurements panel](../../raw-knowledge/files/POSScreen.png)

> The measurements panel is the **bottom-center** card in the reference (active **Measurements** tab). Use field labels, layout, diagram, and **Save Measurements** button from that panel.

Related: [`knowledge/architecture/pos-dashboard-components.md`](../../knowledge/architecture/pos-dashboard-components.md) — `MeasurementsFormCardComponent`, `FaceMeasurementDiagram`

---

## Visual design

White card inside shell content; POS blue primary actions.

### Card header

```
┌────────────────────────────────────────────┐
│  MEASUREMENTS                      Edit    │
└────────────────────────────────────────────┘
```

| Element | Behavior |
|---------|----------|
| **MEASUREMENTS** | Bold uppercase title |
| **Edit** | Blue link; enables fields when a saved record exists (view mode) |

### Form fields (reference values)

| Label | Example | Input type |
|-------|---------|------------|
| **PD** | 62.0 | number (mm) |
| **Near PD** | 60.0 | number |
| **Frame Width** | 138 | number (mm) |
| **Bridge Width** | 18 | number (mm) |
| **Temple Length** | 145 | number (mm) |
| **Lens Height** | 42 | number (mm) |
| **Wrap Angle** | 10° | number (degrees) |
| **Face Form** | Oval | select dropdown |
| **Frame Height** | 23 | number (mm) |

Grid: 2–3 columns on tablet; stack on phone. **Diagram** column on the right (tablet) showing frame width, lens height, and PD annotations tied to current values.

### Face form options

`Oval`, `Round`, `Square`, `Heart`, `Oblong` (default **Oval** per reference).

### Actions

| Button | Style | Behavior |
|--------|--------|----------|
| **Save Measurements** | Full-width primary blue | Validate → mock save (Phase 1–2) → view mode |
| **Edit** | Header link | Switch view → edit when record exists |

### Diagram

Schematic line drawing: face with glasses; labels for **Frame Width** (top), **Lens Height** (side), **PD** (between pupils). Updates when form values change (read-only visual).

---

## Copy (exact strings)

| Element | Text |
|---------|------|
| Title | MEASUREMENTS |
| Edit link | Edit |
| Save button | Save Measurements |
| Save success | Measurements saved |
| Validation error | Please check the highlighted fields |

---

## User stories

### Story 1 — Open measurements from bottom nav

**As a** store staff member  
**I want** to tap **Measurements** in the bottom nav  
**So that** I can enter fitting measurements in the POS shell

**Acceptance criteria**

- [ ] Route `/home/measurements` loads measurements form
- [ ] All nine fields + diagram present per reference
- [ ] **Save Measurements** button visible

### Story 2 — Save measurements (mock)

**As a** store staff member  
**I want** to save measurements  
**So that** they persist for the current customer session

**Acceptance criteria**

- [ ] Save validates numeric fields
- [ ] Mock persistence via `MeasurementService` when `useMockMeasurements: true`
- [ ] Success message shown; form enters view mode after save

### Story 3 — Edit saved measurements

**As a** store staff member  
**I want** an **Edit** control  
**So that** I can update previously saved measurements

**Acceptance criteria**

- [ ] Saved record loads on tab open (mock `getLatest`)
- [ ] Fields read-only in view mode; **Edit** enables editing
- [ ] Save updates existing mock record (same id)

---

## Phase 3 — Measurements API integration (next)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/customers/{customerId}/measurements/latest` | Load for view/edit |
| `POST` | `/measurements` | Create |
| `PUT` | `/measurements/{id}` | Update |

See [`data-model.md`](./data-model.md). OpenAPI in `ai-workspace/contracts/openapi/` when backend is ready.

---

## Requirements

### Functional

- Nine measurement fields + face form select
- View/edit modes with Edit link
- Mock save and update
- Diagram reflects PD, frame width, lens height

### Non-functional

- Portrait + landscape safe (shell rotation rules)
- Touch-friendly inputs (≥44px, 16px font on iOS)

## Dependencies

- [`002-common-components`](../002-common-components/)
- Customer context stub (`cust-demo-001`) until Sell flow provides real id
- Measurements API — Phase 3

## Open questions

- [ ] Wrap angle unit: degrees only or allow text suffix in UI?
- [ ] Required fields for save — all optional vs PD required?
- [ ] Sync PD/Near PD with prescription tab or independent store?
