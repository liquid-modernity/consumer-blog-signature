# EmDash activation

The real local CMS is EmDash **1.3.1**, Astro **7.3.3**, React **19.2.4** and
Node adapter **11.1.5**. Run `npm run cms:dev` from the repository root; the admin
is <http://localhost:4321/_emdash/admin>. The separate `cms/` app uses SQLite
(`cms/.data/cms.db`), local uploads (`cms/.data/uploads`) and private Astro sessions.
Keep its database, sessions, uploads, `.env.cms.local` and passkeys out of Git.

The user completed admin/passkey setup. The supported EmDash CLI applied 90
migrations and imported **seven posts and one author**. Titles, slugs, Markdown
bodies, original dates/taxonomy/author metadata and application IDs were preserved.
Native provider content/revision IDs are recorded separately. EmDash owns later
editorial edits; migration files are not a second writable CMS.

## What passed locally

`npm run cms:verify` uses the actual authenticated EmDash REST interface. Its
receipt is `cms/migration/local-proof.json`: eight admitted records, repeated
stable reads, exact body/metadata checks, published listing, draft exclusion,
draft-overlay rejection, stale revision rejection and unauthorized/denied access.
A temporary test record is removed afterward; the original records remain.
Public Corps consumes the real responses, Arsenal composes them and public Engine
Search finds the expected articles. The site now renders/indexes the admitted
export in `content/emdash/published.json`, with native revision pins and a SHA-256
receipt. No browser, static Worker or blog build receives a CMS token.

The export is a recorded read, not continuous synchronization. Refresh it explicitly
with a read-only PAT before rebuilding. See [the local command guide](../cms/README.md).
Production CMS reads, production authentication and deployment are not yet proven.

## Production model

Use **one separate CMS Worker**, `consumer-blog-signature-cms`, at:

`https://consumer-blog-signature-cms.ratriatra.workers.dev`

This is the planned `CMS_ORIGIN`; the account's `ratriatra` subdomain was verified
by read-only API. Its three stores are now provisioned; CMS deployment is a separate gated action. The existing static website
and Search Worker remain unchanged. Embedding the CMS would require replacing
their static/no-Node runtime with stateful SSR. A separate CMS keeps the existing
publication build/rollback path and avoids copying local admin sessions to production.

`cms/astro.cloudflare.config.mjs` uses `@astrojs/cloudflare@14.3.4` and
`@emdash-cms/cloudflare@1.3.1`. `cms/src/worker.ts` re-exports the supported EmDash
Worker. The CMS needs `nodejs_compat`; the publication/Search Worker still disables
Node compatibility. Images use passthrough; sandbox plugins are disabled.

| Type | Name | Where | Required value/source | Purpose |
|---|---|---|---|---|
| Existing secret | `CLOUDFLARE_API_TOKEN` | GitHub repository Actions secrets | Existing token, with account-scoped D1 Write, Workers R2 Storage Write and Workers KV Storage Write; retain existing Worker permissions | Provision the three stores; future CMS deployment |
| Existing secret | `CLOUDFLARE_ACCOUNT_ID` | GitHub repository Actions secrets | Existing verified account | Select the same Workers account |
| Variable | `CMS_ORIGIN` | GitHub repository Actions variables | Planned CMS URL above, only after provisioning/deployment | Authenticated export origin |
| Secret | `CMS_READ_TOKEN` | GitHub repository Actions secrets | Operator-created production EmDash PAT, `content:read` | Build-time published-content refresh only |
| D1 binding | `DB` | CMS Worker / `cms/wrangler.jsonc` | Database `consumer-blog-signature-cms`; ID from provisioning receipt | Content, schema, users and revisions |
| R2 binding | `MEDIA` | CMS Worker / `cms/wrangler.jsonc` | Bucket `consumer-blog-signature-cms-media` | CMS uploads |
| KV binding | `SESSION` | CMS Worker / `cms/wrangler.jsonc` | Namespace `consumer-blog-signature-cms-session`; ID from receipt | Astro/EmDash login sessions |

