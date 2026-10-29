import { createSavedReadingCapability } from '@gaga/engine-runtime/runtime/saved-reading';
import { isSavedItem, type SavedItem } from '@gaga/engine-runtime/reader';
import { requestQuickActionsSync } from '@gaga/engine-runtime/runtime/events';
import { readArray } from '@gaga/engine-runtime/runtime/storage';
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
  const capability = createSavedReadingCapability({
    storageKey: storageKeys.saved,
    buttonSelector: '[data-gaga-action="toggle-save"], [data-gaga-action="save-reading"]',
    getCurrentItem: currentItem,
    requestQuickActionsSync: detail => {
      requestQuickActionsSync(detail);
      queueMicrotask(() => capability.refresh());
    },
    getFeedback: ({ action, item }) => {
      const stored = readArray(storageKeys.saved, isSavedItem).some(entry => entry.id === item.id);
      const persisted = stored === (action === 'saved');
      return { message: persisted ? (stored ? 'Bacaan disimpan di perangkat ini.' : 'Bacaan dihapus dari daftar tersimpan.') : 'Penyimpanan tidak tersedia. Bacaan belum tersimpan.', tone: persisted ? 'ok' : 'warn', source: 'saved-reading' };
    }
  });
  window.addEventListener('storage', event => { if (event.key === storageKeys.saved || event.key === null) capability.refresh(); });
}
