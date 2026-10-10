import { createShareCapability } from '@gaga/engine-web/runtime/share';
import { requestToast, onRuntimeEvent } from '@gaga/engine-web/runtime/events';
import { actionById } from '../../config/actions';
import { resolveReadingScrollContext } from './reading-scroll';
import { registerSiteCommand, runSiteCommand } from './site-commands';

const DIRECTION_THRESHOLD = 12;
const ARTICLE_START_PROGRESS = 2;
const ARTICLE_END_PROGRESS = 98;

function articleContentIsActive() {
  const frame = document.querySelector<HTMLElement>('[data-gaga-app-frame]');
  return frame?.dataset.gagaContentKind === 'article';
}

export function initMobileDock() {
  const shareAction = actionById('share');
  const share = createShareCapability();
  const dock = document.querySelector<HTMLElement>('[data-gaga-mobile-dock]');
  let unsubscribeScrollContext: (() => void) | null = null;
  let lastScrollTop = 0;
  let accumulatedDelta = 0;

  function setDockState(state: 'visible' | 'hidden') {
    document.documentElement.dataset.gagaMobileDockState = state;
    document.documentElement.dataset.gagaReadingChromeState = state;
    if (!dock || dock.dataset.gagaState === state) return;
    dock.dataset.gagaState = state;
  }

  function syncDockVisibility() {
    if (!dock) return;
    const isArticle = articleContentIsActive();
    if (!isArticle) {
      setDockState('visible');
      accumulatedDelta = 0;
      return;
    }

    const context = resolveReadingScrollContext();
    if (!context) {
      setDockState('visible');
      return;
    }
    const measurements = context.scrollContext.measure();
    const current = measurements.scrollTop;
    const delta = current - lastScrollTop;
    lastScrollTop = current;

    const readingProgress = context.scrollContext.readingProgress(context.readingElement);
    if (readingProgress <= ARTICLE_START_PROGRESS || readingProgress >= ARTICLE_END_PROGRESS || measurements.maxScrollTop <= 1) {
      accumulatedDelta = 0;
      setDockState('visible');
      return;
    }

    if (Math.sign(delta) !== Math.sign(accumulatedDelta) && accumulatedDelta !== 0) accumulatedDelta = 0;
    accumulatedDelta += delta;

    if (accumulatedDelta >= DIRECTION_THRESHOLD) {
      accumulatedDelta = 0;
      setDockState('hidden');
    } else if (accumulatedDelta <= -DIRECTION_THRESHOLD) {
      accumulatedDelta = 0;
      setDockState('visible');
    }
  }

  function bindDockScrollContext() {
    unsubscribeScrollContext?.();
    unsubscribeScrollContext = null;
    const context = resolveReadingScrollContext();
    lastScrollTop = context?.scrollContext.measure().scrollTop ?? 0;
    accumulatedDelta = 0;
    setDockState('visible');
    if (context && articleContentIsActive()) {
      unsubscribeScrollContext = context.scrollContext.addChangeListener(syncDockVisibility);
    }
  }

  bindDockScrollContext();
  onRuntimeEvent('layoutChanged', bindDockScrollContext);

  async function shareCurrentPage(pointer: { x?: number; y?: number } = {}) {
    const feedback = { x: pointer.x, y: pointer.y, source: 'share' };
    const outcome = await share.share({ title: document.title, url: location.href });
    if (outcome.status === 'shared') {
      requestToast({ message: shareAction.feedback?.success ?? 'Share panel opened', tone: 'ok', ...feedback });
    } else if (outcome.status === 'copied') {
      requestToast({ message: shareAction.feedback?.fallbackSuccess ?? 'Link copied', tone: 'ok', ...feedback });
    } else if (outcome.status !== 'cancelled') {
      requestToast({ message: shareAction.feedback?.failure ?? 'Could not share link', tone: 'warn', ...feedback });
    }
  }

  if (shareAction.command) {
    registerSiteCommand(shareAction.command, (detail) => {
      void shareCurrentPage(detail.pointer);
      return true;
    });
  }

  document.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!shareAction.command || !target.closest(`[data-gaga-action="${shareAction.command}"]`)) return;
    event.preventDefault();
    runSiteCommand(shareAction.command, { source: 'quick-action', pointer: { x: event.clientX, y: event.clientY } });
  });

  document.addEventListener('focusin', (event) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest('[data-gaga-article-utility], [data-gaga-article-reading-utilities]')) return;
    setDockState('visible');
    accumulatedDelta = 0;
  });

  window.addEventListener('pagehide', () => unsubscribeScrollContext?.(), { once: true });
}
