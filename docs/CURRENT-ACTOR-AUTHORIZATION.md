# Current actor authorization review

The application asks the EmDash host for a current native publication decision at selection, intent creation, delayed apply, and the native before-publish/unpublish hook. The original account ID comes from protected pending intent state. The opaque actor binding sent to the trusted service is correlation data and is never used as a user identity.

The new host capability is `authorization:check`. It returns only `allowed` and uses current native account eligibility, RBAC and resource ownership. The application stores actor/intent/action/resource/decision/result/time audit metadata in protected plugin storage. No role threshold, account directory cache, administrative credential, private runtime import or plugin database read is introduced.

EmDash owns native authorization and publication. The existing Garrison policy, source/controller/baseline binding, exact revision selection, signature, expiry, replay, CAS/lock, materialization and public readback gates remain separate. Unknown host authorization denies. Both the apply handler and lifecycle hook require the current native publishing switch. Author-profile records grant no account permission.

This review source requires the additive upstream contract. Production remains on official EmDash 1.3.1 and unchanged locks. No review implementation is patched into installed or production packages. The review-only hosted workflow applies a digest-pinned patch to an exact upstream source checkout, builds the workspace, and tests the application against that candidate in an isolated database and local workerd. The isolated fixture enables only its in-memory test settings and supplies no production credentials.

The contract is point-in-time, not an atomic authorization-and-mutation operation. The lifecycle recheck narrows the interval; native revision CAS detects concurrent content changes. A requirement for atomic account revocation and publication would need a separately designed EmDash-owned operation boundary.

Before production adoption: upstream review/acceptance and an official immutable package release, exact dependency adoption on a new application review, required qualification, separately authorized disabled deployment, then fresh baseline/policy readmission. No current policy is accepted and publishing remains disabled. Existing manager/writer grant policy requirements are not replaced by this native primitive.
