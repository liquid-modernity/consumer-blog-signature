import { createInputModeCapability } from '@gaga/engine-web/runtime/input-mode';
import { requestLeftRail, requestOutline, requestReaderPanel, requestToast } from '@gaga/engine-web/runtime/events';
import { supportsGagaDock } from '../../config/systems';

let initialized = false;

export function initInputMode() {
  if (initialized) return;
  initialized = true;
  createInputModeCapability({
    getLayoutMode: () => document.documentElement.dataset.gagaLayout,
    isGestureEnabled: supportsGagaDock,
    isVerticalCloseTarget: (target) => !!target?.closest('[data-gaga-outline-peek], [data-gaga-reader-panel]'),
    onEdgeSwipe({ x, y }) {
      const rail = document.querySelector('[data-gaga-left-rail]') as HTMLElement | null;
      if (!rail || !supportsGagaDock(document.documentElement.dataset.gagaLayout)) return;
      requestLeftRail({ action: 'open', source: 'edge-swipe', x, y });
    },
    onVerticalCloseSwipe({ x, y }) {
      const reader = document.querySelector('[data-gaga-reader-panel]') as HTMLElement | null;
      let closed = false;
      if (document.querySelector<HTMLElement>('[data-gaga-outline-peek]')?.dataset.gagaState === 'open') {
        requestOutline({ action: 'close', source: 'swipe-close', x, y });
        closed = true;
      }
      if (reader?.dataset.gagaState === 'open') {
        requestReaderPanel({ action: 'close', source: 'swipe-close', x, y });
        closed = true;
      }
      if (closed) requestToast({ message: 'Panel closed', x, y, tone: 'info', source: 'swipe-close' });
    }
  });
}
