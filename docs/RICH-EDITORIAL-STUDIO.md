# Rich Editorial Studio v1

This application-owned native EmDash plugin adds structured long-form authoring to
PAKRPP. EmDash 1.3.1 owns accounts, permissions, content, revisions and publishing.
Corps 0.1.0 admits published provider records; Arsenal 0.1.0 composes the application;
Engine 0.4.0 supplies Search. None of those packages changes here.

## Run locally

Use Node 22.22.2 in the Node 22 line, then:

```sh
npm ci --ignore-scripts
npm run cms:install
npm run editorial:prepare
npm run editorial:studio
# In another terminal:
npm run dev -- --host 127.0.0.1
```

Studio: <http://localhost:4322/_emdash/admin>. Complete local setup normally, or use
EmDash's development-only bootstrap at
<http://localhost:4322/_emdash/api/setup/dev-bypass?content=1&redirect=/_emdash/admin>
for disposable local testing. The browser proof uses this route, not a PAT or the
operator's production session. It does not prove passkey enrollment.

The Studio uses its own SQLite database `cms/.data/editorial-studio-v1.db`, uploads
`cms/.data/editorial-uploads` and local sessions. It neither opens the older local
CMS database on port 4321 nor connects to production. Keep all databases, sessions,
media state and environment files out of Git. The generated seed and reports live
under ignored `.gaga/editorial/`. Preparing the seed does not reset an existing CMS.

The local-only React SSR setting keeps `@astrojs/react` inside Vite so its virtual
renderer options resolve correctly. No installed package is patched. Restart the local Studio after changing its Astro
configuration; EmDash can retain a closed Vite runner across a config hot restart.

## Authoring

Articles expose Title, Slug, Dek/Summary, Main Content, Authors and grouped
Metadata/SEO/Media settings. Dates are UTC; language choices are Indonesian and
English. Topics and tags commit on blur. Featured/social images use the native
media picker, with explicit alternative text. Application identity and migration
bookkeeping remain managed integration metadata rather than editable JSON.

The writing canvas is the public EmDash `PortableTextEditor`, with native keyboard
formatting, undo/redo, block handles and slash insertion. Outline, References,
Readiness and Preview panels surround it. The saved-revision panel reports the
native publication state; readiness advice does not grant publication authority.

Native blocks: paragraphs, headings, emphasis, underline, inline code, links,
ordered/unordered lists, quotations, dividers, image, gallery, video, code and
tables. Application blocks: citation, reference, footnote, cross reference, callout,
figure, math, code listing with language/filename, disclosure, author note, related
reading, publication note, CTA and reusable section reference.

Use `/` for native Text/Media commands and registered Knowledge/Technical/Reusable
commands: `/citation`, `/reference`, `/footnote`, `/callout`, `/figure`, `/math`,
`/code listing`, `/disclosure`, `/author note`, `/related reading`, `/publication
note`, `/call to action`, `/reusable section`. Inline insertion links a stable ID to
a reference, footnote, equation or figure. Bibliographies contain structured title,
authors, publication/date, URL, DOI and access date. Footnotes render accessible
markers and backlinks. Citation style belongs to this application.

Published reference-library entries are copied explicitly into an article's
revision. Reusable sections resolve through an explicit published section map;
missing/cyclic references fail rendering and Search admission. Local readiness
warns about missing sections. Production section export is not enabled here.

Readiness is deterministic advice: words/read time, heading hierarchy, image/alt
text, external links, references and missing title/summary. It does not certify
factual accuracy, rights, accessibility or security. No AI service is required.

## Preview and public rendering

The iframe uses the actual PAKRPP layout and the same structured renderer as the
content loader. Only the two explicit loopback origins exchange structured data;
HTML is never accepted from messages. `/editorial-preview` renders only in Astro
development and redirects in a production build. This is local preview, not a
production draft-preview capability.

All admitted blocks have application renderers. Math uses bounded, untrusted
KaTeX MathML; code and text are escaped. Raw HTML, arbitrary iframes and executable
embeds are rejected by the native save hook. Native EmDash may still show those
upstream commands; they cannot be saved through this model. Video accepts media
URLs, not arbitrary embed scripts. No CSP exception is added.

Search extracts meaningful content after Corps published-record admission and uses
public Engine Search. Bibliographic identifiers and presentation bookkeeping do
not become body search text. Current production Markdown/export pins stay intact.

## Pages

EmDash's installed default seed already includes Pages. Our earlier application
seed declared only `posts` (Articles) and `authors`; that is why Pages was absent.
The isolated Studio declares Pages with the article editor, native drafts and
revisions. It is `routable: false`: production routes remain application-owned.
This is configuration, not an upstream feature gap or a Corps mapping defect.
No production Page schema or record is created by this work.

## Verification

```sh
npm run test:editorial
npm run test:cms
npm run test:gaga
npm test
npx tsc --noEmit -p cms/tsconfig.json
npm run verify
npm run test:editorial:ui
npm run test:ui
```

The maintained `Rich Editorial Studio` Actions workflow performs clean locked
installs, model/migration tests, official-package byte comparison, public import
boundaries, strict typing, application build/Search/Starlight proof, real local CMS
browser persistence, native workerd startup, audits and workflow lint. It has no
provider secrets or deployment job. Screenshots/reports exclude database/session
files. Synthetic local Dev Admin and test records are disposable test identities.

[Production migration proposal](RICH-EDITORIAL-MIGRATION.md) is a separate approval
boundary. No production content, CMS Worker, publication Worker or canonical main
is changed during Studio implementation.
