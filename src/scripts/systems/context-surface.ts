import { onRuntimeEvent, requestLeftRail, requestOutline, requestReaderPanel } from '@gaga/engine-web/runtime/events';
import { supportsGagaDock } from '../../config/systems';
import { activateModalIsolation, clearModalIsolation } from './modal-isolation';
import { registerSiteCommand, runSiteCommand } from './site-commands';

let initialized = false;
let opener: HTMLElement | null = null;

function rail() {
  return document.querySelector<HTMLElement>('[data-gaga-right-rail]');
}

function scrim() {
  return document.querySelector<HTMLButtonElement>('[data-gaga-context-surface-scrim]');
}

function compactMode() {
  return supportsGagaDock(document.documentElement.dataset.gagaLayout);
}

export function contextSurfaceIsOpen() {
  return compactMode() && rail()?.dataset.gagaContextSurfaceState === 'open';
}

export function closeContextSurface(options: { restoreFocus?: boolean } = {}) {
  const surface = rail();
  if (!surface) return;
  surface.dataset.gagaContextSurfaceState = 'closed';
  const compact = compactMode();
  surface.setAttribute('aria-hidden', compact ? 'true' : 'false');
  if (compact) {
    surface.setAttribute('role', 'dialog');
    surface.setAttribute('aria-modal', 'true');
    surface.setAttribute('inert', '');
  } else {
    surface.removeAttribute('role');
    surface.removeAttribute('aria-modal');
    surface.removeAttribute('inert');
  }
  scrim()?.setAttribute('hidden', '');
  clearModalIsolation('context-surface');
  document.querySelectorAll<HTMLElement>('[data-gaga-action="toggle-context-surface"]').forEach((control) => {
    control.setAttribute('aria-expanded', 'false');
    control.dataset.gagaActive = 'false';
  });
  if (options.restoreFocus !== false && opener?.isConnected) opener.focus({ preventScroll: true });
  opener = null;
}

function openContextSurface(trigger?: HTMLElement | null) {
  const surface = rail();
  if (!surface || !compactMode()) return false;
  opener = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
  requestOutline({ action: 'close', source: 'context-surface-open' });
  requestReaderPanel({ action: 'close', source: 'context-surface-open' });
  requestLeftRail({ action: 'close', source: 'context-surface-open' });
  surface.dataset.gagaContextSurfaceState = 'open';
  surface.setAttribute('role', 'dialog');
  surface.setAttribute('aria-modal', 'true');
  surface.setAttribute('aria-hidden', 'false');
  surface.removeAttribute('inert');
  scrim()?.removeAttribute('hidden');
  activateModalIsolation('context-surface');
  document.querySelectorAll<HTMLElement>('[data-gaga-action="toggle-context-surface"]').forEach((control) => {
    control.setAttribute('aria-expanded', 'true');
    control.dataset.gagaActive = 'true';
  });
  surface.querySelector<HTMLElement>('[data-gaga-context-surface-close]')?.focus({ preventScroll: true });
  return true;
}

function toggleContextSurface(trigger?: HTMLElement | null) {
  if (!compactMode()) return false;
  if (contextSurfaceIsOpen()) {
    closeContextSurface();
    return true;
  }
  return openContextSurface(trigger);
}

function syncLayout() {
  const surface = rail();
  if (!surface) return;
  if (!compactMode()) {
    surface.dataset.gagaContextSurfaceState = 'closed';
    surface.setAttribute('aria-hidden', 'false');
    surface.removeAttribute('role');
    surface.removeAttribute('aria-modal');
    surface.removeAttribute('inert');
    scrim()?.setAttribute('hidden', '');
    clearModalIsolation('context-surface');
    return;
  }
  closeContextSurface({ restoreFocus: false });
}

export function initContextSurface() {
  if (initialized || !rail()) return;
  initialized = true;

  registerSiteCommand('toggle-context-surface', (detail) => {
    return toggleContextSurface(detail.target ?? null);
  });

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const trigger = target.closest<HTMLElement>('[data-gaga-action="toggle-context-surface"]');
    if (trigger) {
      event.preventDefault();
      runSiteCommand('toggle-context-surface', { source: 'quick-action', target: trigger, pointer: { x: event.clientX, y: event.clientY } });
      return;
    }
    if (target.closest('[data-gaga-context-surface-close], [data-gaga-context-surface-scrim]')) {
      event.preventDefault();
      closeContextSurface();
    }
  });

  onRuntimeEvent('layoutChanged', syncLayout);
  syncLayout();
}
