import {
  createElementScrollContext,
  type ScrollContext
} from '@gaga/engine-web/runtime/scroll-context';
import { supportsGagaDock } from '../../config/systems';

export type ReadingScrollContext = {
  owner: HTMLElement;
  readingElement: HTMLElement;
  scrollContext: ScrollContext;
};

function articleScrollOwner(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-gaga-article-scroll]');
}

function mainScrollOwner(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-gaga-main-region], .gaga-main-region');
}

function documentScrollOwner(): HTMLElement {
  return (document.scrollingElement as HTMLElement) || document.documentElement || document.body;
}

function readingElement(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>('.gaga-article-scroll__inner') ??
    document.querySelector<HTMLElement>('.gaga-flagship-article__prose') ??
    document.querySelector<HTMLElement>('.sl-markdown-content') ??
    document.querySelector<HTMLElement>('[data-gaga-article-shell]') ??
    mainScrollOwner() ??
    document.body
  );
}

/**
 * Universal Scroll Owner Detector:
 * Verifies whether the container actually has scrollable overflow (scrollHeight > clientHeight)
 * to avoid binding listeners to inert non-scrolling wrappers.
 */
export function readingScrollOwner(): HTMLElement {
  const mode = document.documentElement.dataset.gagaLayout;
  const article = articleScrollOwner();
  const main = mainScrollOwner();
  const doc = documentScrollOwner();

  // Test actual scrollability
  if (article && article.scrollHeight > article.clientHeight + 10) {
    if (!supportsGagaDock(mode)) return article;
  }

  if (main && main.scrollHeight > main.clientHeight + 10) {
    return main;
  }

  if (article && article.scrollHeight > article.clientHeight + 10) {
    return article;
  }

  // Fallback to primary viewport scrolling element
  return doc;
}

export function resolveReadingScrollContext(): ReadingScrollContext | null {
  const owner = readingScrollOwner();
  const element = readingElement();
  if (!owner || !element) return null;
  return {
    owner,
    readingElement: element,
    scrollContext: createElementScrollContext(owner)
  };
}

export function articleReadingScopeIsActive(): boolean {
  const readingScope = document.querySelector<HTMLElement>(
    '[data-gaga-article-scroll], [data-gaga-article-shell], .gaga-flagship-article'
  );
  if (!readingScope) return false;
  const owner = readingScrollOwner();
  if (!owner) return false;
  const scopeRect = readingScope.getBoundingClientRect();
  const ownerRect = owner === documentScrollOwner()
    ? { top: 0, bottom: window.innerHeight }
    : owner.getBoundingClientRect();
  return scopeRect.bottom > ownerRect.top + 1 && scopeRect.top < ownerRect.bottom - 1;
}

export function getUnifiedScrollMetrics() {
  const owner = readingScrollOwner();
  const isDoc = owner === documentScrollOwner();

  const scrollTop = isDoc
    ? window.scrollY || document.documentElement.scrollTop || 0
    : owner.scrollTop;

  const scrollHeight = isDoc
    ? Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
    : owner.scrollHeight;

  const clientHeight = isDoc
    ? window.innerHeight
    : owner.clientHeight;

  const maxScroll = Math.max(1, scrollHeight - clientHeight);
  const percentage = Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100));

  return {
    scrollTop,
    scrollHeight,
    clientHeight,
    maxScroll,
    percentage: Math.round(percentage * 10) / 10
  };
}
