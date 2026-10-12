# GAGA 0.0.41.0 Context-Aware Rail & Workspace Maturity

This iteration freezes ownership boundaries between the major GAGA Signature surfaces.

## Surface ownership

### Gaga Dynamic Global Navigation
Owns global destinations, search, publication information and reader settings.

### Gaga Dynamic Notch Island
Owns workspace actions, the context-inspector trigger, reading progress and transient action feedback.

### Gaga Dynamic Outline Peek
Owns article outline navigation and current-heading context.

### Left Context Rail
Owns route-local navigation and the current workspace neighborhood. On compact layouts it may project the canonical global navigation because the vertical global rail is not visible.

### Right Context Rail
Owns contextual intelligence, metadata and related discovery. It no longer owns article outline.

### Gaga Dock
Owns compact quick actions only.

## Route coverage

Both `PageFrame` and `StandaloneAppFrame` now resolve the same workspace/shell-context contract, so MDX routes, sections, tags, graphs, console, 404 and legacy standalone surfaces share the same contextual rail semantics.

## Engine extraction

Reusable contracts and pure projection boundaries are now explicitly documented under `src/gaga/extraction/`. Publication-specific labels, taxonomy and copy remain site-owned until the 0.0.41.x UI contract is stable.
