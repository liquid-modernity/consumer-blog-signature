import { createOutlinePeekCapability } from '@gaga/engine-web/runtime/outline-peek';
import {
  onRuntimeEvent,
  requestLeftRail,
  requestReaderPanel,
  type SurfaceCommandDetail
} from '@gaga/engine-web/runtime/events';
import {
  getOutlinePeekAttachment,
  outlinePeekRequiresTableOfContents,
  supportsBottomDock,
  supportsOutlinePeek
} from '../../config/systems';
import { articleReadingScopeIsActive, resolveReadingScrollContext } from './reading-scroll';

let initialized = false;

function hasUsableTableOfContents(sheet: HTMLElement) {
  return sheet.dataset.gagaOutlineToc === 'true' && !!sheet.querySelector('[data-gaga-info-field="outline"] a[href^="#"]');
}

function tableOfContentsAllowed(sheet: HTMLElement) {
  return !outlinePeekRequiresTableOfContents() || hasUsableTableOfContents(sheet);
}

function decodeHash(hash: string) {
  const value = hash.replace(/^#/, '');
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function currentHashTarget() {
  const id = decodeHash(window.location.hash);
  return id ? document.getElementById(id) : null;
}

function readingFocusTarget() {
  return (
    currentHashTarget() ??
    document.querySelector<HTMLElement>('.sl-markdown-content') ??
    document.querySelector<HTMLElement>('[data-gaga-main-region]') ??
    document.querySelector<HTMLElement>('main')
  );
}

export function initOutlinePeek() {
  if (initialized) return;
  const sheet = document.querySelector('[data-gaga-outline-peek]') as HTMLElement | null;
  if (!sheet) return;
  initialized = true;

  const stack = sheet.closest<HTMLElement>('[data-gaga-outline-stack]');
  const capability = createOutlinePeekCapability({
    sheet,
    getLayoutMode: () => document.documentElement.dataset.gagaLayout,
    isAvailable: ({ mode, sheet }) => {
      const dock = document.querySelector('[data-gaga-mobile-dock]') as HTMLElement | null;
      return supportsBottomDock(mode) &&
        supportsOutlinePeek(mode) &&
        getOutlinePeekAttachment() === 'bottom-dock' &&
        !!dock &&
        tableOfContentsAllowed(sheet) &&
        articleReadingScopeIsActive();
    },
    getAttachment: getOutlinePeekAttachment,
    getReadingFocusTarget: readingFocusTarget,
    beforeOpen: () => {
      requestReaderPanel({ action: 'close', source: 'outline-open' });
      requestLeftRail({ action: 'collapse', source: 'outline-open' });
    },
  });

  let unsubscribeScrollContext: (() => void) | null = null;
  let scheduled = false;
  let frameId: number | undefined;

  function syncAvailability() {
    scheduled = false;
    frameId = undefined;
    const available = capability.applyAvailability();
    stack?.toggleAttribute('hidden', !available);
  }

  function scheduleAvailability() {
    if (scheduled) return;
    scheduled = true;
    frameId = window.requestAnimationFrame(syncAvailability);
  }

  function bindScrollOwner() {
    unsubscribeScrollContext?.();
    unsubscribeScrollContext = resolveReadingScrollContext()?.scrollContext.addChangeListener(scheduleAvailability) ?? null;
    scheduleAvailability();
  }

  bindScrollOwner();
  onRuntimeEvent('layoutChanged', bindScrollOwner);

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const control = target.closest<HTMLElement>('[data-gaga-action="toggle-outline"]');
    if (!control) return;
    capability.runCommand({ action: 'toggle', x: event.clientX, y: event.clientY, target: control, source: 'click' } satisfies SurfaceCommandDetail);
  });

  window.addEventListener('pagehide', () => {
    unsubscribeScrollContext?.();
    if (frameId !== undefined) window.cancelAnimationFrame(frameId);
  }, { once: true });
}
