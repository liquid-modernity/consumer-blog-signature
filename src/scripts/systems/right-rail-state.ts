import { createRightRailCapability } from '@gaga/engine-web/runtime/right-rail';
import {
  requestLeftRail,
  requestQuickActionsSync
} from '@gaga/engine-web/runtime/events';
import {
  defaultRailPreference,
  getConfiguredLeftRailState,
  getConfiguredRightRailState,
  storageKeys,
  supportsRightRail
} from '../../config/systems';

let initialized = false;

export function initRightRailState() {
  if (initialized) return;
  const rail = document.querySelector('[data-gaga-right-rail]') as HTMLElement | null;
  if (!rail) return;
  initialized = true;

  createRightRailCapability({
    rail,
    storageKey: storageKeys.rightRail,
    defaultPreference: defaultRailPreference,
    getLayoutMode: () => document.documentElement.dataset.gagaLayout,
    getConfiguredState: getConfiguredRightRailState,
    isAvailable: supportsRightRail,
    isPersistentPreferenceMode: (mode) => mode === 'desktop',
    beforeExpand: () => {
      if (getConfiguredLeftRailState(document.documentElement.dataset.gagaLayout) !== 'expanded') {
        requestLeftRail({ action: 'collapse', source: 'right-rail-open' });
      }
    },
    requestQuickActionsSync
  });
}
