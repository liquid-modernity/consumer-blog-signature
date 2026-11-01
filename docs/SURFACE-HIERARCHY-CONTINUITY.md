# Surface Hierarchy & Continuity V1

The command plane remains one Notch. Its existing controller now lives in `scripts/systems/notch.ts`; the inline controller is removed. The same identity/Back spine remains visible across Search, Share, Preferences, narration and constrained Information. For modal Preferences/Information the same spine node moves inside the owned dialog and returns afterwards. This preserves modal focus ownership without nesting dialog roles or creating a second panel controller.

The page-title slot is optional: it follows H1 visibility and is suppressed during capabilities. Back closes the current capability (or returns from Poster preview to Share); Escape uses that same transition. Existing Engine registry, modal isolation, preference, speech, rail and scrolling ports retain their responsibilities.

## Discovery and root ownership

Root local links derive from the configured root sections and appear in Outline. The existing root viewport-stage context supplies active local links and position; obsolete Notch/pill/TOC updates are removed. The duplicate root section rail and Notch root anchor list are deleted. Canonical topics are discovery context only when their actual density meets the existing planner relevance threshold and space permits. Information is a first-level conditional command: the same content uses the Right Rail or its existing constrained sheet attached to Notch.

Super Search and `/search` share one loader and matcher. The public Engine search reference determines admitted matches; application policy ranks exact title, prefix, title tokens and substring, preserving stable index order on ties. Live lookup is bounded to six results and at most one matching available command. Arrow keys select, Enter opens a selected result, and unselected Enter uses the full-results route. Index fetch is cached, stale async results cannot overwrite a later query, and private browser state is never read. Existing public index bytes remain the release comparison authority.

## Orientation, export and feedback

Outline retains local navigation, then document structure, then genuine sequence/position. Small flat families use compact wrapped rows; larger/hierarchical/long-label collections use a bounded list. The existing progress element moves to a two-pixel noninteractive trace outside the retracting body. Its value still comes from the existing Engine scroll authority, and it remains dormant for short/ineligible content.

Poster rendering is unchanged. Explicit Poster action generates a revocable local Blob preview; download is a separate action using those same bytes. Native file sharing appears only when the browser accepts the actual PNG payload. There is no upload, editor or new service. Feedback uses shared dark material, status semantics, bounded placement and a readable automatic dismissal interval, without stealing focus.

## Bounded cleanup and compatibility

Removed 86 tracked unconsumed Share scaffolds and their console-only audit scripts across `features/share`, obsolete `features/super-share` subtrees, and `gaga/share`. The active Super Share model and renderer remain. Prior release documentation and import/caller/workflow inspection establish that these scaffolds had no active consumer. Also removed obsolete root navigation projections, detached narration fallback, duplicate capability headers, the unused direct Notch Copy Link path, and stale selectors belonging to those paths. The exact deletion manifest is retained with external release evidence.

The Reader closing phase flag remains because Engine 0.4.0 calls its clear hook before closing/focus restoration; it can be removed when an admitted public after-close hook provides equivalent ordering. Existing Saved/preferences keys, annotation migration and public redirect aliases retain their admitted compatibility contracts and are not changed. No new persisted state or public package is introduced.

Tests guard untouched annotation/anchoring/speech functions and globals, preference behavior, motion policy and deterministic poster renderer against the admitted source. Qualification adds semantic contracts and 32 Chromium desktop/touch plus four hosted WebKit cases to all earlier mandatory suites. Physical iOS/Safari, complete assistive technology certification and certified FPS remain outside measured evidence.

Extraction pressure remains first-consumer application/experience composition only. Engine ports suffice; no second real consumer justifies package extraction.
