# Portable content semantics boundary rehearsal v1

This local rehearsal implements Harvest Track 3 (A02/A03/A04), based on canonical source `5b593c3ee0b42645941c648c0e2f01fb3028b8d3`, tree `3f44341e12a0b91ef0f2b706c50a1f31c37d7415`. Harvest authority is Garrison review `0daa8409b232f868b801a20d0a90f130bfea3477`. Corrected Escutcheon candidate `019c9b1e4d47e4edef6c3db75e85a534812a0bdb` / hosted proof `40462163401` is unchanged and is not a runtime dependency.

## Observed boundary

Previously `editorial/portable-text.mjs` combined validation, reusable-section expansion, text projection, advisory analysis, KaTeX/HTML rendering and body/archive selection. Validation imported EmDash-shaped `registry.mjs` and read its `action_id` fields. Consequently Search projection and Markdown import loaded renderer dependencies for validation/text alone. CMS save, preview, Astro loading and publication qualification all consumed these exports.

The original tests are `tools/editorial/portable-text.test.mjs`, `plugin.test.mjs`, `boundaries.test.mjs`, `tools/content/content.test.mjs` and `tools/gaga/application.test.mjs`. The real admitted export supplies seven Articles and one Author; `tools/editorial/fixture.mjs` covers every existing rich block and reusable sections. No record, revision, archive, model or policy changes are made.

## Proposed narrow contract

```js
import { createPortableTextSemantics } from './portable-content.mjs';
const content = createPortableTextSemantics([
  { type: 'researchNote', stringFields: ['title', 'text'] },
]);
content.validatePortableText(blocks); // same input returned, or an error
content.resolveSections(blocks, { sections });
content.plainText(blocks, { sections });
```

`editorial/portable-content.mjs` is the isolated implementation: no imports, provider/runtime/framework/renderer dependencies, I/O, application identity, route selection or ambient services. Input is the existing bounded Portable Text representation, not arbitrary provider payloads. Its seven built-in types are `block`, `image`, `gallery`, `video`, `code`, `break`, `table`. Explicit extension descriptors carry only a type and string-field names; duplicate/invalid descriptors and provider-widget objects fail. The current custom vocabulary retains its existing type-specific reference, media, code, math and ID checks. This is not a schema language or a promise to understand every provider's Portable Text dialect.

`safeUrl` retains the existing contextual link/media rules used by validation and rendering. It is not promoted to a universal URL/security API. Existing key uniqueness, reference IDs, annotation checks, document/span/table/media bounds, eight-level section-trail bound, cycle/missing-reference errors, expanded-key checks and text separators are preserved. Validation returns the original array and does not normalize content; section expansion uses caller-supplied data, never provider lookup. No HTML is canonicalized into text.

The application adapter `editorial/content-semantics.mjs` maps the existing registry's field names into the neutral contract. EmDash `text_input`, `action_id`, labels, plugin IDs, collection fields and UI remain in `registry.mjs`/CMS. Descriptors bind once at initialization; no current caller mutates registry definitions at runtime. Runtime catalog mutation is not a proposed portable contract. That adapter still imports the application registry intentionally; detached consumers supply their own descriptors and need neither module. Provider catalogs are not claimed extraction-ready.

`portable-text.mjs` preserves every old export and continues to own HTML/KaTeX rendering, advisory copy/reading-time rules and `editorialBody` archive selection. Search, Markdown import and the save hook now request semantic functions directly. Preview authentication, exact-revision lookup, publication policy, native authority and Garrison orchestration are unchanged.

```text
App Search / import / save → application semantic adapter → portable core
                                    ↓
                         existing provider-shaped registry
App renderer / analysis / canonical-body mapping → semantic adapter
Detached neutral consumer → portable core only
```

## Equivalence and independent consumption

`semantics-boundary.test.mjs` reads the exact original five modules using `git show` at the pinned baseline into a temporary ignored directory. Both implementations use the same locked dependencies. It compares success values and error name/message (not stack paths), verifies unchanged exports and inputs, and removes the oracle afterward. No second maintained implementation or source fixture is committed. Hosted checkout must retain the baseline Git object (`fetch-depth: 0`).

The checks compare all eight canonical rich bodies and deterministic Markdown imports, native pins, exact meaningful-text bytes, rendered HTML, all seven article preview results/documents, projected Search artifacts and actual Engine Search output. The all-block fixture covers tables, callouts, citations/references, footnotes, media, math and sections. Invalid/empty/whitespace/provider-wrapper/asset-ID-only cases and section edge cases retain original behavior. A separate temporary consumer copies only the pure module, supplies an independent `researchNote` vocabulary and runs without dependencies, credentials, app source or provider packages.

The isolated hosted workflow uses Ubuntu 24.04, exact Node 22.23.4 and npm 10.9.3 with committed lockfiles. It runs directly affected editorial/plugin/preview/Search/boundary checks, strict application/CMS typing, preservation checks, publication build and a native Search Worker smoke proof. Historical full UI, release, provider and security suites are not re-certified by this rehearsal. The workflow has read-only contents permission and no production secret/provider/deployment step.

## Ambiguities deliberately preserved

- Validity is not meaningful prose or publication readiness. Empty arrays, empty/whitespace spans and descriptionless media remain valid; text is not trimmed. No new `hasMeaningfulText` policy is invented. The test's trimmed-text observation is a consumer example, not an admission rule.
- Projection is selective: title/text/caption/alt/formula contribute; DOI, provider IDs and some reference metadata do not. Existing gallery caption coercion is preserved, not endorsed as a future universal schema.
- Repeating a section can produce duplicate expanded keys and fail, just as before. This rehearsal does not invent identity re-keying.
- Native error text and the mutable legacy `admittedTypes` inspection set are preserved compatibility surfaces, not frozen public Arsenal promises. Developer configuration is trusted; the API is not an authorization boundary. Non-JSON values/classes/cyclic JavaScript objects have no new portable guarantee.
- Existing special block names still carry specific validation/projection behavior. Arbitrary new extension fields are string-checked but do not acquire renderer support, new text selectors or lifecycle semantics.
- Byline/profile relationships, body/archive naming, provider serialization/authority, routes, editorial metadata, media-origin resolution and presentation remain outside the proposed public boundary.

## Extraction decision

A narrow, representation-specific validation/section/text boundary is earned if the focused hosted checks pass. It does not earn a universal content-model API, complete Studio extraction or generalization of every block. The detached consumer is an independent configuration proof, not a second production application.

No package is necessary for this rehearsal. Next: review the finite Portable Text API and the deferred compatibility choices, then authorize one narrow Arsenal integration using detached packed consumption while retaining the application adapter and renderer. Do not extract field widgets, publishing, authoring UI, Markdown conversion or rendering in that task.

Canonical results and exact source identities are indexed outside the checkout in `gaga-release-evidence/editorial-semantics-boundary-v1/checkpoint.json`. Nothing here authorizes publishing, main promotion, provider changes or production content transitions.
