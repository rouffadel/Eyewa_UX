# Data model — Prescription create

Draft entities for Phase 3 API integration. Confirm field names and units with backend.

**UI note:** `prescriptionDate` and `doctorId` are **not collected on the Prescription tab**. They may remain optional on the server or be supplied by other ERP flows.

## Prescription (aggregate)

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `id` | string (UUID) | response | Server-generated |
| `customerId` | string | yes | From `SellSessionStore.selectedCustomer()` |
| `branchId` | string | yes | From auth session |
| `staffId` | string | yes | Created by |
| `salesId` | string | no | Link to active sale when editing existing order |
| `orderLensEnabled` | boolean | yes | UI toggle; lenses array may be empty when false |
| `frames` | `PrescriptionFrameLine[]` | yes | Min one line in UI |
| `lenses` | `PrescriptionLensLine[]` | no | Required lines when `orderLensEnabled` |
| `rightEye` | `EyePrescription` | yes | OD |
| `leftEye` | `EyePrescription` | yes | OS |
| `pd` | number | no | mm, e.g. `62.0` |
| `nearPd` | number | no | Confirm unit with clinical team |
| `vd` | number | no | Vertex distance mm |
| `notes` | string | no | Max length TBD |
| `prescriptionDate` | string (ISO date) | server | Optional; not on POS Prescription tab |
| `doctorId` | string | server | Optional; not on POS Prescription tab |
| `createdAt` | string (ISO datetime) | response | |
| `updatedAt` | string (ISO datetime) | response | |

## PrescriptionFrameLine

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `category` | string | yes | e.g. `Frames - P`, `Frames - S`, `Frames - U` |
| `brandName` | string | yes | Free text; Phase 3 may use `BrandService` |
| `modelNo` | string | yes | |
| `sellingPrice` | number | no | Unit price |
| `quantity` | number | yes | Min 1; default 1 |
| `discountPercent` | number | no | 0–100 |

**Computed (UI only, not persisted separately):**

| Field | Formula |
|-------|---------|
| `discountAmount` | `sellingPrice × quantity × (discountPercent / 100)` |
| `totalSellingPrice` | `(sellingPrice × quantity) − discountAmount` |

## PrescriptionLensLine

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `category` | string | yes | e.g. Single Vision, Progressive, Bifocal, Other |
| `orderLens` | string | yes when lenses enabled | e.g. `CR39`, `1.67 grey` |
| `price` | number | no | Unit price |
| `quantity` | number | yes | Min 1; default 1 |

**Computed (UI only):**

| Field | Formula |
|-------|---------|
| `total` | `price × quantity` |

## EyePrescription (OD / OS)

| Field | Type | Range (UI validation) |
|-------|------|------------------------|
| `sph` | number | typically -20.00 … +20.00, step 0.25 |
| `cyl` | number | typically -6.00 … +6.00, step 0.25 |
| `axis` | integer | 0 … 180 |
| `add` | number | typically 0 … +4.00, step 0.25 |

## Doctor (deferred — not on Prescription tab UI)

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | |
| `displayName` | string | e.g. `Dr. Khalid` |
| `branchId` | string | optional filter |

`PrescriptionService.getDoctors()` scaffold remains for future use; form does not call it.

## POST /prescriptions (request body — proposed)

```json
{
  "customerId": "cust-123",
  "orderLensEnabled": true,
  "frames": [
    {
      "category": "Frames - P",
      "brandName": "Ray-Ban",
      "modelNo": "RB5228",
      "sellingPrice": 450.0,
      "quantity": 1,
      "discountPercent": 10
    }
  ],
  "lenses": [
    {
      "category": "Single Vision",
      "orderLens": "CR39 1.56",
      "price": 120.0,
      "quantity": 1
    }
  ],
  "rightEye": { "sph": -1.5, "cyl": -0.75, "axis": 180, "add": 1.25 },
  "leftEye": { "sph": -1.25, "cyl": -1.0, "axis": 175, "add": 1.25 },
  "pd": 62.0,
  "nearPd": 1.25,
  "vd": 12.0,
  "notes": ""
}
```

## POST /prescriptions (response)

