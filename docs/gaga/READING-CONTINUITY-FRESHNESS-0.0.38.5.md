# Reading Continuity + Freshness Authority

GAGA 0.0.38.5 turns two existing concepts into governed native publishing capabilities.

## Reading continuity

The existing local reading-progress runtime remains the implementation authority. This iteration adds explicit privacy eligibility:
- public published articles only
- drafts excluded
- `noindex` surfaces excluded
- non-public visibility excluded
- no server synchronization
- bounded local retention
- user-resettable reading history

## Freshness authority

Editorial frontmatter remains authoritative:
- `lastReviewed`
- `reviewAfter`
- `volatility`

GAGA projects those fields into shell data contracts, document metadata, and machine discovery.

`review-due` means editorial review is due. It does not mean the article is false or stale.
