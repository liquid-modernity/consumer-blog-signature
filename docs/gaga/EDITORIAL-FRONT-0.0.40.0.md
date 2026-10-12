# GAGA 0.0.40.0 Editorial Front Projection

This iteration begins the newsroom-oriented publishing layer.

## Goal

Consumer Blog Signature remains usable as a small blog, while publications that need richer front pages may add optional editorial metadata.

## Optional article metadata

- `section`
- `sectionRefs`
- `kicker`
- `storyFormat`
- `editorialRole`
- `editorialPriority`
- `featured`
- `breaking`
- `live`

## Projection

Canonical article content remains authoritative. GAGA derives:
- one lead story
- highlighted stories
- remaining latest stories
- section groups

Lead fallback is deterministic:
1. explicit `lead`
2. breaking
3. featured
4. latest article

`breaking` and `live` are editorial presentation/coverage flags. They do not represent an independent factual-verification claim.
