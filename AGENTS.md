# consumer-blog-signature

Application-owned UI, routes, Dynamic Notch, typography and presentation stay here.
Use public Engine 0.4.0, Corps 0.1.0 and Arsenal 0.1.0 packages only. Arsenal registry artifacts are pinned in
vendor/arsenal-consumer.json. Read docs/ARSENAL-DOGFOODING.md before changing integration.
EmDash is the editorial authority. content/emdash/published.json is its admitted
read-only export; original Markdown and content/emdash/snapshot.json are immutable
migration evidence. Do not edit them as a second CMS or execute remote MDX.
Read docs/EMDASH-ACTIVATION.md before CMS or provider work. The separate CMS under
cms/ owns its own build; keep it outside the parent TypeScript project.
Run npm run verify on supported Node 22.22.2+/Ubuntu and npm run test:ui.
Do not publish upstream packages or deploy production from a review branch.
