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
import { attachRailPreview } from './rail-preview';

let initialized = false;

export function initRightRailState() {
  if (initialized) return;
  const rail = document.querySelector('[data-gaga-right-rail]') as HTMLElement | null;
  if (!rail) return;
  initialized = true;

  const hasOutline = rail.dataset.gagaHasOutline === 'true';

  createRightRailCapability({
    rail,
    storageKey: hasOutline ? storageKeys.rightRail : `${storageKeys.rightRail}:empty`,
    defaultPreference: hasOutline ? 'expanded' : 'collapsed',
    getLayoutMode: () => document.documentElement.dataset.gagaLayout,
    getConfiguredState: (mode) => {
      const base = getConfiguredRightRailState(mode);
      if (!hasOutline && base === 'expanded') return 'collapsed';
      return base;
    },
    isAvailable: supportsRightRail,
    isPersistentPreferenceMode: (mode) => hasOutline && mode === 'desktop',
    beforeExpand: () => {
      if (getConfiguredLeftRailState(document.documentElement.dataset.gagaLayout) !== 'expanded') {
        requestLeftRail({ action: 'collapse', source: 'right-rail-open' });
      }
    },
    requestQuickActionsSync
  });


  attachRailPreview({
    rail,
    getLayoutMode: () => document.documentElement.dataset.gagaLayout
  });
}
