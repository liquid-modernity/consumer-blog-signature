# GAGA 0.0.39.1 Local Developer Experience

This iteration turns the recovered Catalina toolchain into a daily-use workflow.

## Daily commands

- `./run_local.command`: start the local development server without reinstalling packages
- `./verify_local.command`: run exact toolchain verification plus the full GAGA validation/check/build closure
- `./preview_local.command`: preview the already-built production artifact

## Behavior

- browser opens only after HTTP readiness is confirmed
- local logs live under `.compat/`
- the runner never performs `npm install`
- repeated WASI ExperimentalWarning noise is selectively suppressed
- other Node warnings remain visible

## Discovery hygiene

`src/pages/llms.txt.ts` is the sole `llms.txt` authority. The legacy static `public/llms.txt` must be removed to avoid Astro route shadowing.
