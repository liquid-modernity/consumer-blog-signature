# GAGA 0.0.41.1 Rail Interaction Polish + Responsive State Calibration

This iteration does not add publishing capabilities. It matures interaction and layout behavior around the already-frozen GAGA Signature surface ownership.

## Desktop

- smaller rail footprints
- collapsed rails are truly collapsed
- hover preview only on fine pointers
- delayed hover open/close to reduce accidental expansion
- keyboard focus previews immediately
- Escape dismisses transient hover preview
- Dynamic Notch context action toggles the right context rail on desktop

## Tablet

Tablet-large keeps both contextual rails compact.

Tablet-mini presents the right context inspector as an edge side sheet and the left context rail as a navigation drawer.

## Mobile

The right context inspector becomes a bottom sheet. The left rail remains a drawer. Both retain modal isolation and focus restoration.

## Ownership remains unchanged

- Global Navigation: global destinations
- Notch Island: context trigger and workspace actions
- Outline Peek: article outline
- Left Rail: route-local context
- Right Rail: context intelligence
- Dock: compact actions
