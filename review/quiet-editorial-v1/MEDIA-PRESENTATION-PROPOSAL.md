# Draft: media presentation authoring contract

Status: OWNER REVIEW REQUIRED. No CMS schema, stored content, revisions, provider bindings, migrations, or published package APIs are changed by this proposal.

Current evidence: `editorial/registry.mjs` exposes figure ID, URL, alternative text and caption; `editorial/portable-text.mjs` emits image/figure/video elements without presentation metadata; `src/gaga/content/loader.ts` consumes that output. The application-local `MediaFigure` and `MediaVideo` components accept presentation, but the EmDash portable-text authoring flow does not presently expose it. Do not infer meaning from pixel dimensions or apply an inline/bleed choice to icons or galleries automatically.

Proposed optional semantic field on eligible editorial image/figure/video blocks: `presentation: 'bleed' | 'wide' | 'inline'`. `bleed` means viewport-wide primary editorial media; `wide` extends beyond the text measure without viewport bleed; `inline` stays within the text measure for diagrams or contextual media. Captions and attribution remain aligned to reading measure; source aspect ratio and native controls remain intact. Editor selection should use concise labels and an accessible preview, with `bleed` preselected for newly authored eligible primary media, while explicit inline remains readily available.

Compatibility: existing blocks with no field retain their existing legacy rendering until an owner-approved compatibility decision; do not rewrite old records. Unknown values should fail validation for new edits and resolve to a documented safe legacy fallback for existing data. Markdown needs an independently reviewed way to express the same semantics; never assume arbitrary HTML survives provider sanitization. Gallery members, author portraits, icons, and interface thumbnails are outside this default.

Migration: no bulk migration by default. Qualify parser, validation, editor, preview and publication renderer on old/new documents and provider substitution before any schema or binding change. Owner may explicitly authorize an optional reversible migration after a backup and dry-run report; preserve original revisions and canonical content identities. Search text and canonical URLs remain unchanged.

Rollback: disable the authoring control and restore the prior renderer; retain previously stored metadata and revisions without destructive rewriting. Confirm old clients safely ignore the optional field before rollout, and verify rollback against real provider behavior rather than assuming unknown-field tolerance.

Acceptance: owner-approved schema and compatibility plan; all three presentations round-trip through the actual authoring, validation, provider and production renderer; old records preserve agreed behavior; no implicit crop; accessible alt/caption/controls; six-width and 200% reflow, keyboard, contrast, screen-reader and physical-device evidence. This proposal does not authorize implementation or publication.
