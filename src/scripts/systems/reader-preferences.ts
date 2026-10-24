import { createReaderPreferencesCapability } from '@gaga/engine-runtime/runtime/reader-preferences';
import {
  requestLeftRail,
  requestOutline,
  requestQuickActionsSync,
  requestReaderPanel,
  requestToast
} from '@gaga/engine-runtime/runtime/events';
import { readJson, writeJson } from '@gaga/engine-runtime/runtime/storage';
import {
  defaultReaderSfxPreference,
  defaultReaderState,
  isReaderDensity,
  isReaderFontScale,
  isReaderFontFamily,
  isReaderLineHeight,
  isReaderLetterSpacing,
  isReaderMeasure,
  isReaderContrast,
  isReaderMotion,
  isReaderLinks,
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
import { defaultIdentity, setIdentityPreference, setThemePreference } from './theme';

let initialized = false;

function isReaderPresetValues(value: ReaderPresetValues): boolean {
  return isThemeId(value.theme) &&
    isReaderDensity(value.density) &&
    isReaderFontScale(value.font) &&
    isReaderSfxPreference(value.sfx);
}

function readReaderState(): ReaderState {
  const raw = readJson(storageKeys.reader, defaultReaderState, (value): value is ReaderState => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const state = value as Record<string, unknown>;
    return isReaderDensity(state.density) &&
      isReaderFontScale(state.font) &&
      (state.preset === undefined || state.preset === 'custom' || isReaderPresetId(state.preset));
  });
  return {
    ...defaultReaderState,
    ...raw
  };
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
    fontFamily: isReaderFontFamily(document.body.dataset.gagaReaderFontFamily) ? document.body.dataset.gagaReaderFontFamily : readerState.fontFamily,
    lineHeight: isReaderLineHeight(document.body.dataset.gagaReaderLineHeight) ? document.body.dataset.gagaReaderLineHeight : readerState.lineHeight,
    letterSpacing: isReaderLetterSpacing(document.body.dataset.gagaReaderLetterSpacing) ? document.body.dataset.gagaReaderLetterSpacing : readerState.letterSpacing,
    measure: isReaderMeasure(document.body.dataset.gagaReaderMeasure) ? document.body.dataset.gagaReaderMeasure : readerState.measure,
    contrast: isReaderContrast(document.body.dataset.gagaReaderContrast) ? document.body.dataset.gagaReaderContrast : readerState.contrast,
    motion: isReaderMotion(document.body.dataset.gagaReaderMotion) ? document.body.dataset.gagaReaderMotion : readerState.motion,
    links: isReaderLinks(document.body.dataset.gagaReaderLinks) ? document.body.dataset.gagaReaderLinks : readerState.links,
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
  document.documentElement.dataset.gagaSfx = value;
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
  document.documentElement.dataset.gagaReaderPreset = selection;
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

/**
 * Apply extended Gaga Reader Runtime state to DOM attributes (both html and body) and active buttons
 */
export function applyReaderRuntimeState(state: ReaderState) {
  const merged: ReaderState = {
    ...defaultReaderState,
    ...state
  };

  const applyAttr = (key: string, val: string | undefined) => {
    if (!val) return;
    document.body.dataset[key] = val;
    document.documentElement.dataset[key] = val;
  };

  applyAttr('gagaReaderFont', merged.font);
  applyAttr('gagaReaderDensity', merged.density);
  applyAttr('gagaReaderFontFamily', merged.fontFamily);
  applyAttr('gagaReaderLineHeight', merged.lineHeight);
  applyAttr('gagaReaderLetterSpacing', merged.letterSpacing);
  applyAttr('gagaReaderMeasure', merged.measure);
  applyAttr('gagaReaderContrast', merged.contrast);
  applyAttr('gagaReaderMotion', merged.motion);
  applyAttr('gagaReaderLinks', merged.links);

  // Update active states on all panel buttons
  const prefs: (keyof ReaderState)[] = [
    'font',
    'density',
    'fontFamily',
    'lineHeight',
    'letterSpacing',
    'measure',
    'contrast',
    'motion',
    'links'
  ];
  for (const pref of prefs) {
    const val = merged[pref];
    if (!val) continue;
    for (const btn of document.querySelectorAll<HTMLElement>(`[data-gaga-reader-pref="${pref}"]`)) {
      const active = btn.dataset.gagaReaderValue === val;
      btn.dataset.gagaActive = String(active);
      btn.setAttribute('aria-pressed', String(active));
    }
  }
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
      // Also collapse the Gaga Notch when the Reader Preferences panel opens
      const notch = document.querySelector<HTMLElement>('[data-gaga-action-runtime]');
      if (notch && (notch.dataset.gagaState === 'expanded' || notch.dataset.gagaState === 'peek')) {
        notch.dataset.gagaState = 'collapsed';
        notch.querySelector('[data-gaga-action-island-toggle]')?.setAttribute('aria-expanded', 'false');
      }
    },
    requestQuickActionsSync
  });

  const applyPreset = (preset: ReaderPresetId, values: ReaderPresetValues, isReset = false) => {
    const currentState = isReset ? defaultReaderState : readReaderState();
    const readerState: ReaderState = {
      ...currentState,
      density: values.density,
      font: values.font,
      fontFamily: isReset ? defaultReaderState.fontFamily : (values.fontFamily ?? currentState.fontFamily),
      lineHeight: isReset ? defaultReaderState.lineHeight : (values.lineHeight ?? currentState.lineHeight),
      letterSpacing: isReset ? defaultReaderState.letterSpacing : (values.letterSpacing ?? currentState.letterSpacing),
      measure: isReset ? defaultReaderState.measure : (values.measure ?? currentState.measure),
      contrast: isReset ? defaultReaderState.contrast : (values.contrast ?? currentState.contrast),
      motion: isReset ? defaultReaderState.motion : (values.motion ?? currentState.motion),
      links: isReset ? defaultReaderState.links : (values.links ?? currentState.links),
      preset
    };
    writeJson(storageKeys.reader, readerState);
    reader.apply(readerState);
    applyReaderRuntimeState(readerState);
    setThemePreference(values.theme);
    setSfxPreference(values.sfx);
    if (isReset) {
      setIdentityPreference(defaultIdentity);
    }
    projectPresetSelection(preset);
  };

  document.addEventListener('click', (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target) return;

    // 1. Close button inside Reader Preferences panel
    const closeBtn = target.closest('[data-gaga-reader-panel] [data-gaga-action="close-top-surface"], [data-gaga-reader-close]');
    if (closeBtn) {
      event.preventDefault();
      event.stopPropagation();
      requestReaderPanel({
        action: 'close',
        source: 'reader-panel-close',
        x: event.clientX,
        y: event.clientY
      });
      return;
    }

    // 2. Click outside open Reader Preferences panel closes it cleanly
    if (
      panel &&
      panel.dataset.gagaState === 'open' &&
      !panel.contains(target) &&
      !target.closest('[data-gaga-action="toggle-reader-preferences"]')
    ) {
      requestReaderPanel({
        action: 'close',
        source: 'reader-outside-click',
        x: event.clientX,
        y: event.clientY
      });
    }

    const reset = target.closest('button[data-gaga-reader-reset]') as HTMLElement | null;
    const presetButton = target.closest('button[data-gaga-reader-preset]') as HTMLElement | null;
    const sfxButton = target.closest('[data-gaga-reader-pref="sfx"]') as HTMLElement | null;
    const prefButton = target.closest('[data-gaga-reader-pref]') as HTMLElement | null;

    if (reset || presetButton) {
      const control = reset ?? presetButton;
      const preset = control?.dataset.gagaReaderPreset;
      const values = control ? valuesFromControl(control) : undefined;
      if (!isReaderPresetId(preset) || !values) return;
      applyPreset(preset, values, Boolean(reset));
      if (reset) {
        requestToast({
          message: 'Preferensi tampilan dikembalikan ke awal',
          x: event.clientX,
          y: event.clientY,
          tone: 'ok',
          source: 'reader-reset'
        });
      }
      return;
    }

    if (sfxButton) {
      const value = sfxButton.dataset.gagaReaderValue;
      if (isReaderSfxPreference(value)) setSfxPreference(value);
    }

    if (prefButton) {
      const prefName = prefButton.dataset.gagaReaderPref;
      const prefValue = prefButton.dataset.gagaReaderValue;
      if (prefName && prefValue) {
        const currentState = readReaderState();
        let updated = false;

        if (prefName === 'font' && isReaderFontScale(prefValue)) {
          currentState.font = prefValue;
          updated = true;
        } else if (prefName === 'density' && isReaderDensity(prefValue)) {
          currentState.density = prefValue;
          updated = true;
        } else if (prefName === 'fontFamily' && isReaderFontFamily(prefValue)) {
          currentState.fontFamily = prefValue;
          updated = true;
        } else if (prefName === 'lineHeight' && isReaderLineHeight(prefValue)) {
          currentState.lineHeight = prefValue;
          updated = true;
        } else if (prefName === 'letterSpacing' && isReaderLetterSpacing(prefValue)) {
          currentState.letterSpacing = prefValue;
          updated = true;
        } else if (prefName === 'measure' && isReaderMeasure(prefValue)) {
          currentState.measure = prefValue;
          updated = true;
        } else if (prefName === 'contrast' && isReaderContrast(prefValue)) {
          currentState.contrast = prefValue;
          updated = true;
        } else if (prefName === 'motion' && isReaderMotion(prefValue)) {
          currentState.motion = prefValue;
          updated = true;
        } else if (prefName === 'links' && isReaderLinks(prefValue)) {
          currentState.links = prefValue;
          updated = true;
        }

        if (updated) {
          writeJson(storageKeys.reader, currentState);
          reader.apply(currentState);
          applyReaderRuntimeState(currentState);
        }
      }
      syncPresetSelection();
    }
  });

  // Apply initial saved state on page boot
  const initialState = readReaderState();
  reader.apply(initialState);
  applyReaderRuntimeState(initialState);
  projectSfxPreference(readSfxState());
  syncPresetSelection();
}

