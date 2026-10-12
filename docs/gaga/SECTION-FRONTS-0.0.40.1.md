# GAGA 0.0.40.1 Section Fronts + Editorial Hierarchy

Sections are first-class publication surfaces derived from canonical article editorial metadata.

## Routes

- `/sections`
- `/sections/{slug}`

## Authority

No new CMS/content authority is introduced. Section identity is derived from article `section` metadata. The section front then reuses the same deterministic editorial projection used by the homepage.

## Discovery

Section routes are projected into:
- primary navigation
- sitemap
- search/machine discovery
- workspace context

This is the first multi-section portal capability in the GAGA native publishing shell.
