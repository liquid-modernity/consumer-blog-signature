# Publication & Knowledge reference integration

This application composes **published registry** Arsenal 0.2.0, Engine 0.4.0 and
Corps 0.1.0. It is a reference integration, not a claim that every application
feature is an Arsenal public API. `gaga.app/v1` and the editorial semantics API
retain their published experimental compatibility limits.

The source starts from qualified Editorial Studio `952ab4ca4b75c6236456276c2439a8276b17883d`,
which descends from canonical/deployed `c346617df851916a69167b62924bbc5b419c5c56`.
Studio, native editor ownership and saved-revision preview remain unchanged.
The native Settings X focus issue is tracked in the separate mobile review
(run 40680333139): Escape restores focus; X leaves focus on BODY. No application
DOM interception or vendor patch is part of this integration.

## Capability coverage

Status describes the named capability, not the whole domain. An extraction
candidate remains application code until independently qualified public adoption.

| Area | Capability | Classification | Actual owner/interface and evidence |
|---|---|---|---|
| Core | Declaration, normalization, plan, assembly | Public and qualified | Arsenal root `normalizeApplication`, `composeApplication`, `assembleApplication`; `gaga.app.json`, `tools/gaga/prepare.mjs`, reference tests |
| Core | Provider selection and build recipe | Application-owned | Explicit host/readers; `tools/gaga/prepare.mjs`, `src/lib/application-search.ts`; no ambient provider discovery |
| Core | General-purpose reusable blueprint | Deferred | No blueprint export exists in 0.2.0; independent real consumers required before API freeze |
| Editorial | Portable Text validation, sections, text | Public and qualified | Arsenal root `createPortableTextSemantics`; `editorial/content-semantics.mjs`, eight admitted records; package/public consumer qualification reused |
| Editorial | Studio, widgets, metadata and preview composition | Application-owned | `cms/editorial/`, EmDash public plugin contract; qualification 40676100962 retained |
| Editorial | HTML/KaTeX rendering and reference composition | Extraction candidate | Harvest A05–A11; `editorial/portable-text.mjs`; renderer/provider separation still required |
| Editorial | Current-actor native apply and publishing activation | Deferred | Supported upstream adoption/qualification and separate policy/activation authorization required; publishing disabled |
| Experience | Saved-reading, storage and event primitives | Public and qualified | Engine public `runtime/saved-reading`, `runtime/storage`, `runtime/events`; no Arsenal implementation claimed |
| Experience | Saved-reading UI and continuity composition | Extraction candidate | Harvest A16/A17; application selectors, keys, retention and locale; qualified save/reload/remove and independent Engine consumer; focused five-width settled layout and keyboard tab-strip evidence in `tools/reference/browser/quality.spec.ts` |
| Experience | Reader preference composition | Application-owned | `src/scripts/systems/reader-preferences.ts`, public Engine ports; existing qualification reused, not a new complete preference audit |
| Experience | Dynamic Notch, visual signature and branded interaction | Intentionally kept local | `src/components/frame/ActionRuntime.astro`, app UI/config; existing desktop/mobile tests |
| Site | Read-only projection, assembly and Search matching | Public and qualified | Corps Astro/Starlight/EmDash → Arsenal assembly → Engine Search → Corps Cloudflare; native workerd proof |
| Site | Taxonomy, listing, archive and discovery composition | Extraction candidate | Harvest A12–A15; `src/lib/content.ts`, `discovery.ts`, pages; public route/discovery evidence plus whole-build main/skip-target inventory and keyboard verification; Search/composition identities preserved |
| Site | Exact URLs, crawl policy, ranks, content and identity | Intentionally kept local | `src/config/routes.ts`, `discovery.ts`, brand/content; not universal package policy |

Engine owns execution primitives; Corps owns provider/framework compatibility;
Arsenal owns application composition; the application binds its exact routes,
selectors, storage policy, rendering and presentation. Garrison remains release
and qualification authority; Escutcheon remains portable security/evidence
semantics. No runtime imports from their private/source internals are added.

The [repository authority map](REPOSITORY-AUTHORITY-V1.md) distinguishes canonical
origin/source from historical clones, linked worktrees and release evidence. Core,
Editorial, Experience and Site are architectural boundaries, not justification for
additional packages or prototype repositories.

## Reproduce the integration

