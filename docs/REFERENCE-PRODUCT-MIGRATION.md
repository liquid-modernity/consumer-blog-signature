# Reference-product extraction migration — review checkpoint

Status: **PARTIAL / public registry admitted; normal production qualification pending**. Production remains canonical
`1edf5c63117e6529c4460ddfb9c34c9a0b31e03e` on Publication Worker
`ed83438b-8138-49fe-af9e-8870ff76692e`; CMS is unchanged. This review is not
production-admissible until exact Arsenal 0.3.0 registry admission and the normal
Application 1 qualification/deployment path succeed.

Application 1 consumes the two existing Arsenal package identities through public
subpaths. The source declaration and actual registry lock/admission use exact numeric 0.3.0.
The previous 0.2.0 admission remains immutable in its recorded canonical commit. The isolated
`reference-extraction.yml` reusable proof runs from Arsenal CI with its own
read-only Actions token, checks out an exact public application commit and installs only the hosted-qualified tarballs,
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
[ADR 0002](https://github.com/liquid-modernity/gaga-arsenal/blob/195ee572c147797e1cdc7a3c9ec093d4376fc2da/docs/ADR-0002-reference-product-extraction-v1.md).
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

## Branding neutrality proof

Existing site configuration now supplies mixed-case display identity and navigation
accessibility identity. Root H1, navigation monogram/label, preview source label,
Notch fallback title and author/graph kickers read those values. Their current
production strings remain unchanged. Profile descriptor data lives with the
existing presence-content configuration; RSS/knowledge links consume route helpers.

`tools/reference/branding-proof.mjs` renders the exact six application components
with two synthetic identity/favicon/provider configurations in isolated Astro
hosts. Component bytes are checked before and after; no component source is
modified for either instance. This renderer proof shares installed test tooling;
it is distinct from the separately verified clean packed-package installation.
Legacy private DOM hook names remain for qualified selector compatibility. They
do not supply identity text, routes or package semantics; a rename would require
a separately qualified selector migration.

## Final held-artifact proof and remaining release boundary

Hosted run [41489610845](https://github.com/liquid-modernity/gaga-arsenal/actions/runs/41489610845)
qualified application source `334b879c66cd816d553bdd67e6e91ba3be057c7a`:
318 Node tests, 186 browser cases (178 Chromium and 8 WebKit), zero failures,
skips or flakes, strict types, the 121-page build and two exact-renderer branding
substitutions. The whole UI source profile is admitted additively with negative
hybrid/drift tests; historical inventories and profiles are unchanged. This is
presentation evidence, not a waiver of public registry or production admission.

The exact two package artifacts belong to canonical Arsenal release source
`195ee572c147797e1cdc7a3c9ec093d4376fc2da`, stable qualification `41482398314`.
Publication attempt `41487482921` stopped at independent host acceptance before
any upload. The existing Release Control Plane requires the operator to accept
the exact qualified proposal; code, tests and credentials do not substitute for
that acceptance. No protected acceptance value is read by this migration.

Until actual public package publication, fresh numeric registry lock/admission,
normal Application qualification and exact-artifact deployment pass, this remains
a qualified **staged public-API consumer**, not a newly deployed production release.

## Actual registry admission

Publication [41506110039](https://github.com/liquid-modernity/gaga-arsenal/actions/runs/41506110039)
passed the existing independent-host acceptance gate and published both exact
0.3.0 artifacts. Anonymous SHA-256/SHA-512/SRI/export readback matches the accepted
bytes; supported-host public consumers passed on Node 22.22.2. Application lock
SHA-256 is `15a7fde56eb24d66c879535c750507aa41eaa565627c798e151320ced1a253a5`;
only the two Arsenal dependency entries and root declarations differ. No file or
workspace resolutions are admitted. Vendor provenance pins the actual publication
and preserves the historical 0.2.0 admission.

The earlier `cleanCommittedLockInstall=false` described a regenerated temporary
held-artifact fixture lock, followed by successful clean npm ci. It did not prove
an unchanged committed registry lock. The normal production qualification must
now install this committed numeric registry lock on required Node 22.22.2, verify
installed package bytes and seal the exact application artifact. Local Node
22.19 observations are not substituted for that supported-host gate.
