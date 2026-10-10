import { createSavedReadingCapability } from '@gaga/engine-web/runtime/saved-reading';
import { type SavedItem } from '@gaga/engine-web/reader';
import { requestQuickActionsSync } from '@gaga/engine-web/runtime/events';
import { storageKeys } from '../../config/systems';

function currentItem(): SavedItem | null {
  const frame = document.querySelector('[data-gaga-app-frame]') as HTMLElement | null;
  if (!frame) return null;
  return {
    id: frame.dataset.gagaPageId ?? location.pathname,
    title: frame.dataset.gagaPageTitle ?? document.title,
    href: location.pathname,
    savedAt: new Date().toISOString()
  };
}

export function initSavedReading() {
  createSavedReadingCapability({
    storageKey: storageKeys.saved,
    getCurrentItem: currentItem,
    requestQuickActionsSync
  });
}
