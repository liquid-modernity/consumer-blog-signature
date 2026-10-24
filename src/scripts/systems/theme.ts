import { storageKeys } from '../../config/systems';
import {
  defaultTheme,
  isThemeId,
  normalizeTheme,
  themeChromeColor,
  themeColorScheme,
  type ThemeId
} from '../../config/theme';
import { readJson, writeJson } from '@gaga/engine-runtime/runtime/storage';
import { requestToast } from '@gaga/engine-runtime/runtime/events';

const IDENTITY_STORAGE_KEY = 'gaga:identity:v1';
const DESIGN_LANGUAGE_KEY = 'gaga:design-language:v1';

const VALID_IDENTITIES = new Set([
  'editorial',
  'brutalism',
  'blueprintism',
  'enterprise',
  'minimal',
  'futuristic'
]);

export const defaultIdentity = 'editorial';

export function isIdentityId(value: unknown): value is string {
  return typeof value === 'string' && VALID_IDENTITIES.has(value);
}

export function normalizeIdentity(value: unknown): string {
  return isIdentityId(value) ? value : defaultIdentity;
}

export function readThemePreference(): ThemeId {
  return readJson(storageKeys.theme, defaultTheme, isThemeId);
}

export function readIdentityPreference(): string {
  try {
    const fromDesignLang = readJson<string>(DESIGN_LANGUAGE_KEY, '', isIdentityId);
    if (isIdentityId(fromDesignLang)) return fromDesignLang;
    const raw = localStorage.getItem(IDENTITY_STORAGE_KEY);
    if (raw) {
      const cleaned = raw.replace(/^"|"$/g, '');
      if (isIdentityId(cleaned)) return cleaned;
    }
  } catch {}
  return defaultIdentity;
}

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
  const normalized = normalizeIdentity(identity);
  document.body.dataset.gagaDesignLanguage = normalized;
  document.documentElement.dataset.gagaDesignLanguage = normalized;
  document.body.dataset.gagaIdentity = normalized;
  document.documentElement.dataset.gagaIdentity = normalized;
  for (const frame of document.querySelectorAll<HTMLElement>('.gaga-app-frame, [data-gaga-app-frame]')) {
    frame.dataset.gagaDesignLanguage = normalized;
  }
  for (const button of document.querySelectorAll<HTMLElement>('[data-gaga-reader-pref="identity"]')) {
    const active = button.dataset.gagaReaderValue === normalized;
    button.dataset.gagaActive = String(active);
    button.setAttribute('aria-pressed', String(active));
  }
}

export function setIdentityPreference(identity: string) {
  const normalized = normalizeIdentity(identity);
  try {
    localStorage.setItem(IDENTITY_STORAGE_KEY, normalized);
    writeJson(DESIGN_LANGUAGE_KEY, normalized);
  } catch {}
  applyIdentity(normalized);
}

const themeLabels: Record<ThemeId, string> = {
  default: 'Blueprint',
  dark: 'Gelap',
  paper: 'Kertas',
  sepia: 'Sepia'
};

const identityLabels: Record<string, string> = {
  editorial: 'Minimalism (Editorial)',
  brutalism: 'Brutalism (Struktural)',
  blueprintism: 'Blueprint (Teknis)',
  enterprise: 'Institusional',
  minimal: 'Minimal',
  futuristic: 'Futuristik'
};

let themeListenerWired = false;

export function initTheme() {
  const savedTheme = readThemePreference();
  applyTheme(savedTheme);

  const savedIdentity = readIdentityPreference();
  applyIdentity(savedIdentity);

  if (themeListenerWired) return;
  themeListenerWired = true;

  document.addEventListener('click', (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target) return;

    const themeBtn = target.closest<HTMLElement>('[data-gaga-reader-pref="theme"]');
    if (themeBtn) {
      const theme = normalizeTheme(themeBtn.dataset.gagaReaderValue);
      setThemePreference(theme);
      requestToast({
        message: `Tema: ${themeLabels[theme] ?? theme}`,
        x: event.clientX,
        y: event.clientY,
        tone: 'ok',
        source: 'theme'
      });
      return;
    }

    const identityBtn = target.closest<HTMLElement>('[data-gaga-reader-pref="identity"]');
    if (identityBtn) {
      const identity = normalizeIdentity(identityBtn.dataset.gagaReaderValue);
      setIdentityPreference(identity);
      requestToast({
        message: `Arketipe: ${identityLabels[identity] ?? identity}`,
        x: event.clientX,
        y: event.clientY,
        tone: 'ok',
        source: 'theme'
      });
    }
  });
}

