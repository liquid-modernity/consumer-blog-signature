# Arsenal 0.2.0 registry-backed consumer adoption

This review starts at qualified consumer integration
`e4e8149f3ce03969e71575dd7a719ad3b6882358` (hosted run 40488444126).
Both direct Arsenal dependencies now use exact numeric `0.2.0` specifications and
normal npm-generated Cloudsmith lock entries. Only those two installed package
entries and their root dependency specifications change; every Engine/Corps,
framework, transitive and CMS dependency identity remains unchanged.

`vendor/arsenal-consumer.json` admits the published stable artifacts from source
`4e53068363fd842ee8e672c316a9ee64af8a6f8f`. Publication run 40506236943 uploaded
both exact packages successfully, then failed its editorial lock-transition
proof. The separate read-only run 40518413061 completed that proof with unchanged
published bytes. Neither historical source/run is relabeled. Both API and schema
remain experimental under the existing Arsenal contract.

The active `GAGA_ARSENAL_EDITORIAL_REVIEW` bypass and its helper are removed.
Default dependency boundaries now apply without exceptions: numeric versions,
Cloudsmith origins, exact SRI, no links/local resolutions, public imports only.
Focused regressions prove the former flag cannot admit an unpublished tarball.
The archived review tarball and its receipt remain historical evidence, never an
active dependency or fallback.

The application adapter is byte-identical to the qualified integration. It still
delegates only validation, reusable-section resolution and text projection to
`createPortableTextSemantics` through the public root. The application owns widget
mapping, URL context, rendering/KaTeX, Markdown conversion, canonical/archive body
selection, preview authorization, native publication policy, orchestration,
routes and presentation. No second semantic implementation is maintained.

The existing editorial integration workflow now qualifies this registry review on
Ubuntu 24.04 / Node 22.23.4 / npm 10.9.3 with committed-lock clean installs. Fresh
checks cover guarded dependency identity, eight-record/oracle equivalence,
editorial/plugin/preview/Search regressions, strict application/CMS types,
publication/CMS builds, actual Starlight, native workerd Search, local compiled CMS
startup, local editor draft save/reload/canonical preview, four desktop/mobile
publication browser cases, workflow lint, and application/CMS audits. Search
output and composition-plan digests must equal prior run 40488444126.
The existing registry consumer independently downloads actual packages and checks
both artifact hashes, SRI, manifests and every installed file against tar bytes.

All CMS writes and setup in these tests target isolated local SQLite/emulated
stores. No provider credentials or deployment environment are supplied, and no
production transition is performed. Publishing is explicitly disabled in the
qualification environment. Package publication qualification and historical
production evidence are reused only for unchanged scopes; this is fresh local
integration qualification on hosted Linux, not live-provider certification.

Canonical promotion and deployment require a separate decision after this review.
The existing production release workflow/guards, canonical main, production
content and provider configuration remain unchanged. Do not open a PR merely for
qualification: the historical PR preview workflow can deploy a preview Worker.
