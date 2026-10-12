# GAGA 0.0.38.5.1

## Content Type Correction

Fixes an over-broad 0.0.38.5 projection that accidentally added article freshness fields to `AuthorRecord` and `TopicGroup` object literals.

### Correct scope
Freshness metadata in 0.0.38.5 is currently projected from `ConsumerArticleRecord` only.

### Fixed
- removed `lastReviewed`, `reviewAfter`, and `volatility` from `AuthorRecord` object construction
- removed the same accidental fields from `TopicGroup` object construction
- leaves article freshness authority and discovery projection unchanged
