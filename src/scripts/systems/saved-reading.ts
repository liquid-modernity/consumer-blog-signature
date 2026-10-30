import { createSavedReadingCapability } from '@gaga/engine-runtime/runtime/saved-reading';
import { requestQuickActionsSync } from '@gaga/engine-runtime/runtime/events';
import { currentPersonalContent } from './personal-context';
import { personalState } from '../../lib/personal-state';
import { storageKeys } from '../../config/systems';

function currentItem() {
 const current=currentPersonalContent();if(!current||current.content.contentType!=='article')return null;
 const c=current.content,now=new Date().toISOString();
 return {...c,id:c.contentIdentity,title:c.title,href:location.pathname,savedAt:now,createdAt:now,updatedAt:now};
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
      const stored = personalState.saved().some(entry => entry.id === item.id);
      const persisted = stored === (action === 'saved');
      return { message: persisted ? (stored ? 'Bacaan disimpan di perangkat ini.' : 'Bacaan dihapus dari daftar tersimpan.') : 'Penyimpanan tidak tersedia. Bacaan belum tersimpan.', tone: persisted ? 'ok' : 'warn', source: 'saved-reading' };
    }
  });
  window.addEventListener('storage', event => { if (event.key === storageKeys.saved || event.key === null) capability.refresh(); });
}
