import { onRuntimeEvent } from '@gaga/engine-web/runtime/events';

let initialized = false;

export function initGagaDock() {
  if (initialized) return;
  const dock = document.querySelector<HTMLElement>('[data-gaga-dock]');
  if (!dock) return;
  initialized = true;

  const rail = document.querySelector<HTMLElement>('[data-gaga-left-rail]');
  const observer = rail ? new MutationObserver(syncAvailability) : null;

  function syncAvailability() {
    const mode = document.documentElement.dataset.gagaLayout;
    const compact = mode === 'mobile' || mode === 'tablet-mini';
    dock.hidden = !compact;
    if (!compact) return;
    dock.dataset.gagaState = rail?.dataset.gagaState === 'drawer' ? 'hidden' : 'visible';
  }

  syncAvailability();
  onRuntimeEvent('layoutChanged', syncAvailability);
  if (observer && rail) observer.observe(rail, { attributes: true, attributeFilter: ['data-gaga-state'] });

  document.addEventListener('focusin', (event) => {
    const target = event.target;
    if (target instanceof Element && target.closest('[data-gaga-dock]')) dock.dataset.gagaState = 'visible';
  });

  window.addEventListener('pagehide', () => observer?.disconnect(), { once: true });
}
