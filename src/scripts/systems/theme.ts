import { storageKeys } from '../../config/systems';
import {
  defaultTheme,
  isThemeId,
  normalizeTheme,
  themeChromeColor,
  themeColorScheme,
  type ThemeId
} from '../../config/theme';
import { readJson, writeJson } from '@gaga/engine-web/runtime/storage';
import { requestToast } from '@gaga/engine-web/runtime/events';

const IDENTITY_STORAGE_KEY = 'gaga:identity:v1';

export function applyTheme(theme: ThemeId) {
  document.body.dataset.gagaTheme = theme;
  document.documentElement.dataset.gagaTheme = theme;
  document.documentElement.dataset.theme = themeColorScheme(theme);
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"][data-gaga-theme-color]')
    ?.setAttribute('content', themeChromeColor(theme));
  for (const button of document.querySelectorAll<HTMLElement>('[data-gaga-reader-pref="theme"]')) {
    const active = button.dataset.gagaReaderValue === theme;
    button.dataset.gagaActive = String(active);
    button.setAttribute('aria-pressed', String(active));
  }
}

export function setThemePreference(theme: ThemeId) {
  writeJson(storageKeys.theme, theme);
  applyTheme(theme);
}

export function applyIdentity(identity: string) {
  document.body.dataset.gagaDesignLanguage = identity;
  document.documentElement.dataset.gagaDesignLanguage = identity;
  for (const frame of document.querySelectorAll<HTMLElement>('.gaga-app-frame')) {
    frame.dataset.gagaDesignLanguage = identity;
  }
  for (const button of document.querySelectorAll<HTMLElement>('[data-gaga-reader-pref="identity"]')) {
    const active = button.dataset.gagaReaderValue === identity;
    button.dataset.gagaActive = String(active);
    button.setAttribute('aria-pressed', String(active));
  }
}

export function setIdentityPreference(identity: string) {
  try {
    localStorage.setItem(IDENTITY_STORAGE_KEY, identity);
  } catch {}
  applyIdentity(identity);
}

export function initTheme() {
  const savedTheme = readJson(storageKeys.theme, defaultTheme, isThemeId);
  applyTheme(savedTheme);

  let savedIdentity = 'blueprintism';
  try {
    const stored = localStorage.getItem(IDENTITY_STORAGE_KEY);
    if (stored) savedIdentity = stored;
  } catch {}
  applyIdentity(savedIdentity);

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;

    const themeBtn = target.closest('[data-gaga-reader-pref="theme"]') as HTMLElement | null;
    if (themeBtn) {
      const theme = normalizeTheme(themeBtn.dataset.gagaReaderValue);
      setThemePreference(theme);
      requestToast({ message: `Theme: ${theme}`, x: event.clientX, y: event.clientY, tone: 'ok', source: 'theme' });
      return;
    }

    const identityBtn = target.closest('[data-gaga-reader-pref="identity"]') as HTMLElement | null;
    if (identityBtn) {
      const identity = identityBtn.dataset.gagaReaderValue || 'blueprintism';
      setIdentityPreference(identity);
      requestToast({ message: `Identity: ${identity}`, x: event.clientX, y: event.clientY, tone: 'ok', source: 'theme' });
    }
  });
}
