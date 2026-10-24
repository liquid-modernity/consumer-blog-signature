# Real Arsenal dogfooding

This migration preserves PAKRPP's native publication UI, routes, typography,
Dynamic Notch, rails, reader preferences and SEO decisions. No upstream owns them.
The original dirty worktree is untouched. A durable local checkpoint contains its
source, Git bundle, index, patch and tracked-byte inventory. The review branch is
based on GitHub main 8238a486d63271518c6fd40b3facd3235325cbfc, whose application
bytes match that preserved worktree.

## Dependencies and ownership

| Owner | Interface and direction | Version / source | Failure and refresh |
|---|---|---|---|
| Blog | UI, route matching, publication rendering, facet/command presentation | This repository | Existing signature audits + desktop/mobile browser tests |
| Arsenal | `gaga.app.json` → normalized declaration → composition plan → assembly | Public Cloudsmith 0.1.0, vendor/arsenal-consumer.json | Fail on invalid/missing/conflicting requirements before content reads |
| Engine | Public Search, content/SEO utilities, browser runtime | Public Cloudsmith 0.4.0 | Public package diagnostics, no private source imports |
| Corps | Astro/Starlight/EmDash/Cloudflare projections | Public Cloudsmith 0.1.0 | Explicit projection rejection, no host account authority |
| EmDash | Sole editorial CMS contract; read-only pinned body/metadata export | content/emdash/snapshot.json | Revision/draft/body hash gates; explicit reviewed export replacement |
| GitHub / Cloudflare | Source/CI and preview deployment/runtime | Existing repository/workflow and secure secrets | No production deployment from this branch; failed provider proof stays explicit |

Old npm aliases have been replaced by their actual public packages. The optional
Obsidian Markdown bridge still uses the public Engine Obsidian adapter 0.4.0,
because no Corps replacement is needed for that existing behavior. Engine packages
and adapters are not modified. Seven small presentation components previously
provided by the held legacy Astro package now live in src/components/primitives,
with their used helper types/security checks; they are application source, not a
compatibility facade or a new provider integration. Provenance is in the durable
migration evidence. Browser runtime imports use public engine-runtime subpaths.

## Run

Node 22.22.2+ and npm 10; supported native proof host Ubuntu 24.04.

```sh
npm ci --ignore-scripts
npm run verify
npx playwright install --with-deps chromium
npm run test:ui
```

The scoped .npmrc installs Engine 0.4.0, Corps 0.1.0 and Arsenal 0.1.0
anonymously from Cloudsmith. No workspace links or held tarballs are application
dependencies. `vendor/arsenal-consumer.json` pins the published Arsenal hashes and
source. Original dev.0/dev.1 artifacts and admissions remain historical evidence.

The real blog exposed two additive contract gaps: safe dotted machine endpoint
paths and explicit exact/prefix ownership. Stable 0.1.0 retains the corrected
implementation byte-for-byte. `gaga.app/v1` and authoring APIs remain experimental;
package publication does not freeze declaration compatibility. Engine and Corps
behavior remains unchanged.

## Application and routes

`gaga.app.json` is canonical structured composition input. It declares the real
site origin, Search, all four Corps integrations, editorial/application content
sources, exact machine routes and prefix ownership. Prefix ownership does not
replace the app router. The existing literal and generated routes remain in
src/pages and the document collection. The app owns the most-specific match.
The Search UI remains /search; /api/search is its separately declared Worker API.
Plans and projections are generated under ignored .gaga before any content read.
No secrets or provider credentials are included in declarations/plans.

Starlight 0.41.10 participates through its public document schema and Corps
projection. The blog deliberately retains its native renderer. A focused real
Starlight build of an admitted editorial document verifies actual route middleware
and outline projection, without importing the Starlight theme into the blog or
adding a public theme/demo route.

## Editorial content authority

There is no live EmDash endpoint or CMS secret configured in this repository.
The first checkpoint is explicitly a **pinned migration seed**, not a claim of a
live CMS export. `cms.example` and `seed-*` provider IDs are labelled placeholders;
application content IDs (including dotted legacy references) remain unchanged.
Provider IDs and application IDs are separate. Before connecting live EmDash,
replace this seed with an authenticated, host-accepted published export and its
real revision IDs/origin. Live provider deployment is not proven by this seed.

Eight existing published editorial Markdown bodies remain at their original
paths as read-only snapshot bodies. Their bytes and frontmatter must match the
snapshot inventory; draft/stale revisions and new unadmitted editorial files fail.
They are not a second writable CMS. Application-owned MDX shells, topic landing
pages, QA fixtures and system/route presentation remain application source.
There is no CMS write, two-way sync, background refresh or fallback to an
unverified editorial store. An updated CMS export requires reviewed pin/body
inventory changes and a rebuild; static Workers serve that same immutable set.
Existing Obsidian links and content paths remain intact.

## Search and runtime

Current application discovery policy selects public records. Corps projects CMS
and application records; Arsenal assembles/validates the set; public Engine
Search performs matching. Facet/command UI remains app policy. Build output
search-index.json supplies the same artifact set to the browser and Worker.
No Search matcher is duplicated in the blog.

The Worker uses Corps Cloudflare and forwards non-Search requests to Cloudflare's
ASSETS binding. Native workerd executes the built Worker with no_nodejs_compat
and no_nodejs_compat_v2, no outbound network and deterministic snapshot data.
The existing preview worker is the only authorized hosted target. Production,
upstream package publication, Tank, Vehicle and redesign are out of scope.

## Dogfooding findings

| Finding | Classification | Resolution |
|---|---|---|
| Legacy aliases point to mismatched public packages | Application concern | Correct actual public package names/imports |
| Blog owns historical UI/media primitives | Application concern | Preserve used source/behavior locally |
| Dotted machine endpoints and route namespaces not expressible | Arsenal contract deficiency | Add safe dotted paths and exact/prefix ownership; retain v1 experimental |
| Dotted application IDs differ from provider IDs | Application concern | Explicit identity mapping in migration seed |
| No live EmDash environment | Provider concern | Verified seed snapshot; live proof explicitly pending |
| Old Wrangler transitive security advisories | Application toolchain | Update owned deployment tool to 4.152.0; audit gate retained |
| Catalina cannot run modern esbuild/workerd | Environment limitation | Fresh supported hosted build/runtime proof |

The hosted consumer proof supports preparing Arsenal 0.1.0 for the contracts and
composer packages, with gaga.app/v1 still experimental. Publication and release
authorization remain separate. The actual contract changes are additive,
but this task does not claim a universal application SDK or stable persisted
application declaration compatibility.

Toolchain admission retains the upstream-qualified Prism 4.0.2 for Node 22.22.2.
A scoped Miniflare/Undici 7.30.1 security patch is locked because the current
Wrangler dependency otherwise fails the mandatory audit. The maintained UI
regression now checks the exact legacy class token, avoiding a pre-existing
false match against the intentionally preserved `__header`/`__heading` classes.

CI now uses explicit Bash pipefail and a deployment qualification receipt that
requires four passing browser cases, no failures/skips/flakes, a successful
consumer receipt and a zero-vulnerability audit. Preview deployment is explicit opt-in on manual dispatch; a failed consumer gate
blocks staging. Earlier failed or misleading-green attempts remain preserved as evidence.
