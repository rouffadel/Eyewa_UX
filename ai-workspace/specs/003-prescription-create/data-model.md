# Data model — Prescription create

Draft entities for Phase 3 API integration. Confirm field names and units with backend.

## Prescription

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `id` | string (UUID) | response | Server-generated |
| `customerId` | string | yes | From POS session |
| `branchId` | string | yes | From auth session |
| `staffId` | string | yes | Created by |
| `prescriptionDate` | string (ISO date) | yes | e.g. `2024-05-21` |
| `doctorId` | string | yes | FK to Doctor |
| `rightEye` | `EyePrescription` | yes | OD |
| `leftEye` | `EyePrescription` | yes | OS |
| `pd` | number | no | mm, e.g. `62.0` |
| `nearPd` | number | no | Confirm unit with clinical team |
| `vd` | number | no | Vertex distance mm |
| `notes` | string | no | Max length TBD |
| `createdAt` | string (ISO datetime) | response | |
| `updatedAt` | string (ISO datetime) | response | |

## EyePrescription (OD / OS)

| Field | Type | Range (UI validation) |
|-------|------|------------------------|
| `sph` | number | typically -20.00 … +20.00, step 0.25 |
| `cyl` | number | typically -6.00 … +6.00, step 0.25 |
| `axis` | integer | 0 … 180 |
| `add` | number | typically 0 … +4.00, step 0.25 |

## Doctor

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | |
| `displayName` | string | e.g. `Dr. Khalid` |
| `branchId` | string | optional filter |

## POST /prescriptions (request body)

```json
{
  "customerId": "cust-123",
  "prescriptionDate": "2024-05-21",
  "doctorId": "doc-456",
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
  "prescriptionDate": "2024-05-21",
  "doctorId": "doc-456",
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

## GET /doctors (response)

```json
{
  "items": [
    { "id": "doc-456", "displayName": "Dr. Khalid" },
    { "id": "doc-457", "displayName": "Dr. Sarah" }
  ]
}
```

## Angular models (suggested)

```typescript
export interface EyePrescription {
  sph: number | null;
  cyl: number | null;
  axis: number | null;
  add: number | null;
}

export interface PrescriptionFormValue {
  prescriptionDate: string;
  doctorId: string;
  rightEye: EyePrescription;
  leftEye: EyePrescription;
  pd: number | null;
  nearPd: number | null;
  vd: number | null;
  notes: string;
}
```
