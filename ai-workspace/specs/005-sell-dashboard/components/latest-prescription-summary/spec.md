---
component: latest-prescription-summary
parent: specs/005-sell-dashboard
status: in-progress
created: 2026-06-20
updated: 2026-06-18
---

# Component: Latest prescription summary

**Parent index:** [`../../spec.md`](../../spec.md)

Read-only card in **column 1 (below customer profile)**. Compact Rx snapshot — **not** the full Prescription tab form ([`003-prescription-create`](../../../003-prescription-create/spec.md)).

## Header

| Element | Copy |
|---------|------|
| Title | **LATEST PRESCRIPTION** (POS blue) |
| Link | **View All** |

## Body (inset grey box)

| Field | Example |
|-------|---------|
| Date | 21-05-2024 |
| Doctor | Dr. Khalid |
| Grid | OD / OS — SPH, CYL, AXIS |
| Footer | **PD:** 62.0 · **Near PD:** +1.25 |

Mock reference values:

| Eye | SPH | CYL | AXIS |
|-----|-----|-----|------|
| OD | -1.50 | -0.75 | 180 |
| OS | -1.25 | -1.00 | 175 |

## Footer actions

| Button | Behavior |
|--------|----------|
| **+ New Prescription** | Navigate to `/home/prescription` |
| **View History** | Stub / Phase 4 |

## States

| State | UI |
|-------|-----|
| **Has prescription** | Summary grid |
| **Customer, no Rx** | “No prescription on file” + New Prescription |
| **No customer** | “Select a customer to view prescription summary” |

## Phase 3 — API

Load from **`Admin/GetOrderLense?SalesId={salesId}`** via [`OrderLenseService`](../../services/spec.md):

| API field | UI mapping |
|-----------|------------|
| `objresult2.table[0]` | OD (SPH/CYL/AXIS/AD) |
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

- [x] Read-only OD/OS snapshot and PD (mock)
- [x] New Prescription navigates to Prescription tab
- [x] Empty states for no customer / no Rx
- [ ] Load live Rx from `GetOrderLense` when `salesId` present

## Implementation

| File | Role |
|------|------|
| `latest-prescription-summary/latest-prescription-summary.component.*` | UI |
| `services/order-lense.service.ts` | `GetOrderLense` client |
| `models/order-lense.models.ts` | Response types |
| `services/sell-session.store.ts` | `latestPrescription` (mock today) |
