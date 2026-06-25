# Specifications

Feature and project specs drive implementation. Each feature gets its own numbered folder.

## Project-wide specs

`project/` holds cross-cutting documents:

- `prd.md` — product requirements
- `architecture.md` — system context and technical overview

## Feature folders

Create a new folder per feature:

```
specs/NNN-feature-name/
├── spec.md          # Requirements index (or single spec for small features)
├── plan.md          # Technical design and approach
├── components/      # Optional — one spec.md per sub-component (see 002)
├── tasks.md         # Implementation task breakdown
├── research.md      # Technology choices (optional)
├── data-model.md    # Entities and relationships (optional)
└── checklists/      # Quality gates (optional)
```

Large features may split sub-components under `components/<name>/spec.md` with the parent `spec.md` as the index — see [`002-common-components/`](./002-common-components/spec.md).

Copy templates from `_templates/` when starting a new feature.

## Status markers

- Draft specs: no marker
- Ready for implementation: note in `spec.md` front matter `status: approved`
- Complete: add `.completed` file when implementation matches spec