Use Ubuntu 24.04, Node **22.23.4**, npm **10.9.3**:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npx --no-install playwright install --with-deps chromium
npm run reference:verify
```

The command validates the actual packages and production guard, composes the
existing plan, checks the eight admitted records/public editorial root, types and
builds the application, verifies actual registry SRI/artifact bytes, builds the
Starlight proof, runs native workerd Search, and exercises desktop/mobile public
routes and saved-reading behavior. An independent browser fixture uses the same
published saved-reading API with its own selector, storage, identity and cleanup.
It does not copy or reimplement the capability.

The narrow Experience binding uses Engine's existing `buttonSelector` port to
connect the visible article action and existing canonical toggle command. It does
not change UI markup, keys, saved-item shape, lifecycle, retention or Engine APIs.
The pre-correction hosted browser failure is preserved in external evidence.

The focused responsive/semantic continuation preserves the qualified functional
slice at `1df87908a0c9dcda003275ff2ea60850942cd317` / run `40697899137`.
`PageFrame` now uses the existing main wrapper from `AppFrameBase` instead of
suppressing its semantics. The skip-link keeps its existing unique focusable
`#gaga-main` target. The homepage's viewport-anchor handler leaves skip links to
native browser navigation/focus instead of canceling their default action.
Landing/preview documents without that shell are inventoried separately. The whole built app-shell route set is checked statically and by
keyboard, so representative pages cannot conceal a route-specific broken target.

Saved Library's own scoped styles bound the grid/header, retain a horizontally
scrollable tab strip and provide 44px tab targets. Its existing handler now
supports roving focus with arrows/Home/End. Focus outlines change immediately,
while existing color transitions remain. These changes do not alter save or
retention logic. Settled rendering is measured at 320/360/390/768/1440px without
disabling motion. The focused workflow reruns only affected build/native/browser
checks and the preserved Save journey, rather than the full prior functional suite.

Run after the clean install/browser setup above:

```sh
npm run check
npm run build
python3 tools/reference/html-semantics.py
npm run test:consumer
npx playwright test --config playwright.reference-quality.config.ts
npx playwright test reference.spec.ts --grep 'reference Experience saves'
```

The inventory is observation data; browser assertions and the qualification
receipt enforce PASS. No complete accessibility-conformance claim is made.
Physical iOS/Safari, full screen-reader usability and a complete contrast audit
remain explicit limitations unless separately executed.

CMS typing/build/startup, revision-pinned preview and Studio functional tests are
reused from 40676100962 only after byte comparisons establish unchanged CMS,
plugin, lock, authorization, publishing and UI inputs. They are not described as
freshly rerun by this command. Existing broader semantic qualification is reused;
the eight current records and public-root integration are freshly exercised.

## Content and release boundary

EmDash is editorial authority; Git is application source authority. The admitted
export is a read-only snapshot, not continuous CMS synchronization. Explicit
revision/body/export checks remain required before production releases. Neither
browser nor public Worker receives CMS credentials. This task installs no
credentials, policy or publishing switch and publishes no content.

The last admitted disabled production baseline is
`sha256:72f3438e71978cd0f407ded7dc262bdcb6554551a8b839d9e840e54c977bf9be`:
publication Worker `550fc464-64d6-4f9a-9517-a1b58f9dde38`, CMS Worker
`77d6af24-90c7-4365-b351-d108a22ee829`. These are historical admitted identities,
not a fresh private-provider inspection or authorization to deploy this branch.
Both publishing paths remain disabled; no switch is written during qualification.

## Remaining prototype-suite work

Applications 2–4 are explicitly **UNASSIGNED**, per operator direction. These are
concrete coverage-verification slots, not invented application identities or
preselected product requirements. Apply a capability only when that application
actually selects it; record explicit non-applicability rather than inventing a CMS
or reader surface to satisfy the matrix:

| Slot | Next implementation and acceptance task |
|---|---|
| 2 — UNASSIGNED | Bind the designated application's existing declaration/readers to public Arsenal Core and the actual provider ports. Run its clean-lock/native host proof; use its own IDs/origin/routes. This becomes the second real consumer requirement before extracting Site composition. |
| 3 — UNASSIGNED | Wire the designated application's real reader/interaction surface to existing public Engine ports with explicit selectors, storage/cleanup and locale. Prove an actual interaction/reload round-trip before proposing Arsenal Experience extraction. |
| 4 — UNASSIGNED | Implement its selected content vocabulary and provider adapter through the public Editorial root; qualify real content, reference resolution, preview/authorization boundaries and affected discovery. Structural/new-block needs remain separate application work. |

Each application needs its own repository identity, content/privacy model and
runtime acceptance test. This fixture does not pretend those unknown products
are implemented or that independent configuration alone proves a second full
application. Product-specific backlog can replace these slots when supplied.

Experience extraction remains conditional on a second real consumer. Site
extraction (harvest A12–A15) remains conditional on a second real application's
route/discovery requirements. This responsive/semantic completion extracts neither.
Do not extract the whole Studio, introduce `@gaga/blog`, or publish a generic reader
SDK from this single reference application.
