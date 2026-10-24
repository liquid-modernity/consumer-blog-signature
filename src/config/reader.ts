import type { I18nMessageKey } from './i18n';
import type { ThemeId } from './theme';

export const readerPreferences = {
  density: ['comfort', 'compact', 'wide'],
  fontScale: ['sm', 'md', 'lg', 'xl'],
  fontFamily: ['sans', 'serif', 'mono'],
  lineHeight: ['normal', 'relaxed', 'loose'],
  letterSpacing: ['normal', 'wide'],
  measure: ['standard', 'comfortable', 'wide'],
  contrast: ['normal', 'high'],
  motion: ['system', 'reduced'],
  links: ['underlined', 'plain'],
  language: ['id', 'en'],
  sfx: ['on', 'off']
} as const;

export type ReaderDensity = typeof readerPreferences.density[number];
export type ReaderFontScale = typeof readerPreferences.fontScale[number];
export type ReaderFontFamily = typeof readerPreferences.fontFamily[number];
export type ReaderLineHeight = typeof readerPreferences.lineHeight[number];
export type ReaderLetterSpacing = typeof readerPreferences.letterSpacing[number];
export type ReaderMeasure = typeof readerPreferences.measure[number];
export type ReaderContrast = typeof readerPreferences.contrast[number];
export type ReaderMotion = typeof readerPreferences.motion[number];
export type ReaderLinks = typeof readerPreferences.links[number];
export type ReaderLanguage = typeof readerPreferences.language[number];
export type ReaderSfxPreference = typeof readerPreferences.sfx[number];
export type ReaderPresetId = 'everyday' | 'paper' | 'night';
export type ReaderPresetSelection = ReaderPresetId | 'custom';

export type ReaderPresetValues = {
  theme: ThemeId;
  density: ReaderDensity;
  font: ReaderFontScale;
  fontFamily?: ReaderFontFamily;
  lineHeight?: ReaderLineHeight;
  letterSpacing?: ReaderLetterSpacing;
  measure?: ReaderMeasure;
  contrast?: ReaderContrast;
  motion?: ReaderMotion;
  links?: ReaderLinks;
  sfx: ReaderSfxPreference;
};

export type ReaderPreset = ReaderPresetValues & {
  id: ReaderPresetId;
  labelKey: I18nMessageKey;
};

export type ReaderState = {
  density: ReaderDensity;
  font: ReaderFontScale;
  fontFamily?: ReaderFontFamily;
  lineHeight?: ReaderLineHeight;
  letterSpacing?: ReaderLetterSpacing;
  measure?: ReaderMeasure;
  contrast?: ReaderContrast;
  motion?: ReaderMotion;
  links?: ReaderLinks;
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

export const defaultReaderPreset: ReaderPresetId = 'paper';

export const defaultReaderState: ReaderState = {
  density: 'comfort',
  font: 'md',
  fontFamily: 'sans',
  lineHeight: 'normal',
  letterSpacing: 'normal',
  measure: 'comfortable',
  contrast: 'normal',
  motion: 'system',
  links: 'underlined',
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

export function isReaderFontFamily(value: unknown): value is ReaderFontFamily {
  return readerPreferences.fontFamily.some((item) => item === value);
}

export function isReaderLineHeight(value: unknown): value is ReaderLineHeight {
  return readerPreferences.lineHeight.some((item) => item === value);
}

export function isReaderLetterSpacing(value: unknown): value is ReaderLetterSpacing {
  return readerPreferences.letterSpacing.some((item) => item === value);
}

export function isReaderMeasure(value: unknown): value is ReaderMeasure {
  return readerPreferences.measure.some((item) => item === value);
}

export function isReaderContrast(value: unknown): value is ReaderContrast {
  return readerPreferences.contrast.some((item) => item === value);
}

export function isReaderMotion(value: unknown): value is ReaderMotion {
  return readerPreferences.motion.some((item) => item === value);
}

export function isReaderLinks(value: unknown): value is ReaderLinks {
  return readerPreferences.links.some((item) => item === value);
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
  const state = value as Record<string, unknown>;
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
