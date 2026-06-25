# Agent instructions — SDD workspace

You are working in the FadelSoft spec-driven development workspace.

## Before implementing

1. Read `README.md` for layout and workflow.
2. Check `specs/project/` for project-wide context (PRD, architecture).
3. Load the feature folder under `specs/<feature>/` that matches the task.
4. Consult `knowledge/` for domain terms and business rules.
5. Honor `contracts/` and `decisions/` that apply to the change.

## Source of truth order

1. `specs/<feature>/spec.md` — requirements and acceptance criteria
2. `specs/<feature>/plan.md` — technical approach
3. `contracts/` — external boundaries
4. `decisions/` — recorded trade-offs
5. `knowledge/` — domain context
6. `raw-knowledge/` — evidence only; do not treat as authoritative without curation

## When specs are missing

Do not invent requirements. Ask for a spec or help draft one from `specs/_templates/` before coding.

## When asked to run the app

1. Read [`knowledge/processes/run.md`](knowledge/processes/run.md).
2. **Ask the user to choose Web, iOS, or Android** if they did not already say which platform.
3. Follow the commands in `run.md`; use [`knowledge/processes/mobile-run-ios-android.md`](knowledge/processes/mobile-run-ios-android.md) for native troubleshooting.
