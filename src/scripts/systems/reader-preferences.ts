import { createReaderPreferencesCapability } from '@gaga/engine-web/runtime/reader-preferences';
import {
  requestLeftRail,
  requestOutline,
  requestQuickActionsSync
} from '@gaga/engine-web/runtime/events';
import { readJson, writeJson } from '@gaga/engine-web/runtime/storage';
import {
  defaultReaderSfxPreference,
  defaultReaderState,
  isReaderDensity,
  isReaderFontScale,
  isReaderPresetId,
  isReaderSfxPreference,
  defaultReaderLanguage,
  matchingReaderPreset,
  type ReaderPresetId,
  type ReaderPresetSelection,
  type ReaderPresetValues,
  type ReaderState
} from '../../config/reader';
import { localizedPairText } from '../../config/i18n';
import { getConfiguredLeftRailState, storageKeys } from '../../config/systems';
import { defaultTheme, isThemeId, normalizeTheme, type ThemeId } from '../../config/theme';
import { activateModalIsolation, clearModalIsolation } from './modal-isolation';
import { setThemePreference } from './theme';

let initialized = false;

function isReaderPresetValues(value: ReaderPresetValues): boolean {
  return isThemeId(value.theme) &&
    isReaderDensity(value.density) &&
    isReaderFontScale(value.font) &&
    isReaderSfxPreference(value.sfx);
}

function readReaderState(): ReaderState {
  return readJson(storageKeys.reader, defaultReaderState, (value): value is ReaderState => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const state = value as { density?: unknown; font?: unknown; preset?: unknown };
    return isReaderDensity(state.density) &&
      isReaderFontScale(state.font) &&
      (state.preset === undefined || state.preset === 'custom' || isReaderPresetId(state.preset));
  });
}

function readThemeState(): ThemeId {
  return normalizeTheme(document.body.dataset.gagaTheme ?? readJson(storageKeys.theme, defaultTheme, isThemeId));
}

function readSfxState() {
  const current = document.body.dataset.gagaSfx;
  if (isReaderSfxPreference(current)) return current;
  return readJson(storageKeys.sfx, defaultReaderSfxPreference, isReaderSfxPreference);
}

function currentPresetValues(): ReaderPresetValues {
  const readerState = readReaderState();
  return {
    theme: readThemeState(),
    density: isReaderDensity(document.body.dataset.gagaReaderDensity) ? document.body.dataset.gagaReaderDensity : readerState.density,
    font: isReaderFontScale(document.body.dataset.gagaReaderFont) ? document.body.dataset.gagaReaderFont : readerState.font,
    sfx: readSfxState()
  };
}

function valuesFromControl(control: HTMLElement): ReaderPresetValues | undefined {
  const values = {
    theme: normalizeTheme(control.dataset.gagaReaderTheme),
    density: control.dataset.gagaReaderDensity,
    font: control.dataset.gagaReaderFont,
    sfx: control.dataset.gagaReaderSfx
  };
  return isReaderPresetValues(values as ReaderPresetValues) ? values as ReaderPresetValues : undefined;
}

function projectSfxPreference(value: ReaderPresetValues['sfx']) {
  document.body.dataset.gagaSfx = value;
  for (const button of document.querySelectorAll<HTMLElement>('[data-gaga-reader-pref="sfx"]')) {
    const active = button.dataset.gagaReaderValue === value;
    button.dataset.gagaActive = String(active);
    button.setAttribute('aria-pressed', String(active));
  }
}

function setSfxPreference(value: ReaderPresetValues['sfx']) {
  writeJson(storageKeys.sfx, value);
  projectSfxPreference(value);
}

function projectStatus(status: HTMLElement, id: string, en: string) {
  status.dataset.gagaI18nId = id;
  status.dataset.gagaI18nEn = en;
  status.textContent = localizedPairText({ id, en }, document.body.dataset.gagaLanguage, defaultReaderLanguage);
}

function projectPresetSelection(selection: ReaderPresetSelection) {
  document.body.dataset.gagaReaderPreset = selection;
  const status = document.querySelector<HTMLElement>('[data-gaga-reader-preset-status]');
  const customId = status?.dataset.gagaReaderCustomId ?? 'Custom';
  const customEn = status?.dataset.gagaReaderCustomEn ?? customId;
  for (const button of document.querySelectorAll<HTMLElement>('button[data-gaga-reader-preset]')) {
    if (button.hasAttribute('data-gaga-reader-reset')) continue;
    const active = button.dataset.gagaReaderPreset === selection;
    button.dataset.gagaActive = String(active);
    button.setAttribute('aria-pressed', String(active));
    if (active && status) {
      const id = button.dataset.gagaI18nId ?? button.textContent?.trim() ?? customId;
      const en = button.dataset.gagaI18nEn ?? id;
      projectStatus(status, id, en);
    }
  }
  if (selection === 'custom' && status) projectStatus(status, customId, customEn);
}

function syncPresetSelection() {
  const selection = matchingReaderPreset(currentPresetValues()) ?? 'custom';
  writeJson(storageKeys.reader, { ...readReaderState(), preset: selection });
  projectPresetSelection(selection);
}

export function initReaderPreferences() {
  if (initialized) return;
  initialized = true;
  const panel = document.querySelector('[data-gaga-reader-panel]') as HTMLElement | null;

  const reader = createReaderPreferencesCapability({
    panel,
    storageKey: storageKeys.reader,
    defaultState: defaultReaderState,
    isDensity: isReaderDensity,
    isFont: isReaderFontScale,
    modalIsolation: {
      activate: activateModalIsolation,
      clear: clearModalIsolation
    },
    modalOwner: 'reader-panel',
    beforeOpen: () => {
      requestOutline({ action: 'close', source: 'reader-open' });
      if (getConfiguredLeftRailState(document.documentElement.dataset.gagaLayout) !== 'expanded') {
        requestLeftRail({ action: 'collapse', source: 'reader-open' });
      }
    },
    requestQuickActionsSync
  });

  const applyPreset = (preset: ReaderPresetId, values: ReaderPresetValues, event: MouseEvent, reset = false) => {
    const readerState: ReaderState = {
      density: values.density,
      font: values.font,
      preset
    };
    writeJson(storageKeys.reader, readerState);
    reader.apply(readerState);
    setThemePreference(values.theme);
    setSfxPreference(values.sfx);
    projectPresetSelection(preset);
  };

  document.addEventListener('click', (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    const reset = target?.closest('button[data-gaga-reader-reset]') as HTMLElement | null;
    const presetButton = target?.closest('button[data-gaga-reader-preset]') as HTMLElement | null;
    const sfxButton = target?.closest('[data-gaga-reader-pref="sfx"]') as HTMLElement | null;
    if (reset || presetButton) {
      const control = reset ?? presetButton;
      const preset = control?.dataset.gagaReaderPreset;
      const values = control ? valuesFromControl(control) : undefined;
      if (!isReaderPresetId(preset) || !values) return;
      applyPreset(preset, values, event, !!reset);
      return;
    }
    if (sfxButton) {
      const value = sfxButton.dataset.gagaReaderValue;
      if (isReaderSfxPreference(value)) setSfxPreference(value);
    }
    if (target?.closest('[data-gaga-reader-pref]')) {
      syncPresetSelection();
    }
  });

  projectSfxPreference(readSfxState());
  syncPresetSelection();
}
