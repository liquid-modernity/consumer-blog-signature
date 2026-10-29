# Contextual UX V1.1

This is application composition over the exact published Engine 0.4.0, Corps 0.1.0
and Arsenal 0.2.0 packages. EmDash account/editor/publication semantics are unchanged.
The operator approved showing the available unique publications (up to 20), and
keeping presentation configuration in the application. Arsenal 0.2.0 has no public
Notch configuration contract; no fields have been added to gaga.app/v1.

The Notch uses one Back / site identity / disclosure bar. Rest is level 0; actions
are level 1; reader and navigation controls are level 2. Back and normal links keep
their own behavior. Hover and long press can reveal actions; the explicit button
works with keyboard and touch. Escape closes the current nested level and returns
focus. Preferences use the existing public Engine panel, isolation and persistence
contracts inside the Notch, with no separate preference store. Temporary disclosure
state is not persisted. The canonical navigation projection is reused, not copied.

`experienceConfig.notch` selects placement and shape through the small application
preset validator in `contextual-ux.mjs`. Desktop defaults to top/notch; mobile to
top/island. Top supports notch/island/pill; bottom and sides support island/pill.
Side placements fall back to top/island below 1280px. Unknown values, arbitrary
style fields and bottom/side notch combinations are rejected. Motion respects the
OS preference. Runtime mechanics are separate from these presentation selections.

Save uses only Engine createSavedReadingCapability and `storageKeys.saved`
(`gaga:saved:v1`). Notch clicks reach that listener once. The root and Library read
the same validated store; denied storage produces feedback and refreshes projected
state. There is no alternate root store or content synchronization mechanism.

Only links marked data-gaga-preview are eligible for previews. The public Engine
information-surface document port projects into a dedicated tooltip container;
it cannot write the active page's metadata. Position derives from the trigger,
flips above when needed and clamps to the viewport. The card and trigger share
hover continuity; focus, Escape and aria-describedby are supported. Touch retains
normal link navigation, with no interception or first-tap requirement.

Rails are opt-in by route and actual content: eligible topic/section/knowledge/
tag/author navigation renders real groups; topic and section detail discovery
may render the right rail. Root, article, Search, Saved and archive have no empty
rail reservations. Article previous/next uses the existing chronological canonical
publication ordering and stays inside the reading column.

Reader metadata uses the current article's published projection. Explicit existing
metadata.type is preferred when it is in the application publication vocabulary;
legacy application type inference remains the fallback where no type exists.
The same type/topic mapping supplies index and page context. Dates, author/bylines,
summary, reading time, section/topics/tags retain their established projection.
The compact table omits combined duplicate rows; object IDs and graph relations
are in explicit knowledge details. There is no new editorial schema. A separate
category is not invented; media/resource actions remain with existing rendered
content. No PDF export is shown without an implementation. Copy Link and Share
use the active page's emitted canonical URL, never hovered content.

Outline Peek exists only for a real article outline or the root document's actual
sections; the synthetic _top fallback is excluded. The resting handle shows the
current section and reading progress, using the existing scroll/TOC authority.
The Notch retains accessible progress without a second visible percentage.

The review qualification uses Ubuntu 24.04, Node 22.23.4/npm 10.9.3, committed
locks, exact baseline artifact identity, local fixture/browser state only, native
workerd Search and five-width light/dark captures. This is not a claim of physical
iOS/Safari or full assistive-technology/accessibility certification.

Production admission is separate: the historical preservation inventory/controller
is unchanged and rejects these reviewed UI changes. Its regression fixtures use
the historical canonical bytes. Any later promotion/release requires explicit
review and exact-source admission of the new approved presentation. This task
neither promotes nor deploys nor changes content-release policy or switches.

The pinned Engine date input is date/pubDate and updatedDate/updated. The CMS
projection now supplies those aliases from existing published editorial dates.
Search consequently gains the missing dates and chronological ordering. Hosted
comparison against the exact sealed baseline rejects every non-date field change,
checks dates against the admitted records, and preserves historical/new hashes.
