# GAGA 0.0.39.1

## Local Developer Experience Hardening

### Added
- shared local environment/bootstrap reader
- readiness-probed local dev startup
- production preview command
- `.compat` dev/preview logs
- selective WASI ExperimentalWarning suppression
- local DX policy-as-code and source audit

### Fixed
- removes the legacy `public/llms.txt` authority conflict through the apply procedure
- daily local runners no longer reinstall dependencies

### Preserved
- exact Catalina compatibility toolchain from 0.0.39.0
- full local `astro check` and `astro build`
- GitHub/Cloudflare workflows
