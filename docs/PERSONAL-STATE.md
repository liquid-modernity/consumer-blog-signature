# Browser-local Personal State

Application composition over the public Engine 0.4.0 storage, annotation, Saved Reading and Reading Collection ports. Arsenal 0.2.0, Corps 0.1.0 and editorial authority remain unchanged. No account, synchronization, new telemetry or server persistence exists.

`src/config/personal-state.mjs` is the key registry. `src/lib/personal-state.ts` exposes one typed snapshot: namespace/schemaVersion, reading, saved, preferences, highlights, notes, quotes, history and context. The snapshot is a projection, not a second persisted copy. Existing domain stores retain their admitted keys. Saved still delegates to `createSavedReadingCapability`, with its exact button selector and canonical page ID. Root and library read the same domain. Reader Preferences retains its UI, validators and keys. History projects meaningful readable-content visits from Reading Collection: 40 items, 180 days; completion is not Continue Reading.

## Migration and recovery

The canonical annotation key remains `gaga:reading-knowledge:v1`. Prior rich records, Engine annotation records and oldest highlights migrate deterministically into that store using Engine's annotation descriptor. A verified browser-local `gaga:personal-legacy:v1` archive retains original raw inputs before replacement. Only after canonical write/readback succeeds are the two redundant legacy inputs retired. Migration is idempotent; archived records are never reimported. Removing a record cannot resurrect it. Old clients can still read the retained rich-record fields. Unknown schema/namespace or unverified archival blocks writes, preserving raw state. Malformed rows are isolated; eligible records remain available. Browser quota/blocked storage must not produce false success.

Saved and Preferences need no destructive migration. Reading preserves valid legacy items, uses Engine retention/deduplication on writes and archives malformed representations before replacement. Future-version state stays untouched. Cross-tab storage events refresh applicable projections. No personal record is exported into content/Search/machine feeds.

## Capabilities and anchors

Only explicitly declared publication/document bodies participate. Indexes, Topics, Sections, tag explorers and the historical unmatched QA publication do not acquire personal annotation identity. Canonical page ID comes from the active frame; canonical URL comes from that document, never a hovered link.

Capture uses public `captureSelectionTarget`. A selection must be meaningful, within one uniquely identified body block. Stable explicit IDs or a SHA-256 of nearest heading ID plus full block text identify the block. Restore also requires the exact block hash, offsets, selected text and prefix/suffix. Changed/duplicate blocks and legacy anchors without the hash remain unresolved, with their record accessible in the library. There is no fuzzy/first-occurrence reattachment. Overlapping highlights are rejected in favor of editing the existing mark. Multi-block annotations are unsupported in V1.

Highlight, Note and explicit Quote are facets of one record. Removing a note/quote preserves its highlight. Notes are assigned as text/value, never rendered as HTML. A captured Range survives note-input focus but must still match the active document before persistence.

## Latent interaction

Selection Action appears after selection: Highlight, Listen, Copy, Note; Quote is secondary. Escape dismisses, Tab enters without trapping, native selection/copy remain available. Popovers are viewport-bounded and respect reduced motion. Listening reuses the sole existing SmartSpeaker/Notch narration controller. No second speech runtime or permanent personal toolbar is added. Pointer preview continues to project through the public Engine information surface: intentional mouse hover, 500 ms transfer grace, keyboard focus, Escape and ordinary touch navigation. It never replaces active page metadata.

## Qualification and limits

`tools/personal` uses injected MemoryStorage and synthetic browser-DOM fixtures, not CMS writes or user browser profiles. Production smoke verifies source bytes before exercising fixtures. Browser-only writes are separately accounted. Public discovery responses and outgoing requests must not contain fixture private fragments. Voice and clipboard tests use deterministic browser fixtures; physical iOS/Safari, device voices and complete screen-reader usability require separate validation.

Extraction pressure is record-only: Arsenal Application/Experience may later compose these domains and latent controls; Site has no new primitive; Corps has no provider change; Engine's existing ports suffice. No actual second consumer is established, so extraction is not justified now.
