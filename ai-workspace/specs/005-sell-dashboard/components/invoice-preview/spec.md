---
component: invoice-preview
parent: specs/005-sell-dashboard
status: done
created: 2026-06-28
updated: 2026-06-28
source: raw-knowledge/files/Invoice.jpeg
---

# Component: Invoice preview

**Parent index:** [`../../spec.md`](../../spec.md)

Post-checkout invoice screen at `/home/sell/invoice`. Field layout follows [`Invoice.jpeg`](../../../../raw-knowledge/files/Invoice.jpeg); styling uses existing POS card patterns (not the reference image’s black table headers).

## Route

| Path | Component | Entry |
|------|-----------|--------|
| `/home/sell/invoice` | `InvoicePreviewComponent` (lazy) | **Pay & Print** on payment card after successful validation |

**Cancel** / **Back to Sell** → `/home/sell`.

## Header fields

| Field | Source |
|-------|--------|
| Invoice No | `customer.invoiceNo` or generated mock `2020-{ddMMyyyy}-{suffix}` |
| Invoice Date | Current timestamp `dd-MM-yyyy HH:mm:ss` |
| Customer Name | Selected customer |
| Contact No | `customer.phone` or `phoneMasked` |

## Products table

| Column | Source |
|--------|--------|
| Category, Brand, Model No, Selling Price, Quantity, Total | Saved prescription frame/lens lines when present; else cart line items |

## Prescription table

| Row | Columns |
|-----|---------|
| Right Eye, Left Eye, IPD | SPH, CYL, AXIS, ADD |

Full `PrescriptionRecord` preferred; falls back to `latestPrescription` summary (ADD may be `—`).

## Footer

| Field | Source |
|-------|--------|
| Details | Prescription notes |
| User | Logged-in staff `displayName` |
| Total Amount | Payment payable |
| Amount Paid | Cash / card / mixed amounts from `PaymentDraft` |
| Balance | `payable − amountPaid` (0 when payment complete) |

## Actions

| Button | Behavior |
|--------|----------|
| **Print** | Stub — “Receipt print is not connected yet.” |
| **Cancel** | Navigate back to Sell |

## User stories

- [x] Invoice preview renders all fields from reference image
- [x] Opened after **Pay & Print** (not **Pay** alone)
- [x] Uses existing POS styles (`.pos-card`, prescription-history grid patterns)
- [ ] Live invoice API + print (Phase 3–4)

## Implementation

| File | Role |
|------|------|
| `invoice-preview/invoice-preview.component.*` | UI |
| `models/invoice.models.ts` | `InvoiceViewModel` |
| `services/invoice.mapper.ts` | Build view model from sell session |
| `services/sell-session.store.ts` | `lastInvoice`, `payAndPrint()` |
| `app.routes.ts` | Lazy route `sell/invoice` |
