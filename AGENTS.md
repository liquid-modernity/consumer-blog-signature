# consumer-blog-signature

Application-owned UI, routes, Dynamic Notch, typography and presentation stay here.
Use public Engine 0.4.0 and Corps 0.1.0 packages only. Arsenal artifacts are pinned in
vendor/arsenal-consumer.json. Read docs/ARSENAL-DOGFOODING.md before changing integration.
Published editorial files referenced by content/emdash/snapshot.json are read-only
snapshot bodies; do not treat them as a second CMS or execute remote MDX.
Run npm run verify on supported Node 22.22.2+/Ubuntu and npm run test:ui.
Do not publish upstream packages or deploy production from a review branch.
