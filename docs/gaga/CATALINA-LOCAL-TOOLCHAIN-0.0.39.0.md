# Catalina Local Toolchain Recovery

GAGA 0.0.39.0 adapts the proven Rempah Ruah Catalina compatibility strategy to Consumer Blog Signature.

## Target
- macOS Catalina 10.15.x
- Intel x64
- Node 22.19.0 validated baseline
- npm 10.9.3
- Astro 7.2.9

## Compatibility strategy
1. install canonical dependencies with native install scripts disabled
2. compile exact esbuild 0.28.2 from source using Go 1.22.x once
3. cache the Catalina-compatible esbuild binary
4. materialize Astro and Rolldown WASI bindings with isolated nested runtimes
5. export `ESBUILD_BINARY_PATH` and `NAPI_RS_FORCE_WASI=1`
6. verify the exact toolchain
7. run the normal GAGA verify/check/build closure

## Daily flow
After the one-time bootstrap:
- `./run_local.command` starts local Astro without reinstalling
- `./verify_local.command` runs toolchain verification plus the normal project verify gate

## Important
The first bootstrap needs network access and Go 1.22.x. `.compat/` is generated local state and must not be committed.
