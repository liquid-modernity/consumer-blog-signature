# Repository authority — Publication & Knowledge V1

Read-only Git, package, release and registry inspection establishes one Arsenal
origin: **https://github.com/liquid-modernity/gaga-arsenal**. It does not establish
a single up-to-date canonical development branch. No branch or repository is
renamed, promoted or designated by this review.

## Arsenal source and evidence map

| Local directory | Verified Git relationship and identity | Authority / purpose |
|---|---|---|
| `gaga-arsenal` | Main checkout, origin above; local `review/blog-route-ownership` at `fe1bf45f263bd4533dd14c88d49f38ed63c33c80` | Historical dev.1 application-composition source, not latest published implementation |
| `gaga-arsenal-020-release` | Linked worktree sharing the first directory's Git store; `review/editorial-0.2.0-release-preparation` at `4e53068363fd842ee8e672c316a9ee64af8a6f8f` | Exact official 0.2.0 publication source; release snapshots/tarballs and preparation policy |
| `gaga-arsenal-editorial-contract` | Same shared Git store; `review/editorial-public-contract-v1` at `395982f3fe2e2ae27efb6bdabda3f822cef31c17` | Qualified prerelease API proof; ancestor of official 0.2.0, not competing implementation authority |
| `gaga-arsenal-registry-proof` | Same shared Git store; `review/arsenal-020-registry-proof-repair-v1` at `1946bba9b7e01cbecf3d678db8d24590aaa4f089` | Post-publication test-harness correction; descendant of 4e530683, no package implementation diff |
| `gaga-arsenal-release-010` | Separate clone of the same origin; `release/arsenal-0.1.0` at `edbd96ee781517bc7bac8cc7331f18557da09451` | Maintained historical 0.1.0 release lineage; not another product/source origin |

Observed remote default is `review/foundation-application-contract` at
`996ed1d476af528748f8d7861d941f272f5ae43b`; no `refs/heads/main` was returned.
The default branch is an ancestor of the historical dev.1 branch. The remote
`release/arsenal-0.1.0` ref remains at edbd96ee; the 0.2.0 publication source is
still an explicitly qualified review ref. Do not silently call that ref main.
A future repository-governance decision may reconcile these refs; this application
integration neither needs nor authorizes that reconciliation.

Verified ancestry:

```text
published 0.1.0 17374947 → maintained 0.1.0 edbd96ee
    → editorial candidate 395982f3 → published 0.2.0 4e530683
        → registry proof harness 1946bba9
```

For the official 0.2.0 family, immutable source/artifacts and publication/registry
receipts are authoritative: source 4e530683; publication run 40506236943;
registry proof 40518413061. Fresh anonymous registry retrieval reproduced:

- `@gaga/arsenal-contracts@0.2.0`: SHA-256 `fd39d9ac310087c3484ad5ab1ad845ac6dda21935242e6fbf41d2dc8e42e7c63`.
- `@gaga/arsenal@0.2.0`: SHA-256 `d293129c3cf2a3614ae43c6eafd4a70378ea60452b4260d9b2e9c96a9a37875f`.

Preparation documents saying “unpublished” describe their historical checkpoint;
they are not evidence contradicting the later successful immutable receipts.
Package manifests, export maps and implementation confirm that composition and
portable editorial semantics coexist in the existing `@gaga/arsenal` root.
No separate Core/Editorial/Experience/Site package is required here.

Literal `*arsenal-*` directories observed in the local packages trees are untracked
placeholders with no package manifests. The only inspected Editorial README says
**RESERVED / NOT IMPLEMENTED** and “Package boundary is not final.” Empty reserved
directories and that README establish no package implementation or canonical
source. All were preserved, including existing untracked changes.

## Publication & Knowledge source of truth

- Origin: **https://github.com/liquid-modernity/consumer-blog-signature**.
- Canonical branch: remote **main**, freshly observed at
  `c346617df851916a69167b62924bbc5b419c5c56` (tree `de1980861280fd5551ca7de0a7ed522df1cf1488`).
- Last admitted deployed source: the same c346617 commit, bound to the preserved
  production release receipt and disabled content baseline.
- Qualified Studio: `review/editorial-studio-uiux-v1`,
  `952ab4ca4b75c6236456276c2439a8276b17883d`, a verified descendant of canonical main.
  It is qualified review work, not canonical/deployed source.
- This task: `review/publication-knowledge-v1`, preserving that Studio commit's
  bytes/lineage, in a linked worktree of the existing consumer repository. The
  folder `consumer-publication-knowledge-v1` is **not a new application repository**
  or a new source of truth. It is not promoted or deployed.
- The original `consumer-blog-signature` local directory is a dirty historical
  checkout at a5281b09. Its local branch name does not override remote main.
  It is neither reset nor migrated, and its changes are preserved.

EmDash remains editorial authority. The admitted Git export is a revision-pinned
read-only projection, never a second writable CMS or a continuous-sync promise.
Applications **2, 3 and 4: UNASSIGNED**. No product identity is inferred from any
repository name. No repository is created/designated to fill these slots.

## Bounded implementation plan

1. Preserve all qualified sources, existing changes, production state and public
   package identities; diagnose harness failures before drawing product conclusions.
2. Reproduce the article Save action mismatch against the actual public Engine
   handler; bind it through the existing `buttonSelector` port only.
3. Independently test that public port, then the real article save/reload/library/
   remove journey plus existing Site/Search/discovery and public package chain.
4. Record fresh versus reused qualification and concrete UNASSIGNED suite tasks.
   No extraction, package, release, policy activation or native-focus workaround.
