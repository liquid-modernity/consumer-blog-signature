import { createTocSpyCapability, type TocSpyCapability } from '@gaga/engine-web/runtime/toc-spy';
import { emitTocActiveChanged, onRuntimeEvent } from '@gaga/engine-web/runtime/events';
import { i18nConfig } from '../../config/i18n';
import { resolveReadingScrollContext } from './reading-scroll';

let initialized = false;
let capability: TocSpyCapability | null = null;

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
    getActivationMarker: ({ innerHeight }) => Math.max(96, innerHeight * .22),
    emitTocActiveChanged
  });
}

export function initTocSpy() {
  if (initialized) return;
  initialized = true;
  bindTocSpy();
  onRuntimeEvent('layoutChanged', bindTocSpy);
}
