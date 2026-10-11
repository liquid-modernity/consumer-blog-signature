# consumer-blog-signature 0.0.1

Universal, configurable, softcoded high-end blog / knowledge-publishing bootstrap. Astro is the rendering framework; Gaga Engine is the external kernel installed from Cloudsmith.

## Signature shell
- All reading layouts: Gaga Dynamic Notch Island at top-center for contextual actions and live reading state.
- Article layouts: Gaga Dynamic Outline Peek at bottom-center for semantic section position and outline navigation.
- Desktop: vertical global navigation icon-only at the far left, context-aware left rail, main canvas, context-aware right intelligence rail.
- Tablet large: icon global navigation, collapsed left rail, optional right intelligence rail.
- Tablet mini / Mobile: compact reading chrome; article pages suppress the conventional mobile dock so the Outline Peek remains the single bottom reading surface. Non-article compact pages retain the mobile dock.

## Core contracts
`src/config/capabilities.ts`, `routes.ts`, `actions.ts`, `experience.ts`, and `design.ts` are the product-policy authorities. Gaga Engine remains an npm dependency and is not vendored into this repository.

## Gaga registry
```bash
npm config set @gaga:registry https://npm.cloudsmith.io/gaga/gaga/
npm install
```
The repository pins Gaga packages to `0.1.6`.

## Local review on macOS Catalina
Catalina is a review client, not a build machine. Put the Cloudflare preview URL in `.review-url` or export `CONSUMER_REVIEW_URL`, then double-click `run_local.command`.

## Modern machine
```bash
npm install
npm run dev
npm run verify
```

## Cloudflare
GitHub Actions builds with Node 22.19 and deploys static Astro output through Cloudflare Workers Static Assets. Configure `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and repository variable `PUBLIC_SITE_URL`.

## Important
This is version `0.0.1`: a migration candidate derived from the supplied vehicle-blog architecture, with generic identity/content, signature shell, Gaga 0.1.6 bindings, Cloudflare CI scaffolding, and Catalina remote-review launcher. The sample content is deliberately domain-neutral and replaceable.
