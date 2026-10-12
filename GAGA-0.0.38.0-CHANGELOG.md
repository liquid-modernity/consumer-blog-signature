# GAGA 0.0.38.0

## Native Publishing Shell

- Promoted the recovered content composition into `src/components/gaga/`.
- Added `GagaSiteLayout.astro` as the single composition authority for native content routes.
- Changed content metadata from implicit `Astro.locals` authority to explicit route props, while retaining route context as enrichment.
- Removed the active `src/components/starlight/` namespace and the unused `toStarlightSidebar()` projection.
- Replaced active Starlight CSS layer/container/token references with GAGA-native names.
- Added validation that rejects reintroduction of Starlight dependencies and active source references.
- Preserved the existing visual system and runtime behavior; this release is an architectural extraction, not a UI redesign.

## Donor architecture note

The composition-authority pattern is informed by the supplied Rempah Ruah `SiteLayout.astro`: static-first shell composition, explicit page metadata, contextual surfaces, and progressive runtime remain separate responsibilities. Rempah Ruah business-domain logic is not imported.
