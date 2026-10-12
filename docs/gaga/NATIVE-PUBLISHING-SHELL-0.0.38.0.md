# GAGA Native Publishing Shell 0.0.38.0

`GagaSiteLayout.astro` is the native composition boundary for content routes.

## Contract

1. Content entries are authoritative for title, content kind, language, canonical identity, and other publishing metadata.
2. Route context enriches the page with route identity, generated head entries, and TOC data, but it is not the sole metadata authority.
3. The shell composes navigation, content panels, reading surfaces, contextual information, dock/runtime controls, and SEO from one layout boundary.
4. Client behavior remains progressive and capability-gated through the existing GAGA runtime.
5. Starlight is no longer an active dependency, component namespace, CSS layer, or source-level contract.

## Compatibility

The release intentionally preserves existing GAGA frame components, route behavior, content schema, action registry, runtime systems, and visual design. UI/UX calibration follows after the native composition boundary is proven stable.
