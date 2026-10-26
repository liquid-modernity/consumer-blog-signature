# EmDash-native editorial authorization v1

Status: **BLOCKED on a pinned public account-status contract.** The runtime/contract
qualification is a proof of this boundary, not qualification of writer publishing.
No production source promotion, deployment, policy acceptance or activation is part
of this change. The current draft and both disabled switches remain untouched.

## Native contracts first

The source is canonical main `5b593c3ee0b42645941c648c0e2f01fb3028b8d3`, with
EmDash **1.3.1** and Garrison **ed93b5b9611ce97f33d138e945bdd7bb563750c2**.
The application owns the editorial plugin. EmDash owns accounts, ownership and
revision transitions. Garrison owns qualified release admission and deployment.

These are separate checks:

| Layer | Meaning |
| --- | --- |
| Native account role | Subscriber reads; Contributor writes drafts; Author publishes owned entries; Editor manages any entry; Admin manages accounts/roles |
| Plugin capabilities | What the plugin can call, such as `users:read`, `content:publish` and publication policy hooks; never an editor's permission |
| Private-route RBAC and CSRF | Who may invoke a handler; trusted `ctx.user` comes from native authentication, never a body field |
| Publication policy hooks | Native before-publish/unpublish veto; does not grant publication or bypass native concurrency |
| Application content consent | Exact actor, resource, revision, expected live pin, expiry and one-use pending intent |
| Standing policy | What the release service may execute under source/profile/target/provider binding; collections are not users |
| Release/provider authority | Qualification, exact artifact, production-state admission and public readback |

Native `canActOnOwn` checks account identity against the item's top-level
`authorId`. Author-profile/byline records confer no authorization. Initial writer
scope is own entries only; assignment-based publishing is excluded. Admins retain
native account/role management. Editors retain native cross-author content rights.

## Gap and decision

Native Admin role assignment can grant/revoke Author rights. It cannot delegate
publish-only grant management to non-Admin Editors, or revoke only publication
without changing the other permissions attached to an account's native role.
That would justify a narrow, default-deny plugin grant for already native-eligible
Authors, with Admin-designated managers, protected CAS storage and actor audit.
It would never replace native RBAC, grant manager status, or authorize structural
changes. Ordinary article standing policy should be `collections: ["posts"]`;
author-profile publication is not required for account authorization.

**Do not implement that grant yet.** It cannot close the prior prerequisite:

- Public `UserInfo` / `ctx.users.get` exposes `id`, `email`, `name`, `role` and
  `createdAt`, but no `disabled` or equivalent current active-account decision.
- The 1.3.1 implementation returns the same directory value after disabling an
  account. It is a directory lookup, not a current authorization decision.
- Private native routes correctly reject disabled accounts, but public service
  routes bind no authenticated caller. The existing delayed `content-apply` route
  cannot borrow the original session's authorization from a signed intent.
- A signature, saved role, grant, short expiry or successful user lookup cannot
  prove the original actor is currently active. Unknown status must deny apply.
- Root public repositories/auth adapters require database access not supplied by
  the documented plugin context. Adding a provider/DB bridge, private imports,
  broad token or changed authentication model to work around this is not admitted.

Cloudflare Access role mapping is an alternative native authentication model, not
a fix for the missing delayed plugin account-status decision. It is not enabled
or changed here.

Required supported contract: an authenticated native host decision or public
plugin API that authoritatively revalidates the original account's current active
status and native permissions at apply time, rejecting missing/deleted/disabled
accounts. Its consistency with role/ownership revocation must also be qualified.
Do not infer such a contract from optional undocumented properties or cache it as
an application-owned account authority.

Once this prerequisite is supported, extend only the current plugin: own/any
resource checks at selection and apply, bounded publish-only manager grants where
necessary, grant-version revocation, and private audit correlation from actual
account through opaque dispatch actor to native transition and release receipt.
The current pending intent already preserves that private actor mapping; it does
not itself reauthorize delayed execution. Native publish/unpublish, hooks, locks,
`_rev`, exact pins, trusted host and Universal Release Controller remain unchanged.

## Qualification and limits

Use the existing `editorial-studio.yml`, operation `authorization-check`, on Ubuntu
24.04 with exact Node **22.23.4**, npm **10.x**, both committed npm lockfiles and
no production credentials. `qualification-environment.json` records actual
Node/npm, runner image and both workerd versions. All jobs in this affected
workflow now use the same exact Node pin. No dependency versions or lockfiles change.

The isolated `cms/authorization-proof` fixture exercises actual EmDash middleware,
private-route CSRF/RBAC, own/any helpers, account-role re-resolution, native
before-publish/unpublish veto, and the public directory's disabled-status omission.
Only temporary synthetic data changes. Fixture state and sessions are outside the
uploaded evidence; the fixture is not imported by production CMS configuration.
Existing signed-consent, concurrency, replay, expiry and public-boundary regressions
run on the new runtime. Official EmDash bytes, CMS typing/build and native workerd
startup are checked without upload. No historical browser/full certification runs.

Grant/delegation, complete delayed-apply reauthorization and a new actor-audit flow
are **not implemented or qualified**. No green contract-proof job may be interpreted
as `EDITORIAL AUTHORIZATION V1: QUALIFIED` or as authority to enable either switch.

Next step: establish the supported pinned native account-status contract under an
explicitly authorized upstream/public-contract change, then resume the bounded
plugin implementation and requested positive/negative authorization tests. Do not
promote or deploy this review branch as an activation-ready implementation.

## Official references checked against pinned packages

- [Getting started / Node minimum](https://docs.emdashcms.com/getting-started/)
- [Authentication / roles and Access alternative](https://docs.emdashcms.com/guides/authentication/)
- [Admin account and content permissions](https://docs.emdashcms.com/concepts/admin-panel/)
- [Private/public routes and caller identity](https://docs.emdashcms.com/plugins/creating-plugins/api-routes/)
- [Plugin capabilities](https://docs.emdashcms.com/plugins/creating-plugins/capabilities/)
- [Publication lifecycle hooks](https://docs.emdashcms.com/plugins/creating-plugins/hooks/)
- [Protected storage and CAS limits](https://docs.emdashcms.com/plugins/creating-plugins/storage/)
- [Content lifecycle and concurrency](https://docs.emdashcms.com/reference/content-lifecycle/)
