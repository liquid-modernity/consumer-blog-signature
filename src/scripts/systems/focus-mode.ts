import { createFocusModeCapability } from '@gaga/engine-web/runtime/focus-mode';
import {
  requestLeftRail,
  requestQuickActionsSync,
  requestRightRail,
  type SurfaceCommandDetail
} from '@gaga/engine-web/runtime/events';
import { supportsBottomDock } from '../../config/systems';

let initialized = false;

export function initFocusMode() {
  if (initialized) return;
  initialized = true;

  const capability = createFocusModeCapability({
    getLayoutMode: () => document.documentElement.dataset.gagaLayout,
    isAvailable: (mode) => !supportsBottomDock(mode),
    onActivate: () => {
      requestLeftRail({ action: 'collapse', source: 'focus-mode' });
      requestRightRail({ action: 'collapse', source: 'focus-mode' });
    },
    onDeactivate: ({ detail, mode }) => {
      if (detail.source === 'layoutChanged' || supportsBottomDock(mode)) return;
      requestLeftRail({ action: 'restore', source: 'focus-mode' });
      requestRightRail({ action: 'restore', source: 'focus-mode' });
    },
    onActiveLayoutChange: () => {
      requestLeftRail({ action: 'collapse', source: 'focus-mode' });
      requestRightRail({ action: 'collapse', source: 'focus-mode' });
    },
    requestQuickActionsSync
  });

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-gaga-action="toggle-focus-mode"]')) return;
    capability.runCommand({ action: 'toggle', x: event.clientX, y: event.clientY, target, source: 'click' } satisfies SurfaceCommandDetail);
  });
}
