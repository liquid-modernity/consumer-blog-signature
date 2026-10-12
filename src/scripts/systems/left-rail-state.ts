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
  supportsGagaDock
} from '../../config/systems';
import { activateModalIsolation, clearModalIsolation } from './modal-isolation';
import { attachRailPreview } from './rail-preview';

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
    isCompactMode: supportsGagaDock,
    isPersistentPreferenceMode: (mode) => mode === 'desktop',
    modalIsolation: {
      activate: activateModalIsolation,
      clear: clearModalIsolation
    },
    modalOwner: 'left-drawer',
    beforeOpen: closeConflictingSurfaces,
    requestQuickActionsSync
  });


  attachRailPreview({
    rail,
    getLayoutMode: () => document.documentElement.dataset.gagaLayout
  });
}
