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
by read-only API. The service has not been deployed. The existing static website
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
for this slice. No production resource has been created. Resource creation can
use the existing workflow once its token permissions are confirmed; no replacement
credential is inherently required.

## Current permission checkpoint

The read-only preflight verifies an active credential and the correct Workers
subdomain. D1 listing is denied (HTTP 401, code 10000). R2 and KV listing succeed,
which proves read/list access, not creation permission. Token name and permission
policies cannot be inspected with this credential (HTTP 403, code 9109). Do not
claim a complete scope inventory or infer write permissions from these reads.

The user-token verification endpoint accepts the credential; the account-token
endpoint rejects it. This indicates a user token, but its owner metadata is not
readable. Locate the existing token under **My Profile → API Tokens**, checking
its non-secret token ID against the private diagnostic receipt. Cloudflare supports
updating token permissions in place; rotating/replacing it is a separate operation.
Do not broaden API-token-management privileges just to make this diagnostic pass.

The next operator step is to inspect that token's existing account scope and
confirm **D1 Write**, **Workers R2 Storage Write**, and **Workers KV Storage Write**
(the dashboard may label these **Edit**) for the same account. Preserve Worker
permissions. Current evidence proves D1 access is missing; R2/KV write access is
unproven. No token mutation or provisioning has been performed.

## Provisioning and production token sequence

After the operator permission checkpoint, run the manual `provider-preflight`
operation in `.github/workflows/emdash-activation.yml`. It performs GETs only.
The explicit `provision` operation first runs clean CMS/blog validation, then
whole-set account/resource admission before creating only the three empty stores.
It never deploys a Worker, overwrites/adopts an existing store, retries a create
or deletes resources. Partial creation stops and records the last operation for
provider inspection. Keep the external receipt and fill real binding IDs from it.

Production CMS deployment and its first admin setup need a later explicit action;
this task does not deploy the website or promote `main`. After that CMS is available:

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
