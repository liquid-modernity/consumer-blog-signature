import type { I18nMessageKey } from './i18n';
import type { ThemeId } from './theme';

export const readerPreferences = {
  density: ['comfort', 'compact', 'wide'],
  fontScale: ['sm', 'md', 'lg'],
  language: ['id', 'en'],
  sfx: ['on', 'off']
} as const;

export type ReaderDensity = typeof readerPreferences.density[number];
export type ReaderFontScale = typeof readerPreferences.fontScale[number];
export type ReaderLanguage = typeof readerPreferences.language[number];
export type ReaderSfxPreference = typeof readerPreferences.sfx[number];
export type ReaderPresetId = 'everyday' | 'paper' | 'night';
export type ReaderPresetSelection = ReaderPresetId | 'custom';

export type ReaderPresetValues = {
  theme: ThemeId;
  density: ReaderDensity;
  font: ReaderFontScale;
  sfx: ReaderSfxPreference;
};

export type ReaderPreset = ReaderPresetValues & {
  id: ReaderPresetId;
  labelKey: I18nMessageKey;
};

export type ReaderState = {
  density: ReaderDensity;
  font: ReaderFontScale;
  preset?: ReaderPresetSelection;
};

export const readerPresets = [
  {
    id: 'everyday',
    labelKey: 'reader.presetEveryday',
    theme: 'default',
    density: 'comfort',
    font: 'md',
    sfx: 'on'
  },
  {
    id: 'paper',
    labelKey: 'reader.presetPaper',
    theme: 'paper',
    density: 'wide',
    font: 'md',
    sfx: 'off'
  },
  {
    id: 'night',
    labelKey: 'reader.presetNight',
    theme: 'dark',
    density: 'comfort',
    font: 'lg',
    sfx: 'off'
  }
] as const satisfies readonly ReaderPreset[];

export const defaultReaderPreset: ReaderPresetId = 'everyday';

export const defaultReaderState: ReaderState = {
  density: 'comfort',
  font: 'md',
  preset: defaultReaderPreset
};

export const defaultReaderLanguage: ReaderLanguage = 'id';
export const defaultReaderSfxPreference: ReaderSfxPreference = 'on';

export function isReaderDensity(value: unknown): value is ReaderDensity {
  return readerPreferences.density.some((item) => item === value);
}

export function isReaderFontScale(value: unknown): value is ReaderFontScale {
  return readerPreferences.fontScale.some((item) => item === value);
}

export function isReaderLanguage(value: unknown): value is ReaderLanguage {
  return readerPreferences.language.some((item) => item === value);
}

export function isReaderSfxPreference(value: unknown): value is ReaderSfxPreference {
  return readerPreferences.sfx.some((item) => item === value);
}

export function isReaderPresetId(value: unknown): value is ReaderPresetId {
  return readerPresets.some((item) => item.id === value);
}

export function isReaderPresetSelection(value: unknown): value is ReaderPresetSelection {
  return value === 'custom' || isReaderPresetId(value);
}

export function isReaderState(value: unknown): value is ReaderState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const state = value as { density?: unknown; font?: unknown; preset?: unknown };
  return isReaderDensity(state.density) &&
    isReaderFontScale(state.font) &&
    (state.preset === undefined || isReaderPresetSelection(state.preset));
}

export function readerPresetById(id: ReaderPresetId): ReaderPreset {
  return readerPresets.find((preset) => preset.id === id) ?? readerPresets[0];
}

export function matchingReaderPreset(values: ReaderPresetValues): ReaderPresetId | undefined {
  return readerPresets.find((preset) =>
    preset.theme === values.theme &&
    preset.density === values.density &&
    preset.font === values.font &&
    preset.sfx === values.sfx
  )?.id;
}
