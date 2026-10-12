# GAGA 0.0.40.1.1

## Section Locale Type Closure

Closes the TypeScript regression introduced by 0.0.40.1.

### Root cause
`contentDefaults.dateLocale` is a `ContentDateLocaleConfig`, while `toArticlePreview()` expects the resolved `Intl.LocalesArgument`.

### Fixed
- `SectionFront.astro` now resolves the configured locale through `resolveContentDateLocale()`
- `SectionIndex.astro` uses the same canonical resolver
- section-front source audit now rejects unresolved locale configuration being passed directly into article preview formatting

### Unchanged
- section routing
- editorial hierarchy
- discovery/sitemap projection
- UI structure
- content authority
