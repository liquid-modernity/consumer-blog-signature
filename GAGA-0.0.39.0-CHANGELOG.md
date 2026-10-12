# GAGA 0.0.39.0

## Catalina Local Toolchain Recovery

### Added
- Catalina toolchain lock
- deterministic bootstrap command
- locally compiled and cached esbuild strategy
- Astro compiler WASI runtime
- Rolldown WASI runtime
- exact local toolchain verifier
- local full-verification command
- Catalina-aware `run_local.command`

### Package policy
- Node pinned to the validated 22.13+ / <23 line
- npm 10.x
- esbuild 0.28.2 direct pin
- Rolldown 1.2.12 direct pin + override
- Vite production CSS minification explicitly uses esbuild

### Non-goals
- no UI changes
- no publishing/content changes
- no Cloudflare deployment changes
- no native binary committed to the repository
