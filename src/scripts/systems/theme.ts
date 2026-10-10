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

export function initTheme() {
  const saved = readJson(storageKeys.theme, defaultTheme, isThemeId);
  applyTheme(saved);
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const button = target.closest('[data-gaga-reader-pref="theme"]') as HTMLElement | null;
    if (!button) return;
    const theme = normalizeTheme(button.dataset.gagaReaderValue);
    setThemePreference(theme);
    requestToast({ message: `Theme: ${theme}`, x: event.clientX, y: event.clientY, tone: 'ok', source: 'theme' });
  });
}
