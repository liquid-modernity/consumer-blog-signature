import { createTocSpyCapability, type TocSpyCapability } from '@gaga/engine-web/runtime/toc-spy';
import { emitTocActiveChanged, onRuntimeEvent } from '@gaga/engine-web/runtime/events';
import { i18nConfig } from '../../config/i18n';
import { resolveReadingScrollContext } from './reading-scroll';
import { notifySectionChanged } from './reading-behaviour';

let initialized = false;
let capability: TocSpyCapability | null = null;
let lastActiveHeadingId = '';

function bindTocSpy() {
  capability?.cleanup();
  capability = null;

  const context = resolveReadingScrollContext();
  if (!context) return;

  capability = createTocSpyCapability({
    tocRoot: document,
    readingRoot: context.readingElement,
    scrollContext: context.scrollContext,
    fallbackLabel: i18nConfig.id.outlineFallback,
    getActivationMarker: ({ innerHeight }) => Math.max(80, innerHeight * 0.2),
    emitTocActiveChanged(detail) {
      if (detail.id !== lastActiveHeadingId) {
        lastActiveHeadingId = detail.id;
        notifySectionChanged(detail.id);
      }
      emitTocActiveChanged(detail);
    }
  });
}

export function rebindTocSpy() {
  bindTocSpy();
}

export function initTocSpy() {
  if (initialized) return;
  initialized = true;
  bindTocSpy();
  onRuntimeEvent('layoutChanged', bindTocSpy);
  window.addEventListener('resize', bindTocSpy, { passive: true });
}
