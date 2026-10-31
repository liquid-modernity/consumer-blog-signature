import { hydrateDomOutlineIfSparse } from './toc-spy';
import { createOutlinePeekCapability } from '@gaga/engine-runtime/runtime/outline-peek';
import { onRuntimeEvent, requestLeftRail, requestReaderPanel, type SurfaceCommandDetail } from '@gaga/engine-runtime/runtime/events';
import { getOutlinePeekAttachment, outlinePeekRequiresTableOfContents, supportsOutlinePeek } from '../../config/systems';
import { resolveReadingScrollContext } from './reading-scroll';

let initialized = false;

function hasUsableTableOfContents(sheet: HTMLElement) {
  return sheet.dataset.gagaOutlineToc === 'true' && !!sheet.querySelector('[data-gaga-info-field="outline"] a[href^="#"]');
}
function tableOfContentsAllowed(sheet: HTMLElement) { return !outlinePeekRequiresTableOfContents() || hasUsableTableOfContents(sheet); }
function decodeHash(hash: string) { const value = hash.replace(/^#/, ''); try { return decodeURIComponent(value); } catch { return value; } }
function currentHashTarget() { const id = decodeHash(window.location.hash); return id ? document.getElementById(id) : null; }
function readingFocusTarget() { return currentHashTarget() ?? document.querySelector<HTMLElement>('.gaga-markdown-content') ?? document.querySelector<HTMLElement>('[data-gaga-main-region]') ?? document.querySelector<HTMLElement>('main'); }
function normalizeHash(value: string) { return decodeHash(value); }

export function initOutlinePeek() {
  if (initialized) return;
  const sheet = document.querySelector<HTMLElement>('[data-gaga-outline-peek]');
  if (!sheet) return;
  initialized = true;
  const context = resolveReadingScrollContext();
  if (context) hydrateDomOutlineIfSparse(context.readingElement);

  const stack = sheet.closest<HTMLElement>('[data-gaga-outline-stack]');
  const currentIndex = stack?.querySelector<HTMLElement>('[data-gaga-outline-current-index]') ?? null;
  const currentLabel = stack?.querySelector<HTMLElement>('[data-gaga-outline-current-label]') ?? null;
  const sheetCurrentIndex = stack?.querySelector<HTMLElement>('[data-gaga-outline-sheet-current-index]') ?? null;
  const sheetCurrentLabel = stack?.querySelector<HTMLElement>('[data-gaga-outline-sheet-current-label]') ?? null;
  const links = Array.from(sheet.querySelectorAll<HTMLAnchorElement>('[data-gaga-info-field="outline"] a[href^="#"]'));

  const capability = createOutlinePeekCapability({
    sheet,
    getLayoutMode: () => document.documentElement.dataset.gagaLayout,
    isAvailable: ({ mode, sheet }) => supportsOutlinePeek(mode) && tableOfContentsAllowed(sheet),
    getAttachment: getOutlinePeekAttachment,
    getReadingFocusTarget: readingFocusTarget,
    beforeOpen: () => {
      requestReaderPanel({ action: 'close', source: 'outline-open' });
      requestLeftRail({ action: 'collapse', source: 'outline-open' });
      sheet.dataset.gagaDepth = 'expanded';
      if (stack) stack.dataset.gagaVisibility = 'visible';
      // This composition has no close button; focus its first link after native open removes inert.
      queueMicrotask(() => {
        if (sheet.dataset.gagaState === 'open') sheet.querySelector<HTMLAnchorElement>('[data-gaga-info-field="outline"] a[href^="#"]')?.focus({ preventScroll: true });
      });
    }
  });

  let scheduled = false;
  let frameId: number | undefined;
  let gestureStartY: number | null = null;

  const isOpen = () => sheet.dataset.gagaState === 'open';
  const close = (source: string) => {
    if (!isOpen()) return;
    capability.runCommand({ action: 'toggle', target: sheet, source } satisfies SurfaceCommandDetail);
  };

  function syncAvailability() {
    scheduled = false;
    frameId = undefined;
    const available = capability.applyAvailability();
    stack?.toggleAttribute('hidden', !available);
  }

  function scheduleAvailability() {
    if (scheduled) return;
    scheduled = true;
    frameId = requestAnimationFrame(syncAvailability);
  }

  function updateSemanticPosition(id: string, label: string) {
    const index = Math.max(0, links.findIndex((link) => normalizeHash(link.hash) === id));
    const resolvedIndex = index + 1;
    if (currentIndex) currentIndex.textContent = String(resolvedIndex);
    if (sheetCurrentIndex) sheetCurrentIndex.textContent = String(resolvedIndex);
    if (currentLabel && label) currentLabel.textContent = label;
    if (sheetCurrentLabel && label) sheetCurrentLabel.textContent = label;
  }

  scheduleAvailability();
  onRuntimeEvent('layoutChanged', scheduleAvailability);
  onRuntimeEvent('tocActiveChanged', (detail) => updateSemanticPosition(detail.id, detail.label));

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const control = target.closest<HTMLElement>('[data-gaga-action="toggle-outline"]');
    if (control) {
      capability.runCommand({ action: 'toggle', x: event.clientX, y: event.clientY, target: control, source: 'click' } satisfies SurfaceCommandDetail);
      return;
    }
    if (isOpen() && target.closest('[data-gaga-info-field="outline"] a[href^="#"]')) close('outline-link');
  });

  document.addEventListener('pointerdown', (event) => {
    if (!isOpen()) return;
    const target = event.target;
    if (!(target instanceof Node) || sheet.contains(target)) return;
    close('outside-pointer');
  }, { passive: true });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { close('escape'); return; }
    if (!isOpen() || !(event.target instanceof Node) || !sheet.contains(event.target)) return;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      sheet.dataset.gagaDepth = 'full';
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (sheet.dataset.gagaDepth === 'full') sheet.dataset.gagaDepth = 'expanded';
      else close('keyboard-down');
    }
  });

  sheet.addEventListener('pointerdown', (event) => { gestureStartY = event.clientY; }, { passive: true });
  sheet.addEventListener('pointerup', (event) => {
    if (gestureStartY === null) return;
    const delta = event.clientY - gestureStartY;
    gestureStartY = null;
    if (delta < -56) sheet.dataset.gagaDepth = 'full';
    else if (delta > 56 && sheet.dataset.gagaDepth === 'full') sheet.dataset.gagaDepth = 'expanded';
    else if (delta > 72) close('swipe-down');
  }, { passive: true });

  window.addEventListener('pagehide', () => {
    if (frameId !== undefined) cancelAnimationFrame(frameId);
  }, { once: true });
}
