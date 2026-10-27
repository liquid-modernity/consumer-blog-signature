> Historical tarball rehearsal. The current registry-backed successor is
> [Arsenal 0.2.0 registry adoption](ARSENAL-020-REGISTRY-ADOPTION.md).

# Packed editorial consumer rehearsal

This review installs `@gaga/arsenal@0.2.0-editorial.0` from the exact unpublished
candidate tarball recorded in `vendor/arsenal-editorial-review.json`. Its source
is Arsenal `395982f3fe2e2ae27efb6bdabda3f822cef31c17`, qualified in run
40481661000. The application starts at the qualified rehearsal
`25bf99cafbbfd1bd7a98e6589efa1edb39bac001`, based on canonical
`5b593c3ee0b42645941c648c0e2f01fb3028b8d3`. No released artifact is overwritten.

`editorial/content-semantics.mjs` adapts the application widget descriptors to
`createPortableTextSemantics` from the **public root**. Arsenal owns validation,
section resolution and plain text. The local implementation is deleted. Only
ignored, temporary test oracles are reconstructed from the pinned Git commit;
there is no second maintained implementation. The compatibility type inventory
remains application metadata, not an independent validation authority.

The application keeps contextual URL handling (unchanged), HTML/KaTeX rendering,
Markdown conversion, widget mappings, body/archive selection, routes, metadata,
preview authorization and native publishing. EmDash retains revision authority;
Garrison release contracts and all other GAGA packages remain unchanged.

Run the review proof on Ubuntu 24.04 / Node 22.23.4 / npm 10.9.3:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm ci --prefix cms --ignore-scripts --no-audit --no-fund
GAGA_ARSENAL_EDITORIAL_REVIEW=1 node tools/gaga/editorial-review.mjs
```

`.github/workflows/editorial-integration.yml` runs the affected regressions,
all eight record equivalence checks, strict types, actual publication/CMS builds,
Starlight, native publication Search and local compiled CMS startup. One local
browser case covers editor hydration, draft save/reload, canonical preview and
anonymous denial; the four existing desktop/mobile publication cases also run.
It performs no publish/unpublish action. All runtime stores
remain local and outside uploaded evidence; no credentials are supplied.

The explicit review flag only admits the pinned tarball in this qualification
job. Default production guards still reject this unpublished file dependency.
An independent configuration exercises the actual package root; the detached
package/declaration proof from Arsenal run 40481661000 is reused without copying
its implementation or rerunning that unchanged package qualification.

Stop if artifact hashes/installed bytes differ, an unrelated lock identity
changes, baseline behavior differs, or integration requires changing unrelated
contracts. A failed package/browser/runtime boundary is a concrete blocker, not
permission to patch the candidate or widen provider/build contracts.

No package publication, canonical promotion, provider inspection/deployment,
production CMS writes, publishing activation or Escutcheon change is authorized.
Passing this rehearsal justifies a separate package/adoption decision. It does
not qualify production or certify an unchanged historical browser suite anew.
