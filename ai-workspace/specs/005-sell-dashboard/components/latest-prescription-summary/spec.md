---
component: latest-prescription-summary
parent: specs/005-sell-dashboard
status: in-progress
created: 2026-06-20
updated: 2026-06-28
---

# Component: Latest prescription summary

**Parent index:** [`../../spec.md`](../../spec.md)

Read-only card in **column 1 (below customer profile)**. Compact Rx snapshot — **not** the full Prescription tab form ([`003-prescription-create`](../../../003-prescription-create/spec.md)).

## Header

| Element | Copy |
|---------|------|
| Title | **LATEST PRESCRIPTION** (POS blue) |
| Link | **View All** → `/home/prescription/history` |

## Body (inset grey box)

| Field | Example |
|-------|---------|
| Date | 21-05-2024 (from save / selection) |
| Doctor | `—` in mock (no doctor on Prescription tab) |
| Grid | OD / OS — SPH, CYL, AXIS |
| Footer | **PD:** 62.0 · **Near PD:** 60.0 |

Data source (today): `SellSessionStore.latestPrescription()` — updated when:

1. User saves on Prescription tab (`applySavedPrescription`)
2. User selects an entry on history page (`selectPrescriptionFromHistory`)

Mock seed: demo Rx for `MOCK_CUSTOMER` until overwritten by save.

## Footer actions

| Button | Behavior |
|--------|----------|
| **+ New Prescription** | Navigate to `/home/prescription` |
| **View History** | Navigate to `/home/prescription/history` (same as View All) |

## States

| State | UI |
|-------|-----|
| **Has prescription** | Summary grid |
| **Customer, no Rx** | “No prescription on file” + New Prescription |
| **No customer** | “Select a customer to view prescription summary” |

## Phase 3 — API

Load from **`prescriptions/GetOrderLense?SalesId={salesId}`** via [`OrderLenseService`](../../services/spec.md) (replace or merge with session history):

| API field | UI mapping |
|-----------|------------|
| `objresult2.table[0]` | OD (SPH/CYL/AXIS/ADD) |
| `objresult2.table1[0]` | OS |
| `objresult2.table2[0]` | PD / additional |
| `objresult1.orderLense[]` | Lens line items (future detail) |

`salesId` from `Customer.salesId` / [`CustomerSessionService`](../../../006-create-customer/spec.md).

## Copy

| Element | Text |
|---------|------|
| Title | LATEST PRESCRIPTION |
| View All | View All |
| New Prescription | + New Prescription |
| View History | View History |

## User stories

- [x] Read-only OD/OS snapshot and PD (mock / session)
- [x] New Prescription navigates to Prescription tab
- [x] View All / View History navigate to prescription history
- [x] Updates when prescription saved or selected from history
- [x] Empty states for no customer / no Rx
- [ ] Load live Rx from `GetOrderLense` when `salesId` present (Phase 3)

## Implementation

| File | Role |
|------|------|
| `latest-prescription-summary/latest-prescription-summary.component.*` | UI |
| `services/order-lense.service.ts` | `GetOrderLense` client (Phase 3) |
| `models/order-lense.models.ts` | Response types |
| `services/sell-session.store.ts` | `latestPrescription`, `prescriptionHistory`, `applySavedPrescription`, `selectPrescriptionFromHistory` |
| `services/prescription-summary.mapper.ts` | `PrescriptionRecord` → `PrescriptionSummary` |
