import { createSfxCapability, type SfxToneConfig } from '@gaga/engine-web/runtime/sfx';
import { requestFeedback } from '@gaga/engine-web/runtime/events';
import { actionFeedbackLabel, actionForCommand } from '../../config/actions';
import { defaultReaderSfxPreference, isReaderSfxPreference, type ReaderSfxPreference } from '../../config/reader';
import { storageKeys } from '../../config/systems';
import { readJson, writeJson } from '@gaga/engine-web/runtime/storage';

type Tone = 'hover' | 'focus' | 'tap' | 'click' | 'confirm' | 'open';

const tones: Record<Tone, SfxToneConfig> = {
  hover: { frequency: 760, duration: 0.025, gain: 0.026, oscillatorType: 'square' },
  focus: { frequency: 680, duration: 0.025, gain: 0.026, oscillatorType: 'square' },
  tap: { frequency: 820, duration: 0.025, gain: 0.026, oscillatorType: 'square' },
  click: { frequency: 360, endFrequency: 520, duration: 0.055, gain: 0.045, oscillatorType: 'triangle' },
  confirm: { frequency: 920, duration: 0.055, gain: 0.045, oscillatorType: 'triangle' },
  open: { frequency: 540, duration: 0.055, gain: 0.045, oscillatorType: 'triangle' }
};

let state: ReaderSfxPreference = 'on';
let lastTarget: Element | null = null;
let lastHover = 0;

const materialStateSelector = [
  '[data-gaga-action="toggle-save"]',
  '[data-gaga-action="toggle-reader-preferences"]',
  '[data-gaga-action="toggle-focus-mode"]',
  '[data-gaga-action="toggle-left-rail"]',
  '[data-gaga-action="toggle-right-rail"]',
  '[data-gaga-action="toggle-context-surface"]',
  '[data-gaga-action="toggle-outline"]',
  '[data-gaga-reader-pref]',
  '[data-gaga-reader-preset]',
  '[data-gaga-reader-reset]',
  '[data-gaga-saved-remove]'
].join(',');

function interactiveFrom(target: EventTarget | null) {
  return target instanceof HTMLElement ? target.closest('a, button, summary, [role="button"]') as HTMLElement | null : null;
}

function labelFor(target: HTMLElement) {
  const action = actionForCommand(target.dataset.gagaAction);
  const registryLabel = actionFeedbackLabel(action);
  return target.getAttribute('aria-label') || registryLabel || target.textContent?.trim() || '';
}

function feedback(kind: 'hover' | 'click' | 'action', target: HTMLElement, event: MouseEvent | PointerEvent) {
  if (kind === 'click' && target.closest(materialStateSelector)) return;
  requestFeedback({
    kind,
    target,
    label: labelFor(target),
    x: event.clientX,
    y: event.clientY,
    source: 'sfx'
  });
}

function projectSfxPreference(value: ReaderSfxPreference) {
  document.body.dataset.gagaSfx = value;
  for (const button of document.querySelectorAll<HTMLElement>('[data-gaga-reader-pref="sfx"]')) {
    const active = button.dataset.gagaReaderValue === value;
    button.dataset.gagaActive = String(active);
    button.setAttribute('aria-pressed', String(active));
  }
}

function setSfxPreference(value: ReaderSfxPreference) {
  state = value;
  writeJson(storageKeys.sfx, state);
  projectSfxPreference(state);
}

export function initSfx() {
  state = readJson(storageKeys.sfx, defaultReaderSfxPreference, isReaderSfxPreference);
  projectSfxPreference(state);
  const sfx = createSfxCapability<Tone>({
    tones,
    getEnabled: () => state === 'on',
    throttleMs: 85
  });

  document.addEventListener('pointerover', (event) => {
    const target = interactiveFrom(event.target);
    if (!target || target === lastTarget) return;
    const now = performance.now();
    if (now - lastHover < 85) return;
    lastTarget = target;
    lastHover = now;
    sfx.play('hover');
    feedback('hover', target, event);
  }, { passive: true });

  document.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    const target = interactiveFrom(event.target);
    if (!target) return;
    sfx.play('tap');
    feedback('hover', target, event);
  }, { passive: true });

  document.addEventListener('focusin', (event) => {
    const target = interactiveFrom(event.target);
    if (!target) return;
    sfx.play('focus');
  });

  document.addEventListener('click', (event) => {
    const target = interactiveFrom(event.target);
    const pref = target?.closest('[data-gaga-reader-pref="sfx"]') as HTMLElement | null;
    const preset = target?.closest('button[data-gaga-reader-preset], button[data-gaga-reader-reset]') as HTMLElement | null;
    if (pref) {
      const value = pref.dataset.gagaReaderValue;
      if (!isReaderSfxPreference(value)) return;
      setSfxPreference(value);
    } else if (preset) {
      const value = preset.dataset.gagaReaderSfx;
      if (isReaderSfxPreference(value)) setSfxPreference(value);
    }
    if (!target) return;
    sfx.play(pref ? 'confirm' : 'click');
    feedback('click', target, event);
  });
}
