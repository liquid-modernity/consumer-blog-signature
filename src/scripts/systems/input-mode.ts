import { createInputModeCapability } from '@gaga/engine-runtime/runtime/input-mode';
import { requestLeftRail, requestReaderPanel, requestToast } from '@gaga/engine-runtime/runtime/events';
import { supportsGagaDock } from '../../config/systems';
import { reopenRetractedNotch } from './surface-coordinator';

let initialized = false;

export function initInputMode() {
  if (initialized) return;
  initialized = true;
  createInputModeCapability({
    getLayoutMode: () => document.documentElement.dataset.gagaLayout,
    isGestureEnabled: supportsGagaDock,
    isVerticalCloseTarget: (target) => !!target?.closest('[data-gaga-reader-panel] [data-gaga-notch-spine]'),
    onEdgeSwipe({ x, y }) {
      if (reopenRetractedNotch()) return;
      const rail = document.querySelector('[data-gaga-left-rail]') as HTMLElement | null;
      if (!rail || !supportsGagaDock(document.documentElement.dataset.gagaLayout)) return;
      requestLeftRail({ action: 'open', source: 'edge-swipe', x, y });
    },
    onVerticalCloseSwipe({ x, y }) {
      const reader = document.querySelector('[data-gaga-reader-panel]') as HTMLElement | null;
      let closed = false;
      if (reader?.dataset.gagaState === 'open') {
        requestReaderPanel({ action: 'close', source: 'swipe-close', x, y });
        closed = true;
      }
      if (closed) requestToast({ message: 'Panel closed', x, y, tone: 'info', source: 'swipe-close' });
    }
  });
}
