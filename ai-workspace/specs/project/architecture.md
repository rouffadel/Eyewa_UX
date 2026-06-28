---
status: draft
project: FadelSoft
updated: 2026-06-28
---

# Architecture overview

## System context

<!-- High-level diagram or description of major components -->

## Repositories

| Repo / path | Role |
|-------------|------|
| `optical-pos/` | |

## Technology stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | Angular 20 | SPA in `optical-pos-angular-capacitor-ux/` |
| Mobile | Capacitor 8 | Android + iOS shells; see [`knowledge/platform-support.md`](../knowledge/platform-support.md) |
| Backend | | |
| Data | | |

### Supported platforms (summary)

| Platform | Minimum | Primary target |
|----------|---------|----------------|
| Android | API 26 (8.0) | Landscape tablets (8"–10"; Android 9–10 uses `adjustPan` keyboard path) |
| iOS / iPadOS | 15.0 | Landscape tablets |
| Web | Evergreen browsers | Dev / secondary |

Full matrix: [`knowledge/platform-support.md`](../knowledge/platform-support.md).

## Integration points

- 

## Cross-cutting concerns

- Authentication:
- Offline / sync:
- Observability:

## Related decisions

Link ADRs from `decisions/` as they are created.
