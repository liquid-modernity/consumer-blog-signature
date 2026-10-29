export interface RailPreviewOptions {
  rail: HTMLElement;
  getLayoutMode: () => string | undefined;
  openDelayMs?: number;
  closeDelayMs?: number;
}

function precisePointer() {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function attachRailPreview({
  rail,
  getLayoutMode,
  openDelayMs = 120,
  closeDelayMs = 220
}: RailPreviewOptions) {
  let restoringFocus = false;
  let openTimer: number | undefined;
  let closeTimer: number | undefined;

  const clearTimers = () => {
    window.clearTimeout(openTimer);
    window.clearTimeout(closeTimer);
  };

  const canPreview = () => (
    getLayoutMode() === 'desktop'
    && rail.dataset.gagaState === 'collapsed'
    && (rail.dataset.gagaHasContent === 'true' || rail.dataset.gagaHasOutline === 'true')
  );

  const open = (immediate = false) => {
    if (!canPreview()) return;
    clearTimers();
    const apply = () => {
      if (canPreview()) rail.dataset.gagaHoverExpanded = 'true';
    };
    if (immediate || reducedMotion()) apply();
    else openTimer = window.setTimeout(apply, openDelayMs);
  };

  const close = (immediate = false) => {
    clearTimers();
    const apply = () => {
      delete rail.dataset.gagaHoverExpanded;
    };
    if (immediate || reducedMotion()) apply();
    else closeTimer = window.setTimeout(apply, closeDelayMs);
  };

  rail.addEventListener('focusin', event => {
    if (!restoringFocus && event.target instanceof Element && event.target.matches(':focus-visible')) open(true);
  });

  rail.addEventListener('focusout', (event) => {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !rail.contains(next)) close(true);
  });

  rail.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && rail.dataset.gagaHoverExpanded === 'true') {
      event.preventDefault();
      close(true);
      restoringFocus = true;
      rail.querySelector<HTMLElement>('.gaga-rail-toggle')?.focus({ preventScroll: true });
      restoringFocus = false;
    }
  });

  return { close: () => close(true) };
}
