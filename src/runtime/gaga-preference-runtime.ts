const KEY = 'gaga-user-preferences';

export function saveGagaPreference(value: unknown) {
  localStorage.setItem(KEY, JSON.stringify(value));
}

export function loadGagaPreference() {
  const value = localStorage.getItem(KEY);
  return value ? JSON.parse(value) : null;
}
