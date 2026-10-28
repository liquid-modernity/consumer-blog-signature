import { createSavedReadingCapability } from '@gaga/engine-runtime/runtime/saved-reading';

// Independent consumer fixture: public selector/storage ports, no application modules.
const data = new Map<string, string>();
const storage = {
  getItem: (key: string) => data.get(key) ?? null,
  setItem: (key: string, value: string) => { data.set(key, value); },
  removeItem: (key: string) => { data.delete(key); },
};
const output = document.querySelector<HTMLOutputElement>('[data-field-state]')!;
const capability = createSavedReadingCapability({
  document, storage, storageKey: 'field:bookmarks:v1', buttonSelector: '[data-field-save]',
  getCurrentItem: () => ({ id: 'field:moss', href: '/manuals/moss', title: 'Moss Atlas', savedAt: '2026-10-01T00:00:00.000Z' }),
  requestQuickActionsSync: () => { output.value = storage.getItem('field:bookmarks:v1') ?? '[]'; },
});
document.querySelector('[data-field-cleanup]')!.addEventListener('click', () => capability.cleanup());
