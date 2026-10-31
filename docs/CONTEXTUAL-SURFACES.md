# GAGA Contextual Surfaces Interaction System

Application-owned appearance family. Engine 0.4.0, Arsenal 0.2.0, Corps 0.1.0 and EmDash contracts are unchanged.

| Role / renderer | Responsibility | Existing controller |
| --- | --- | --- |
| command / Dynamic Notch Island | Commands, Search, Preferences, narration | ActionRuntime + signature-motion |
| orientation / Dynamic Outline Peek | TOC, heading, sequence, position | outline-peek + signature-motion |
| selection / GAGA Selection Menu | Highlight, Listen, Copy, Note, Quote | reader-enhancements; annotation popup is its edit variant |
| preview / GAGA Hover Preview Card | Eligible linked-content information | information-surface + public Engine port |

`contextual-surfaces.mjs` declares roles; `data-gaga-context-surface` marks each actual material. It is not a generic popover or a second interaction controller.

## One appearance projection

Existing Reader Preferences already projects admitted state onto HTML/body. `_contextual-surfaces.scss` consumes the root attributes once; every material inherits the same semantic CSS variables, including body-mounted selection menus. There are no new preference listeners, keys, controls, schemas or persistence migrations.

- Density: existing compact/comfort/wide projects 4/6/8px internal rhythm, retaining 44px targets.
- Contrast: normal/high changes the entire near-black material, off-white text, muted text, divider and focus language together.
- Theme: all four admitted canvas themes keep dark contextual material; dark/default canvases receive a restrained edge for separation.
- Archetype: existing Blueprint, Brutalism and Institutional choices project the same family radius. Notch/Outline retain edge attachment and shape semantics.
- Motion: browser reduced motion OR existing Reader reduced preference suppresses family emergence/transitions. Qualified signature scroll/geometry timings remain authoritative.
- Reading font family/scale, line height and measure remain reading-content controls. UI chrome stays small sans-serif; Preview title may use the existing editorial display face. There is no new radius or surface-theme control.

The token layer covers material/elevated control, text/muted/focus/divider, radius, spacing, control scale, restrained elevation and emergence timing/easing. Existing `--gaga-island-*` names are aliases to it. No glass, gradients, decorative borders or perpetual motion.

## Preserved behavior

No changes to eligibility, selection capture/anchoring/storage, pointer intent/child transitions/500ms transfer grace, normal touch navigation, dismissal, focus return or native pan. Annotation remains local. No new Preview actions or Share placeholders. Notch remains command, Outline remains orientation; active surfaces keep existing pinning and independent controllers.

Opening/closing stays immediate according to admitted state semantics; opacity emergence does not add dismissal delay or change collision coordinates. Selection labels collapse to existing accessible icon buttons on narrow viewports. Existing application SVG helper supplies one stroke language.

## Verification and future ownership

Computed browser appearance, contrast, focus, real actions, preference persistence/reset, viewport containment and reduced motion are tested alongside the prior release/document/personal/motion suites. Screenshots are representative fixtures, not accessibility certification. Package locks, CMS inputs and public discovery remain pinned.

This is strong first-consumer Arsenal Experience composition pressure. Core/Application coordination and Site reading context remain local; Engine ports are sufficient and Corps has no demonstrated gap. Record only: no second-consumer evidence, package extraction or new API.
