# GAGA 0.0.41.0.1

## Right Rail Compile Closure

Closes the local `astro check` regression introduced by 0.0.41.0.

### Root causes

1. `RightInfoRail.astro` attempted to define a frontmatter function that returned Astro/JSX markup. Astro frontmatter is TypeScript and cannot be used as a JSX component factory.
2. `SearchBoxInput` was removed even though `SearchBox.astro` remains an intentionally reusable primitive.

### Fixed

- moves right-rail metadata rendering into `RightRailMeta.astro`
- keeps discovery / metadata / system ordering in ordinary Astro template markup
- restores the reusable `SearchBoxInput` type contract without restoring search ownership to the left rail
- narrows `RightRailMode` to `summary` so the right rail cannot reclaim outline ownership
- strengthens the context-aware surface audit against both regressions

### Unchanged

- Dynamic Global Navigation remains the global navigation authority
- Dynamic Notch Island remains the context inspector trigger
- Dynamic Outline Peek remains the article outline authority
- left rail remains route-local context
- right rail remains context intelligence
