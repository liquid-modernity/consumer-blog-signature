# consumer-blog-signature

PAKRPP's Astro publication application, composed with GAGA Arsenal, public GAGA
Engine **0.4.0** and GAGA Corps **0.1.0**. The blog owns its visual identity,
routes, editorial presentation, Dynamic Notch, Outline Peek and reader controls.

## Run and verify

Use Node **22.22.2** and npm **10.9.4** on a supported native host; CI uses Ubuntu
24.04. The repository's scoped `.npmrc` installs public GAGA packages anonymously
from Cloudsmith, including Arsenal **0.1.0**. Published Arsenal artifact hashes,
source and qualification are recorded in `vendor/arsenal-consumer.json`. Historical
development tarballs remain preserved but are no longer application dependencies.
`gaga.app/v1` and authoring APIs remain experimental.

```sh
npm ci --ignore-scripts
npm run dev
```

```sh
npm run verify
npx playwright install --with-deps chromium
npm run test:ui
```

`verify` validates the declaration and CMS snapshot, runs the existing signature
checks, checks TypeScript, builds the actual blog, composes Search, validates the
public registry dependencies and executes the Worker under native workerd.

## Application declaration and ownership

[`gaga.app.json`](gaga.app.json) declares identity, capabilities, integrations,
content sources, route ownership, runtime targets, environment references and
outputs. Arsenal writes an inspectable plan before reading content. The blog's
UI policies remain in `src/config/` and its presentation remains in `src/`.

- Engine supplies public Search, content/SEO utilities and browser runtime APIs.
- Corps supplies Astro, Starlight, EmDash and Cloudflare integration boundaries.
- Arsenal supplies validation, composition and bounded assembly at build time.
- The deployed Worker and browser consume ordinary public Engine/Corps APIs;
  neither requires an Arsenal application server.

The blog retains its native shell. Starlight **0.41.10** supplies the document
schema/projection; an actual Starlight rendering proof checks the integration
without replacing the blog with a documentation theme. Astro is **7.3.3**.

## Content authority

Editorial content is behind the read-only EmDash connector boundary. The current
input is explicitly a **pinned migration seed** from eight preserved published
blog documents, not a live EmDash export. Revision, draft, metadata and body-hash
checks reject drift. The Markdown files are snapshot bodies, not a second writable
CMS. Live EmDash origin, ingestion and authorized export remain a provider
activation step. Tank and Vehicle are not part of this stack.

See [the migration and ownership model](docs/ARSENAL-DOGFOODING.md) for the source
mapping, versions, snapshot refresh rules and limitations.

## Runtime and deployment

The application targets Workers Static Assets plus a Corps Cloudflare Search
handler at `/api/search`. Both Node compatibility modes are disabled. The same
assembled artifacts drive browser and Worker Search.

The [dogfooding workflow](.github/workflows/arsenal-dogfood.yml) admits source and
artifacts and requires passing consumer/browser/audit checks. Preview deployment
requires an explicit manual `deploy_preview` selection; ordinary dependency
validation does not deploy. Production promotion remains a separate decision.

## Signature interface

The top-attached Dynamic Notch and bottom-center Outline Peek remain application
code. The compact brand link keeps its normal navigation behavior; hover/long-press
reveals the Notch preview. Desktop expansion/collapse and mobile preview, article,
Search and knowledge routes have focused browser checks. The original styles,
frame markup, interaction source and route configuration are guarded against
unintended migration changes.

## Catalina review

Catalina is a review client, not a supported native build host. Put the preview
URL in `.review-url` or export `CONSUMER_REVIEW_URL`, then use `run_local.command`.
