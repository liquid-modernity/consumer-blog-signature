# GAGA 0.0.38.3

## Policy-as-Code Foundation

This iteration directly extracts the transferable quality-governance model from Rempah Ruah and adapts it to Consumer Blog Signature without importing Rempah Ruah domain logic.

### Added
- GAGA performance budget contract
- WCAG 2.2 AA accessibility policy contract
- security/privacy source policy contract
- source-level policy audit executed by the existing signature validator
- explicit transitional allowlists for current direct storage and string-HTML mutation debt
- governed iframe authority for interactive embeds
- deterministic skip-link target and focusable main-region contract

### Enforcement model
Hard failures now prevent new:
- client hydration directives
- remote stylesheet dependencies
- autoplay/preload-auto media
- `eval`, `new Function`, `document.write`
- inline event handlers and `javascript:` URLs
- browser-storage access outside the existing allowlist
- string-HTML mutation outside the existing allowlist
- iframe use outside the governed embed component
- images without `alt`

Existing technical debt is versioned rather than silently accepted. The allowlists may shrink, but new files cannot be added accidentally.

### Evidence boundary
Lighthouse/PageSpeed values, browser accessibility behavior, Core Web Vitals, and live security response headers remain explicitly unverified until measured. The policy does not manufacture quality-score claims from source inspection.
