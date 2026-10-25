# Rich Studio production cutover

The current EmDash production records own editorial state. The operator explicitly
readmitted revision `01M5S1YZCPHZ5HPA8Q9XQNMEB1`; the earlier drift stop remains
historical evidence. `cms/editorial/source-set.json` is the immutable conversion
input, not a writable CMS. `migration-plan.json` derives only from that input.

The qualified cutover uses native EmDash schema/content REST APIs in the existing
operator session. It adds `content`, preserves the original TEXT `body` and its
required/unique constraints, and applies managed widgets to integration/archive
fields. Existing IDs and historical revisions survive. Native author references
use production IDs. Pages/reference/section collections are admitted empty.

The application-owned public native plugin makes `content` editable and validates
the preserved archive hash on save. New rich records in the legacy required-field
model receive a managed, noncanonical creation snapshot. There is no core patch,
private runtime import, second CMS, or change to released GAGA packages.

## Qualification and recovery

The maintained Rich Editorial Studio workflow qualifies the exact source and
migration plan, rehearses all eight records against isolated native EmDash, and
seals CMS and publication artifacts. `production-preflight` is read-only.
`production-backup` additionally captures the provider D1 Time Travel bookmark;
its recovery window depends on the account plan (7 or 30 days). Capture it
immediately before writes and keep the receipt outside public source.

Pause operator edits and disable competing publication/CMS workflows for the
cutover, recording and later restoring their previous workflow states. Before
writes, verify all eight revision pins, main, both Workers, resource bindings,
source/plan/export digests, and the recoverable bookmark. Any drift stops the
whole set before mutation. Each write is journalled; there are no automatic retries.

On a partial failure, stop and inspect the exact journal. Do not replay writes,
restore individual older articles, or assume a Worker rollback restores D1.
Coordinated recovery requires the pre-cutover D1 bookmark, old revisions/export,
source identity, and both pinned Worker versions. Verify no new operator edits
before an explicitly controlled D1 restore; restore/reverify matching CMS/source/
export state together. Preserve the failure evidence. R2/KV identities remain fixed.

After migration, verify each record twice and explicitly admit the new revision
pins/export. Only those receipt/export outputs may change while reusing the
qualified CMS artifact; every other controller/runtime input must remain identical.
The manual `deploy-cms` operation admits that exact successful-run artifact, checks
its digest and complete file inventory, and uploads once with provisioning disabled.
It never builds during upload or deploys the publication Worker.

## Release boundary

Full post-migration qualification seals a separate publication candidate. Main
promotion and exact publication artifact deployment require the next release task.
The old production publication remains available. The actual-PAKRPP draft preview
is qualified locally; production draft preview is not exposed to the public site.
Known noncritical editor layout imperfections are deferred. No complete accessibility
or external media-service certification is claimed.
