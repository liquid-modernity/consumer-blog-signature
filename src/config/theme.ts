import type { I18nMessageKey } from './i18n';

export const themeOptions = [
  { id: 'default', labelKey: 'reader.themeBlueprint', chromeColor: '#07101d', colorScheme: 'dark' },
  { id: 'dark', labelKey: 'reader.themeDark', chromeColor: '#080808', colorScheme: 'dark' },
  { id: 'paper', labelKey: 'reader.themePaper', chromeColor: '#f4f3ef', colorScheme: 'light' },
  { id: 'sepia', labelKey: 'reader.themeSepia', chromeColor: '#eeeae1', colorScheme: 'light' }
] as const satisfies readonly {
  id: string;
  labelKey: I18nMessageKey;
  chromeColor: string;
  colorScheme: 'dark' | 'light';
}[];

export type ThemeId = typeof themeOptions[number]['id'];
export type ThemeColorScheme = typeof themeOptions[number]['colorScheme'];
export const defaultTheme: ThemeId = 'default';
export const themeChromeColorMap = Object.fromEntries(
  themeOptions.map((theme) => [theme.id, theme.chromeColor])
) as Record<ThemeId, string>;
export const themeColorSchemeMap = Object.fromEntries(
  themeOptions.map((theme) => [theme.id, theme.colorScheme])
) as Record<ThemeId, ThemeColorScheme>;

export function isThemeId(value: unknown): value is ThemeId {
  return themeOptions.some((theme) => theme.id === value);
}

export function normalizeTheme(value: unknown): ThemeId {
  return isThemeId(value) ? value : 'default';
}

export function themeChromeColor(theme: ThemeId) {
  return themeChromeColorMap[theme] ?? themeChromeColorMap[defaultTheme];
}

export function themeColorScheme(theme: ThemeId) {
  return themeColorSchemeMap[theme] ?? themeColorSchemeMap[defaultTheme];
}
