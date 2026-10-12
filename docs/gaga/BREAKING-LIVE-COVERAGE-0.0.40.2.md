# GAGA 0.0.40.2 Breaking + Live Coverage Foundation

GAGA coverage is an editorial projection layered on canonical public articles.

## Frontmatter

```yaml
coverageMode: live
coverageStatus: active
coverageLabel: Live
coverageSummary: Optional short state summary.
coverageStartedAt: 2026-10-12T14:00:00+07:00
coverageUpdatedAt: 2026-10-12T16:20:00+07:00
coverageUpdates:
  - id: update-1620
    timestamp: 2026-10-12T16:20:00+07:00
    title: Latest development
    summary: Optional update summary.
```

Legacy `breaking: true` and `live: true` remain supported and are normalized into the same coverage authority.

## Coverage modes

- `standard`
- `breaking`
- `live`

## Coverage statuses

- `inactive`
- `active`
- `paused`
- `ended`

## Surfaces

Active public coverage may project into:
- one global coverage strip
- article coverage state
- update timeline
- shell data attributes
- document metadata
- search and machine discovery

## Static-first boundary

`live` describes editorial coverage mode. It does not imply websocket/SSE streaming or continuous network refresh. New updates become public through the normal publication/build/deploy path until a future transport adapter is explicitly added.
