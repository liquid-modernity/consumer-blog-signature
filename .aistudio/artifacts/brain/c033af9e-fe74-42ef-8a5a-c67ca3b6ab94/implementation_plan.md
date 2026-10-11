# Implementation Plan: Comprehensive UI/UX Debugging & Human Behaviour Algorithms

Upgrade and harden the Consumer Blog Signature platform with algorithmic drift correction, human reading behaviour intelligence (skimming vs. deep reading heuristics, dwell-time analysis), floating selection stabilization, speech synchronization robustness, and an algorithmic self-healing real-time diagnostic overlay.

---

## 1. Problem Statement & Root Cause Analysis

From our audit and user telemetry, five core drift vectors have been identified:

1. **Scroll Progress & TOC Spy Drift**:
   - Desynchronization occurs when different routes or viewports toggle between window-level scrolling (`window`/`document.scrollingElement`) and container-level scrolling (`[data-gaga-article-scroll]`, `[data-gaga-main-region]`).
   - Sticky header offsets and variable padding cause heading activation markers to trigger either prematurely or lag behind visible content, skipping headings during accelerated scrolling.
2. **Horizontal/Vertical Layout Shift & Capability Blowout**:
   - Opening floating menus, modals, or Action Runtime sheets can trigger subtle horizontal overflow on mobile viewports (`overflow-x` blowout), breaking touch scrolling and desynchronizing coordinates.
3. **Floating Selection & Mobile Touch Drift**:
   - `range.getBoundingClientRect()` drifts during scroll momentum and mobile pinch-zoom, leaving floating toolbars detached from selected text or pushing them outside the screen boundaries.
4. **Speech Narration Utterance Synchronization Drift**:
   - Web Speech API synthesizers in Chromium and WebKit suffer from GC timeouts during long uninterrupted speech blocks, leading to state mismatches where the UI shows `playing` while audio is stalled.
5. **Human Reading Behavior Blindness**:
   - The current continuity model assumes linear progress proportional only to scroll percentage, leading to false "100% completed" marks during high-velocity skimming or fast sweeps.

---

## 2. Proposed Architecture & Solutions

