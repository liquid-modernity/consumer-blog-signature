# Application content adapter

The editor-facing guide is [Content publishing](../../docs/CONTENT-PUBLISHING.md).

`content-release.json` owns the content field allowlist and application surfaces. The native EmDash plugin contributes only private saved-revision Preview/Publish controls. It uses public plugin routes, authenticated user context and scoped revision reads. It does not fork EmDash or embed provider credentials in the browser. Dispatch is an explicit injected trusted server adapter and defaults to disabled. Production CMS/publication Workers are not changed here.

The adapter validates the saved Portable Text vocabulary, identity, required metadata, references, route conflicts and admitted media. It calls public Corps projection, Arsenal normalization and Engine Search. Preview uses the exact selected revision and the existing PAKRPP rich renderer; it never treats a simulated draft projection as a real published provider read. The loopback proof denies anonymous access, checks authorized rendering and discards the HTML after use. No draft HTML, body, private CMS record or credential is uploaded as CI evidence. Native preview is sandboxed; production preview remains staged until that bridge is explicitly deployed.

The current public application uses a fixed migration route map. Editing an existing admitted article/author is supported. Slug changes, new Pages/records and new relation/media types require explicit route/model admission and are not silently guessed. Images with native media identities require a matching admitted catalog entry; new provider media integration is outside this change.

A static Astro build is currently the smallest safe build unit. The build runs in a disposable source archive with an explicit projection and no CMS/Cloudflare credentials. Readback scope comes from old/new artifact bytes, including changed Search/discovery output and removed paths. Runtime/browser qualification is reused only for unchanged runtime/source contracts; schema/plugin/renderer/dependency changes must be separately qualified. No historical 100+ suite is run for each article typo.

`projectPublished` produces deterministic public-only data, strips draft/provider bookkeeping and models unpublish without deleting CMS data/history. The application loader still excludes all original migration Markdown sources, including unpublished records, preventing archived content from reappearing. The staged snapshot admission change is required before enabling unpublish on the current deployed baseline; it is part of the one-time application foundation rollout, not a content fast-path exception.

Garrison owns `runContentRelease`, exact CMS `_rev` transition, source-bound host acceptance, artifact admission, Cloudflare deployment and the canonical technical receipt. The application supplies qualification/materialization through that public tooling interface; there is no Corps-specific or application-specific publisher.

## Activation boundary

This task qualifies the read-only path. A live deployment must separately install the staged native bridge and connect a trusted dispatch/post-publish qualification host. That host must persist the canonical result, enforce the reviewed source/profile/target policy and accept exact intent/artifact scopes. It must use a separately approved server-side write credential; the existing `CMS_READ_TOKEN` remains read-only. Missing host acceptance, dispatch or credentials is a hard deny. Editors never handle those values or invoke CI themselves.

No production write, scheduler, webhook, main promotion or Worker deployment is performed by the qualification workflow. Scheduling can later submit the same exact intent through native EmDash scheduling and the same guards.
