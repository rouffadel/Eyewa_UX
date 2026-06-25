---
feature: measurements-create
status: draft
spec: ./spec.md
project: optical-pos
updated: 2026-06-20
depends_on: specs/002-common-components
---

# Implementation plan — Measurements create / edit

## Goal

Replace `/home/measurements` placeholder with **MeasurementsFormComponent**: all reference fields, face diagram, **Edit** + **Save Measurements**, mock persistence via **MeasurementService**.

## File structure

```
features/pos/measurements/
├── measurements-form.component.*
├── models/measurements.models.ts
└── services/measurement.service.ts
shared/ui/face-measurement-diagram/
└── face-measurement-diagram.component.*
```

## Config

```json
"useMockMeasurements": true
```

## Phases

| Phase | Outcome |
|-------|---------|
| 1 — UI | Form + diagram + Save stub |
| 2 — Edit UX | getLatest, view/edit toggle, mock update |
| 3 — API | GET/POST/PUT per data-model |

## Routing

```typescript
{ path: 'measurements', component: MeasurementsFormComponent }
```

## Definition of done (Phase 1–2)

- [ ] All nine fields + face form select
- [ ] Diagram shows PD, frame width, lens height
- [ ] Save + Edit flows with mock service
- [ ] Unit tests for form and service
