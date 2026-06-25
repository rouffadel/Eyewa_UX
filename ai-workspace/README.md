# FadelSoft — Spec-Driven Development (SDD) Workspace

This workspace holds specifications, raw knowledge, and supporting artifacts for AI-assisted development across FadelSoft projects (e.g. `optical-pos`).

## Workflow

1. **Capture** — Drop unprocessed inputs into `raw-knowledge/` (meeting notes, PDFs, stakeholder emails, scraped docs).
2. **Curate** — Distill durable facts, glossary terms, and domain rules into `knowledge/`.
3. **Specify** — Write or refine feature specs under `specs/` using templates in `specs/_templates/`.
4. **Contract** — Define APIs and integration boundaries in `contracts/`.
5. **Decide** — Record architecture and product decisions in `decisions/`.
6. **Implement** — Point coding agents at the relevant spec folder before making code changes.

## Directory layout

```
ai-workspace/
├── raw-knowledge/     # Unprocessed source material (verbatim, append-only)
├── knowledge/         # Curated, structured domain knowledge
├── specs/             # Feature and project specifications
│   ├── project/       # Project-wide PRD, architecture index
│   └── _templates/    # Reusable spec templates
├── contracts/         # API, event, and integration contracts
├── decisions/         # Architecture / product decision records (ADRs)
└── checklists/        # Quality gates for specs and requirements
```

## Naming conventions

| Artifact | Pattern | Example |
|----------|---------|---------|
| Raw capture | `YYYY-MM-DD_short-slug.md` | `2026-06-18_pos-requirements-kickoff.md` |
| Feature spec folder | `NNN-feature-name/` | `001-patient-checkout/` |
| Decision record | `NNNN-short-title.md` | `0001-offline-first-sync.md` |

## For AI agents

Read `AGENTS.md` before working from this workspace. When implementing a feature, load the matching spec under `specs/<feature>/` and trace requirements through to acceptance criteria.