D1 and R2 are the installed EmDash stores; KV is required by the selected Astro
Cloudflare adapter's default session driver. No extra hostname, Images binding,
plugin secret, Durable Object, SMTP service or second content store is required
for this slice. Run [40135546990](https://github.com/liquid-modernity/consumer-blog-signature/actions/runs/40135546990) created exactly these three empty stores. Their exact IDs, bindings,
source and verified receipt digest are recorded in `cms/provisioning.json`.

## Current permission checkpoint

The operator replaced the repository workflow secret with a dedicated User token.
Read-only preflight [40135161538](https://github.com/liquid-modernity/consumer-blog-signature/actions/runs/40135161538)
passed for the intended Workers account and all D1/R2/KV inventory endpoints.
The later provisioning run confirmed creation access by creating only the three
approved stores. Historical denied-access receipts remain preserved.

## Provisioning and production token sequence

After the operator permission checkpoint, run the manual `provider-preflight`
operation in `.github/workflows/emdash-activation.yml`. It performs GETs only.
The explicit `provision` operation first runs clean CMS/blog validation, then
whole-set account/resource admission before creating only the three empty stores.
It never deploys a Worker, overwrites/adopts an existing store, retries a create
or deletes resources. Partial creation stops and records the last operation for
provider inspection. Keep the external receipt and fill real binding IDs from it.

The explicitly authorized manual `deploy-cms` operation validates the current
CMS/blog source, uploads that same run's compiled CMS artifact, rechecks the exact
created stores, and refuses an existing CMS Worker. Wrangler automatic resource
creation is disabled. A failed upload is never retried automatically. The workflow
records deployment/binding/readiness evidence outside the source checkout and
checks that unrelated Workers are unchanged. It does not deploy the publication
website, promote `main`, create an admin or mint a token.

After the dedicated CMS is available:

1. Open `https://consumer-blog-signature-cms.ratriatra.workers.dev/_emdash/admin`.
   Choose the real site details/email and register the operator's own passkey.
   Never reuse localhost sessions or share the passkey with chat.
2. Open `/_emdash/admin/settings/api-tokens` on that origin and create an
   administrator-owned export PAT with only **`content:read`**. Token scope and
   user role are separate checks; `content:read_drafts` is not a PAT scope.
   The connector still rejects draft overlays.
3. Store it as `CMS_READ_TOKEN`; set `CMS_ORIGIN` to that same exact origin.
   Do not put the token in `gaga.app.json`, repository source or runtime bundles.
4. Import the admitted editorial records through the supported EmDash interface,
   retain application IDs, and record fresh production-native IDs/revision pins.
   Refresh/validate the export before a separately authorized website promotion.

Keep the previously deployed static website available for rollback. Do not
introduce another writable editorial source or claim production CMS proof early.

## Provider references

- [EmDash Cloudflare deployment](https://docs.emdashcms.com/deployment/cloudflare/)
- [EmDash REST interface](https://docs.emdashcms.com/reference/rest-api/)
- [D1 creation permission](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/create/)
- [R2 creation permission](https://developers.cloudflare.com/api/resources/r2/subresources/buckets/methods/create/)
- [KV creation permission](https://developers.cloudflare.com/api/resources/kv/subresources/namespaces/methods/create/)
- [Update an existing Cloudflare token](https://developers.cloudflare.com/api/resources/user/subresources/tokens/methods/update/)

## First live production activation

Production EmDash is healthy at the dedicated CMS origin above. The eight admitted
records were imported through supported same-origin REST using the operator's
existing session, with no new credential. Production-native pins and body/date
hashes are in `cms/migration/production-receipt.json`; published-only reads with
`CMS_READ_TOKEN` generate `content/emdash/published.json`. No token is bundled.
Token scopes and the owner's draft permissions differ: request published records
explicitly and retain Corps draft/stale guards.

The publication release workflow is `.github/workflows/deploy.yml`: qualify the
exact commit with the production revision export, promote that qualified source
to main, then deploy the same artifact with its qualification run. Deployment
never rebuilds. Provider preflight records the existing Worker version; failed
mandatory readback/browser verification restores that pinned version once.
The CMS Worker/stores are not redeployed by publication releases. No Rich Editorial
Studio, Tank, editor redesign or upstream package change is included.

## Forward foundation admission

A saved non-public draft is not published-state drift. Deployment refresh verifies
admitted published data/revisions and denied anonymous CMS access before projecting
published-only records. Commit sign-off text is not release identity; source/tree,
qualification, exact artifact bytes and canonical main are independently admitted.
CMS deployment accepts an explicit expected current Worker state and rechecks it
before the single upload. Historical migration rollback pins remain historical.
An existing CMS ZIP may be reused only when its exact run/source/digest match and
all CMS build inputs are unchanged. Foundation installation does not activate publishing.