```json
{
  "id": "rx-789",
  "customerId": "cust-123",
  "orderLensEnabled": true,
  "frames": [
    {
      "category": "Frames - P",
      "brandName": "Ray-Ban",
      "modelNo": "RB5228",
      "sellingPrice": 450.0,
      "quantity": 1,
      "discountPercent": 10
    }
  ],
  "lenses": [
    {
      "category": "Single Vision",
      "orderLens": "CR39 1.56",
      "price": 120.0,
      "quantity": 1
    }
  ],
  "rightEye": { "sph": -1.5, "cyl": -0.75, "axis": 180, "add": 1.25 },
  "leftEye": { "sph": -1.25, "cyl": -1.0, "axis": 175, "add": 1.25 },
  "pd": 62.0,
  "nearPd": 1.25,
  "vd": 12.0,
  "notes": "",
  "createdAt": "2024-05-21T10:30:00Z",
  "updatedAt": "2024-05-21T10:30:00Z"
}
```

## GET prescriptions/GetOrderLense (load — existing sell API)

Query: `SalesId={salesId}`

Response shape (partial — maps to form lenses + OD/OS; confirm with backend):

```json
{
  "salesId": "sale-001",
  "rightEye": { "sph": -1.5, "cyl": -0.75, "axis": 180, "add": 1.25 },
  "leftEye": { "sph": -1.25, "cyl": -1.0, "axis": 175, "add": 1.25 },
  "pd": 62.0,
  "nearPd": 1.25,
  "vd": 12.0,
  "notes": "",
  "lenses": []
}
```

Frame lines may require a separate sale-lines endpoint — TBD in Phase 3.

## Angular models (implemented)

```typescript
export interface EyePrescription {
  sph: number | null;
  cyl: number | null;
  axis: number | null;
  add: number | null;
}

export interface PrescriptionFrameLine {
  category: string;
  brandName: string;
  modelNo: string;
  sellingPrice: number | null;
  quantity: number;
  discountPercent: number | null;
}

export interface PrescriptionLensLine {
  category: string;
  orderLens: string;
  price: number | null;
  quantity: number;
}

export interface PrescriptionFormValue {
  orderLensEnabled: boolean;
  frames: PrescriptionFrameLine[];
  lenses: PrescriptionLensLine[];
  rightEye: EyePrescription;
  leftEye: EyePrescription;
  pd: number | null;
  nearPd: number | null;
  vd: number | null;
  notes: string;
}

export interface PrescriptionPayload extends PrescriptionFormValue {
  customerId: string;
}
```

**Helpers:** `calculateFrameLineTotals()`, `calculateLensLineTotal()`, `createDefaultPrescriptionFormValue()`, `FRAME_CATEGORIES`, `LENS_CATEGORIES`.

## UI validation ranges (implemented)

| Field | Validator range | Notes |
|-------|-----------------|--------|
| `pd` | 20–85 mm | Optional; empty allowed |
| `nearPd` | 0–85 | Optional; supports mm or small additive values |
| `vd` | 0–30 mm | Optional |
| `sph` | -20 … +20 | Per eye |
| `cyl` | -6 … +6 | Per eye |
| `axis` | 0–180 integer | Per eye |
| `add` | 0 … +4 | Per eye |

Form uses `novalidate`; numeric inputs use `step="any"`.

## Sell tab display models (implemented)

Used by **Latest Prescription** card and **Prescription History** — defined in `features/pos/sell/models/customer.models.ts`.

### PrescriptionSummary

Display-only snapshot for Sell UI (strings for grid cells):

| Field | Type | Example |
|-------|------|---------|
| `date` | string | `21-05-2024` |
| `doctorName` | string | `—` (mock; no doctor on Prescription tab) |
| `od` | `PrescriptionEyeValues` | `{ sph: '-1.50', cyl: '-0.75', axis: '180' }` |
| `os` | `PrescriptionEyeValues` | |
| `pd` | string | `62.0` |
| `nearPd` | string | `60.0` |

### SavedPrescriptionListItem

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | From `PrescriptionRecord.id` |
| `summary` | `PrescriptionSummary` | Mapped via `toPrescriptionSummary()` |

### Mock persistence (Phase 2c / 4)

| Store | Location | Behavior |
|-------|----------|----------|
| `PrescriptionService.lastSaved` | Prescription feature | Last saved `PrescriptionRecord` in session |
| `SellSessionStore.prescriptionsByCustomer` | Sell feature | Latest summary per `customerId` |
| `SellSessionStore.prescriptionHistoryByCustomer` | Sell feature | `SavedPrescriptionListItem[]` per customer, newest first |

**On save:** `PrescriptionFormComponent` → `PrescriptionService.save()` → `SellSessionStore.applySavedPrescription(record)`.

**On history select:** `PrescriptionHistoryComponent` → `SellSessionStore.selectPrescriptionFromHistory(id)`.

Data is **in-memory only** until Phase 3 API.
