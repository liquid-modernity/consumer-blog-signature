# GAGA 0.0.39.0.1

## Astro Environment Type Closure

Fixes the final local `astro check` blocker after Catalina toolchain recovery.

### Fixed
- replaces Node-specific `process.env.PUBLIC_SITE_URL` in Astro source with Vite/Astro-native `import.meta.env.PUBLIC_SITE_URL`
- removes the need to introduce Node global typings only for public build-time environment access

### Unchanged
- Catalina esbuild cache
- Astro/Rolldown WASI runtime
- package pins
- deployment behavior
- public environment variable name