```
┌────────────────────────────────────────────────────────────────────────┐
│                   GAGA HUMAN BEHAVIOUR & RUNTIME ENGINE               │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌───────────────────────────┐      ┌─────────────────────────────┐   │
│   │ Human Behaviour Heuristics│      │  Scroll & TOC Synchronizer  │   │
│   │ - Velocity (px/s & WPM)   │      │ - Universal scroll owner    │   │
│   │ - Skimming vs Deep Reading│ <──> │ - Sticky offset resolution  │   │
│   │ - Dwell-time per section  │      │ - Hysteresis thresholding   │   │
│   └───────────────────────────┘      └─────────────────────────────┘   │
│                 ▲                                   ▲                  │
│                 │                                   │                  │
│   ┌─────────────┴─────────────┐      ┌──────────────┴──────────────┐   │
│   │ Floating Selection Anchor │      │ Speech Utterance Pipeline   │   │
│   │ - Dynamic viewport clamp  │      │ - Sentence chunking         │   │
│   │ - Scroll-follow / debounce│      │ - Heartbeat keep-alive      │   │
│   │ - Zero overflow guarantee │      │ - DOM sentence tracking     │   │
│   └───────────────────────────┘      └─────────────────────────────┘   │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                 ALGORITHMIC SELF-HEALING & DIAGNOSTIC HUD              │
│  - Real-time telemetry: Velocity, WPM, Dwell, Drift Offset, Overflow  │
│  - Self-healing triggers: Re-anchor TOC, Clip Overflow, Speech Reset   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Implementation Phases

### Phase 1: Human Behaviour Velocity & Dwell-Time Algorithm
- **File**: `src/scripts/systems/reading-behaviour.ts` (new core engine module)
- **Algorithms**:
  - **Scroll Velocity Tracking**: Computes exponential moving average of scroll speed ($\Delta y / \Delta t$) in pixels/second.
  - **Cadence & Reading Rate Estimation**: Maps visible paragraph word count to viewport dwell time to calculate active Words Per Minute (WPM).
  - **Behavioral State Classifier**:
    - `SKIMMING`: Velocity $> 700\text{ px/s}$ or calculated rate $> 600\text{ WPM}$ with dwell time $< 1.5\text{s}$ per section. Progress is tracked as a skim sweep; prevents false "completed" badges.
    - `DEEP_READING`: Velocity between $30 - 320\text{ px/s}$, dwell time $> 2.5\text{s}$ per paragraph, reading rate between $140 - 320\text{ WPM}$. Qualifies for genuine reading continuity advancement.
    - `IDLE_PAUSE`: Dwell time $> 45\text{s}$ without cursor/scroll movement; pauses velocity counters.
  - **Integration with Reading Continuity**: Feeds validated reading metrics into `reading-continuity.ts` so reading history records accurate cognitive engagement.

### Phase 2: Universal Scroll & TOC Spy Drift Hardening
- **Files**: `src/scripts/systems/reading-scroll.ts`, `src/scripts/systems/toc-spy.ts`, `src/pages/article.astro`
- **Algorithmic Fixes**:
  - **Single Source of Truth for Scroll Container**: Unify `resolveReadingScrollContext()` to automatically probe `window`, `document.scrollingElement`, and `[data-gaga-article-scroll]`, returning the active scrolling container that actually has `scrollHeight > clientHeight`.
  - **Hysteresis & Lookahead Thresholding**: Prevent TOC jitter when scrolling near section boundaries by applying a directional hysteresis margin ($32\text{px}$ deadzone for upward vs downward scroll).
  - **Unified Progress Bar**: Replace the inline duplicate progress script in `article.astro` with the centralized `reading-scroll` and `reading-behaviour` stream.

### Phase 3: Selection Menu Viewport Anchor & Zero-Overflow Isolation
- **Files**: `src/scripts/systems/reader-enhancements.ts`, `src/styles/partials/_reader.scss`
- **Stabilization Fixes**:
  - **Absolute vs Fixed Coordinate Anchoring**: Compute floating menu position relative to viewport with subpixel precision; automatically flip below selection if top clearance is under $56\text{px}$.
  - **Scroll Repositioning / Auto-Dismiss**: During high-velocity scrolling, hide menu to eliminate visual lagging, and cleanly re-anchor on scroll stop.
  - **Zero Horizontal Overflow**: Apply strict viewport clamping (`Math.max(12, Math.min(window.innerWidth - menuWidth - 12, left))`) and guarantee container elements have `overflow-x: clip` so selecting text near viewport boundaries never triggers horizontal layout shifts.

### Phase 4: Smart Speech Utterance Pipeline & Active Sentence Tracking
- **File**: `src/scripts/systems/reader-enhancements.ts`
- **Stabilization Fixes**:
  - **Sentence Chunking & Keep-Alive**: Break article prose into clean sentence utterances; run a $12\text{s}$ pause/resume keep-alive heartbeat to prevent Web Speech API synthesizers from timing out mid-article.
  - **Active Sentence DOM Highlighting**: As each sentence is spoken, apply a subtle `.gaga-speech-active-sentence` mark to the corresponding DOM element so the user can follow along visually.
  - **Clean State Transitions**: Synchronize dock status between `playing`, `paused`, `completed`, and `error`, gracefully resetting if cancelled.

### Phase 5: Reader Preferences & Token Reactivity Cross-Route Audit
- **Files**: `src/scripts/systems/reader-preferences.ts`, `src/styles/partials/_reader.scss`
- **Stabilization Fixes**:
  - Ensure all 10 reader preference tokens (`--gaga-article-font-family`, `--gaga-article-font-size`, `--gaga-article-line-height`, `--gaga-article-letter-spacing`, `--gaga-article-measure`, contrast, motion, links) are applied synchronously to `:root` on initial script execution before first paint.
  - Remove redundant inline styles and prevent cascading conflicts between article pages, library, and Starlight documentation views.

### Phase 6: Algorithmic Self-Healing & Real-Time Diagnostic HUD
- **Files**: `src/scripts/systems/diagnostic-hud.ts` (new module), `src/components/frame/StandaloneAppFrame.astro`
- **Features**:
  - **Visual HUD Overlay**: Toggleable via shortcut `Ctrl+Shift+D` or discrete HUD toggle button.
  - **Real-Time Telemetry Panels**:
    - **Human Behavior**: Current Mode (`DEEP_READING` / `SKIMMING` / `IDLE`), Scroll Velocity (`px/s`), Estimated WPM, Section Dwell Time.
    - **TOC & Scroll Alignment**: Active Heading ID, Computed Offset vs Target Activation Marker, Drift Delta.
    - **Viewport & Overflow Audit**: Layout Width vs Client Width, Horizontal Overflow Alert (`0` violations).
    - **Speech Pipeline**: Synthesis status, Current Utterance Index / Total.
    - **Reader Tokens**: Active CSS Variables status table.
  - **Self-Healing Actions**:
    - "Re-anchor TOC Spy": Resets scroll bindings and recalculates heading offsets.
    - "Fix Layout Overflow": Audits DOM for elements with `offsetWidth > innerWidth` and safely isolates them.
    - "Reset Selection & Marks": Re-indexes highlight targets and purges dangling selection state.

---

## 4. Verification & Testing Plan

1. **Automated Unit & Hardening Tests**:
   - Add comprehensive tests in `tools/hardening.test.mjs` verifying:
     - Reading behavior classifier logic (`SKIMMING` vs `DEEP_READING` threshold tests).
     - Universal scroll context resolution across window and element owners.
     - Diagnostic HUD telemetry hooks and self-healing methods.
2. **Interactive Browser Verification**:
   - Rapid skimming: verify TOC doesn't flicker and reading continuity distinguishes skim sweeps.
   - Deep reading: verify dwell time increments and marks progress accurately.
   - Text selection at edge of screen: verify floating menu clamps without horizontal page scroll.
   - Audio narration: test pause, resume, sentence jumping, and completion.
   - Diagnostic HUD: verify `Ctrl+Shift+D` brings up live telemetry HUD and self-healing actions function without error.
3. **Build & Signature Validation**:
   - Run `npm test` and `node tools/validate-signature.mjs`.
   - Run `compile_applet` to guarantee production build integrity.
