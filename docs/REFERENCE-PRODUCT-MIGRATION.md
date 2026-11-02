# Reference-product extraction migration — review checkpoint

Status: **PARTIAL / pre-publication qualification**. Production remains canonical
`1edf5c63117e6529c4460ddfb9c34c9a0b31e03e` on Publication Worker
`ed83438b-8138-49fe-af9e-8870ff76692e`; CMS is unchanged. This review is not
production-admissible until exact Arsenal 0.3.0 registry admission and the normal
Application 1 qualification/deployment path succeed.

Application 1 consumes the two existing Arsenal package identities through public
subpaths. The new source declaration uses exact numeric 0.3.0; the old registry
lock/admission intentionally remains historical until publication. The isolated
`reference-extraction.yml` proof installs only the hosted-qualified tarballs,
retains the original source lock, rejects unrelated dependency drift and confirms
that the unchanged production boundary rejects local package resolutions. That
staged proof never substitutes for the production registry gate.

| Application responsibility | Public composition consumed |
| --- | --- |
| Actual command records, labels and availability inputs | `@gaga/arsenal/application`: `createCapabilityCatalog` |
| Canonical configured routes, taxonomy and data binding | `@gaga/arsenal/site`: `routePath`, `resolveLocalContext`, `flattenNavigation`, `headingSequence`, `hasLocalNavigation`, `localNavigationLayout` |
| Product timing/geometry/rail thresholds | `@gaga/arsenal/experience`: `createSignatureExperience`, `createSurfacePlanner` |
| Notch DOM/lifecycle and page context | `projectNotchContext`, `resolveNotchPresentation`, `positionLinkPreview` |
| Concrete appearance tokens and root preference projection | Shared roles plus opt-in `@gaga/arsenal/experience.scss` |
| One admitted public Search index | `@gaga/arsenal/search`: `publicSearch`, `searchRank`, `normalizeSearch`, delegating matching to Engine |
| Canonical origin, UX feedback strings and output bounds | `@gaga/arsenal/share`: `createShareComposition` |
| Locale policy, provider bindings, identity and active capabilities | `@gaga/arsenal/presence`: `createPresenceComposition` |

The renderer, delegation/focus handlers, Personal State model/migration keys,
reader preferences, speech, Canvas poster execution, CMS normalization and
publication authority remain with their existing hosts. No public consumer imports
package internals. No new package, storage model, provider or search engine exists.

The package architecture decision is recorded in Arsenal
[ADR 0002](https://github.com/liquid-modernity/gaga-arsenal/blob/d63afaeb26a6e784fbf8ce996b15d10302376370/docs/ADR-0002-reference-product-extraction-v1.md).
It distinguishes the accepted bounded extraction from the proposed four-family
monorepo and deferred umbrella distribution. Existing GAGA STANDARD 1.1.0 is
preserved; its framework-adapter ownership conflict has an explicit versioned
supersession proposal. Garrison/Escutcheon remain governance/assurance authorities,
with no new application runtime dependency.

## Cleanup and compatibility

Five superseded local implementation modules were replaced by public imports.
Twenty-four unused surface/share scaffold paths were removed after the TypeScript
module resolver proved no active source importer. The exact path inventory and
negative regression are in `tools/reference/removed-paths.json` and
`tools/reference/dead-imports.mjs`. Historical evidence remains intact.

Intentional compatibility: current Saved/preferences keys and annotation migration,
content-route aliases and admitted public URLs remain unchanged. Removing these
requires a separate deterministic non-destructive migration and its own qualified
release. Historical package receipts and UI preservation profiles remain immutable.

New tests compare motion/geometry and sharing results against the exact qualified
baseline source; the remaining DOM, speech, anchoring, state and preference guards
remain in force. Moving a function to a package changes its source location, not
its product acceptance criteria.

## Experience quality

`gaga.experience-quality/v1` defines the 23 characteristics in Arsenal contracts.
Conformance references are bounded claims, not automatic verification. Automated
browser/contract/performance evidence cannot certify subjective desirability,
usefulness-in-context or humane copy. Those items require human review; physical
iOS/Safari and complete assistive-technology certification are not implied.
