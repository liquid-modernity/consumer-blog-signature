import { createLeftRailCapability } from '@gaga/engine-web/runtime/left-rail';
import {
  requestOutline,
  requestQuickActionsSync,
  requestReaderPanel,
  requestRightRail
} from '@gaga/engine-web/runtime/events';
import {
  defaultRailPreference,
  getConfiguredLeftRailState,
  storageKeys,
  supportsBottomDock
} from '../../config/systems';
import { activateModalIsolation, clearModalIsolation } from './modal-isolation';

let initialized = false;

function closeConflictingSurfaces() {
  requestRightRail({ action: 'close', source: 'left-rail-open' });
  requestOutline({ action: 'close', source: 'left-rail-open' });
  requestReaderPanel({ action: 'close', source: 'left-rail-open' });
}

export function initLeftRailState() {
  if (initialized) return;
  const rail = document.querySelector('[data-gaga-left-rail]') as HTMLElement | null;
  if (!rail) return;
  initialized = true;

  createLeftRailCapability({
    rail,
    storageKey: storageKeys.leftRail,
    defaultPreference: defaultRailPreference,
    getLayoutMode: () => document.documentElement.dataset.gagaLayout,
    getConfiguredState: getConfiguredLeftRailState,
    isCompactMode: supportsBottomDock,
    isPersistentPreferenceMode: (mode) => mode === 'desktop',
    modalIsolation: {
      activate: activateModalIsolation,
      clear: clearModalIsolation
    },
    modalOwner: 'left-drawer',
    beforeOpen: closeConflictingSurfaces,
    requestQuickActionsSync
  });

  // Hover expansion when collapsed on desktop
  let hoverTimeout: number | undefined;
  rail.addEventListener('mouseenter', () => {
    if (document.documentElement.dataset.gagaLayout === 'desktop' && rail.dataset.gagaState === 'collapsed') {
      window.clearTimeout(hoverTimeout);
      rail.dataset.gagaHoverExpanded = 'true';
    }
  });

  rail.addEventListener('mouseleave', () => {
    if (rail.dataset.gagaHoverExpanded) {
      hoverTimeout = window.setTimeout(() => {
        delete rail.dataset.gagaHoverExpanded;
      }, 160);
    }
  });

  // Focus within expansion for keyboard accessibility
  rail.addEventListener('focusin', () => {
    if (document.documentElement.dataset.gagaLayout === 'desktop' && rail.dataset.gagaState === 'collapsed') {
      rail.dataset.gagaHoverExpanded = 'true';
    }
  });

  rail.addEventListener('focusout', (e) => {
    if (!rail.contains(e.relatedTarget as Node)) {
      delete rail.dataset.gagaHoverExpanded;
    }
  });
}
