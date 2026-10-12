# GAGA 0.0.38.5.2

## Freshness Projection Scope Fix

Corrects the remaining 0.0.38.5 TypeScript regression.

### Fixed
- removes article-only freshness fields from `AuthorRecord` construction
- restores `lastReviewed`, `reviewAfter`, and `volatility` to the `ConsumerArticleRecord` projection
- keeps `TopicGroup` free of article-only freshness fields
- hardens the continuity/freshness source audit so this scope regression fails locally before CI

### Unchanged
- reading continuity policy
- freshness state semantics
- discovery schema
- UI
- routing
- storage format
