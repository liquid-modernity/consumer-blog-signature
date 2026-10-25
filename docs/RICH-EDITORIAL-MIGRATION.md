# Rich Editorial Studio: production migration proposal

Status: **DESIGN ONLY — production migration and deployment NOT AUTHORIZED.**

Baseline: main `6827195c5d2e04efe26656ae4372d449481d2979`; CMS Worker
`0bf4b66d-23bb-435f-8b14-0b2d7e64fd13`; publication Worker
`af6c1291-c509-4095-b7c1-a77c9007a390`. The preserved published export SHA-256 is
`bd15f8f3d88cd69cb87efe02fd5fd242ffefee08906aebc3d6d9b50400126d42`.
Production-native content/revision pins remain in `content/emdash/published.json`.
Freshly compare all eight pins and Worker/source identities before any mutation;
stop on drift rather than applying an old conversion to newer editorial work.

## Supported migration path

The real local schema API rejects TEXT → Portable Text JSON in-place with
`FIELD_TYPE_COLUMN_CHANGE`. The local seven-record rehearsal proves an additive
migration through supported schema/content APIs:

1. Freeze editorial writes and publication refresh/deploy concurrency. Back up D1
   and record its schema, eight admitted records/revisions and both Worker rollback
   references. Agree on coordinated recovery before starting.
2. Use a separately authorized operator session or operator-created, temporary
   minimum migration credential with schema/content read/write. The current
   production `content:read` PAT cannot perform this migration. Never commit or
   share credentials. Do not create an administrator or token automatically.
3. Add a new Portable Text `content` field using `pakrpp-studio:body`. Retain the
   original Markdown `body` as a managed read-only archive. Do not alter its SQL
   type, delete it, or bypass native schema validation.
4. Apply the deterministic conversion to the seven articles and author profile.
   Preserve native content IDs, application IDs, titles/slugs, dates, taxonomy,
   metadata and author relations. Use native reference relations; provider-native
   IDs are distinct from application IDs. Record each old/new revision ID.
5. Declare `integration.canonicalBodyField: "content"` and preserve the exact
   Markdown SHA-256 in `integration.migratedFrom`. The save hook rejects archive
   changes. Only Portable Text is editable canonical content after cutover.
6. Publish through native EmDash semantics with original publication dates. Read
   every admitted record twice; verify content hashes, relations, dates, status,
   unique IDs and original Markdown in historical revisions. Stop on partial or
   inconsistent state; no blind retry.
7. Explicitly adapt/readmit the read-only export and its pins for the new canonical
   field and native relations. The current production exporter intentionally pins
   the old body/revisions; the implementation does not silently refresh them.
   Reusable sections need an explicit admitted published section map before use.
8. Qualify the exact new CMS and publication artifacts against the new export,
   including all rendering/Search/preview/browser and workerd gates. Request
   separate source promotion and exact-artifact deployment approval. Do not mix
   schema changes with an unqualified website deployment.

Pages is prepared locally only. Production Pages, routes, reference/section
libraries and new editorial records require their own explicit admission; they
are not an automatic side effect of article conversion.

## Recovery and acceptance

A Worker rollback alone cannot undo database schema or revision changes. Restore
D1/export/source and the matching Worker versions as one coordinated rollback if
necessary, retaining failed receipts and never overwriting newer user edits.

Acceptance requires exactly the admitted seven articles and one author, no data
loss, stable native revisions, one editable canonical body, intact published/draft
and authorization guards, and a verified production export → build → deployment
chain. No production changes are executed by this proposal.

## Extraction decision

Keep the native plugin, content vocabulary, migration and PAKRPP renderer owned by
this application. Shared structured content validation, block discovery and
composition/preview inputs are possible future Arsenal modules only after a
second independent application demonstrates the same contracts. Nothing here has
earned a new Engine, Corps or Arsenal package yet.
