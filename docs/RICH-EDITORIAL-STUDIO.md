# Rich Editorial Studio

The application’s editorial plugin composes the public EmDash 1.3.1 editor. EmDash
owns accounts, roles, ownership, revisions, saves and native publishing. Public
Arsenal 0.2.0 supplies Portable Text validation, section resolution and plain-text
projection; application widgets, HTML/KaTeX rendering and contextual URLs remain
application-owned. No new design system or package is introduced.

## Qualification and local fixtures

The authoritative qualification host is Ubuntu 24.04 with Node **22.23.4** and npm
**10.9.3**, using committed application/CMS lockfiles. Catalina is not the runtime
qualification authority. On a supported development host:

```sh
npm ci --ignore-scripts
npm ci --prefix cms --ignore-scripts
npm run editorial:prepare
npm run editorial:studio
# Another terminal, for the optional developer preview:
npm run dev -- --host 127.0.0.1
```

Studio: <http://localhost:4322/_emdash/admin>. Complete local setup normally, or
use the native development-only bootstrap at
<http://localhost:4322/_emdash/api/setup/dev-bypass?content=1&redirect=/_emdash/admin>
for disposable local testing. This does not establish production/passkey login.

The Studio uses its own SQLite database `cms/.data/editorial-studio-v1.db`, local
uploads and sessions. It never opens the older CMS on 4321 or production stores.
Preparing the seed does not reset an existing database. Browser tests must run
only in this isolated environment; they create local drafts and media. Evidence
and generated seed files stay under ignored `.gaga/editorial/` or outside Git.

## Writing

Title and Summary retain their native controls. Main Content uses the native
rich editor at the available document width, without an application utility rail.
Native document gutters, toolbar, menus, media controls and heading styles remain
native. The writing surface retains one editor instance while utilities change.

Outline, References and Readiness are optional, mutually exclusive disclosures,
closed initially. Select the active button again to close it. Escape from a
utility returns focus to its invoking button. Duplicate headings navigate by their
current document order, not by repeated text. Headings inside reusable sections
are not editable nodes in the containing document.

“Insert citation or cross-reference” reveals the existing stable-ID insertion
controls. Reference, footnote, math and figure markers retain their existing
commands and URL validation. Slash insertion, keyboard formatting, undo/redo and
rich media remain native EmDash behavior. Word counts are quiet text rather than
an announcement on every edit.

Editable application metadata stays in its original widget/onChange path under
collapsed Editorial settings. Dates remain UTC; topics/tags commit on blur. The
native inspector’s language, taxonomy, ownership/byline and SEO fields are not
assumed interchangeable with application presentation metadata. No second
save mechanism or schema migration is involved.

Managed integration/archive fields remain registered with their native constraints
and values; their repeated explanatory widgets render no writer-facing content.
The native field wrappers may still reserve spacing. Do not remove historical
Markdown, revision history or constraints to change that spacing.

## Saved draft and preview

For Posts and Authors, one contributed inspector section combines existing
saved-revision readiness with Preview saved draft and the existing guarded
publication handoff. Pages retain their saved-readiness section without gaining
content-release actions. Body readiness describes the current editor buffer;
saved readiness and preview describe the saved revision.

**Preview saved draft** uses the existing authenticated private route and exact
selected draft / expected live revision. Unsaved edits are not included. The
canonical renderer, iframe sandbox and denial/concurrency checks are unchanged.
Preview never publishes content. Access still follows native endpoint permissions.

**Developer preview** is separate: it is offered only in development on the
explicit localhost context, and sends the buffer only to the existing
`http://localhost:3000` preview. It is not a production preview or authorization
mechanism. Production builds do not expose this developer affordance. Origins,
message validation and CSP are not broadened.

Publishing remains disabled. Native lifecycle hooks and existing content-release
policy remain the authority; button appearance does not grant permission or
activate publishing. Request payloads, polling, revision pins and audit correlation
are unchanged. This UI change is not content-release activation.

## Responsive and accessibility scope

The native Settings inspector remains resizable on desktop and a native sheet
below 1024px. Application utilities stay inline; no second sidebar/modal or focus
trap is introduced. Application controls use scoped native-aligned tokens and
visible focus/expanded/disabled states; mobile controls target 44px height.

The existing native editable textbox accessible-name defect and trusted widget
read-only/editor-bridge limitations are **not fixed here**. They need a supported
native component/extension follow-up. Do not claim complete accessibility
conformance, reconstruct permissions in the client, import private components or
patch native ancestors to conceal those limits.

## Verification

The existing `.github/workflows/editorial-integration.yml` qualification is reused
on the UI review branch, without secrets or deployment steps. `integration.spec.ts`
keeps the established local save/reload/developer-renderer proof;
`quality.spec.ts` exercises the native editor, private saved preview, disclosures,
outline, responsive layouts, media and accessibility-tree observations. The older
`studio.spec.ts` remains a historical local migration/publish rehearsal, with its
changed preview selector kept compatible; it is not a production test command.

Screenshots and measured geometry are generated from deterministic local fixtures.
Record actual executed tests separately from reused evidence and unexecuted manual
screen-reader/physical-IME checks. Unchanged public contracts, Search and rendering
are checked against all eight admitted-record fixtures. Canonical promotion,
deployment and production publishing require separate decisions.
