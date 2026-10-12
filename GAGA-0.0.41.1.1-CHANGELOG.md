# GAGA 0.0.41.1.1

## Right Rail Command Type Closure

Closes the single TypeScript error introduced by 0.0.41.1.

### Root cause
`requestRightRail()` consumes the engine `SurfaceCommand` contract. `expand` is not a valid command value, while `open` is.

### Fixed
- maps collapsed desktop right rail to `open`
- keeps expanded desktop right rail mapped to `collapse`
- strengthens the rail interaction audit so unsupported `expand` cannot re-enter the command path

### Unchanged
- calibrated rail geometry
- hover/focus preview behavior
- tablet/mobile sheet behavior
- Dynamic Notch ownership
- rail persistence and responsive composition
