# Data model — Measurements create / edit

Draft for Phase 3 API. Confirm units and ranges with clinical/backend team.

## Measurements

| Field | Type | Unit | Reference example |
|-------|------|------|-------------------|
| `id` | string | — | server UUID |
| `customerId` | string | — | POS session |
| `pd` | number | mm | 62.0 |
| `nearPd` | number | mm | 60.0 |
| `frameWidth` | number | mm | 138 |
| `bridgeWidth` | number | mm | 18 |
| `templeLength` | number | mm | 145 |
| `lensHeight` | number | mm | 42 |
| `wrapAngle` | number | degrees | 10 |
| `faceForm` | string | enum | Oval |
| `frameHeight` | number | mm | 23 |
| `createdAt` | string (ISO) | — | response |
| `updatedAt` | string (ISO) | — | response |

## Face form enum

`Oval` | `Round` | `Square` | `Heart` | `Oblong`

## POST /measurements

```json
{
  "customerId": "cust-123",
  "pd": 62.0,
  "nearPd": 60.0,
  "frameWidth": 138,
  "bridgeWidth": 18,
  "templeLength": 145,
  "lensHeight": 42,
  "wrapAngle": 10,
  "faceForm": "Oval",
  "frameHeight": 23
}
```

## PUT /measurements/{id}

Same body as POST (without changing `customerId`).

## GET /customers/{customerId}/measurements/latest

Returns single `MeasurementsRecord` or 404.

## Angular types

```typescript
export type FaceForm = 'Oval' | 'Round' | 'Square' | 'Heart' | 'Oblong';

export interface MeasurementsFormValue {
  pd: number | null;
  nearPd: number | null;
  frameWidth: number | null;
  bridgeWidth: number | null;
  templeLength: number | null;
  lensHeight: number | null;
  wrapAngle: number | null;
  faceForm: FaceForm;
  frameHeight: number | null;
}

export interface MeasurementsRecord extends MeasurementsFormValue {
  id: string;
  customerId: string;
  createdAt: string;
  updatedAt: string;
}
```
