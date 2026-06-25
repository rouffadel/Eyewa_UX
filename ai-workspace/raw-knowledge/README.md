# Raw knowledge

Unprocessed source material. Treat as **evidence**, not authoritative spec.

## Principles

- **Append-only** — add new files; avoid silent edits to captures.
- **Verbatim** — preserve original wording where possible.
- **Provenance** — include source, date, and author in each file header.

## Subfolders

| Folder | Use for |
|--------|---------|
| `meetings/` | Transcripts, agendas, action items |
| `notes/` | Quick captures, brainstorms, pasted text |
| `files/` | References to imported PDFs, images, spreadsheets |
| `web/` | Saved articles, docs, external references |
| `specifications/` | Draft or legacy specs awaiting curation |

## File header template

```markdown
---
source: <meeting | email | doc | web>
date: YYYY-MM-DD
author: <name or team>
status: raw
---

# Title
```
