import {
  createElementScrollContext,
  createWindowScrollContext,
  type ScrollContext
} from '@gaga/engine-runtime/runtime/scroll-context';
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
    document.querySelector<HTMLElement>('.gaga-markdown-content') ??
    document.querySelector<HTMLElement>('[data-gaga-article-shell]') ??
    mainScrollOwner() ??
    document.body
  );
}

export function readingScrollOwner(): HTMLElement {
  const mode = document.documentElement.dataset.gagaLayout;
  const article = articleScrollOwner();
  const main = mainScrollOwner();
  const doc = documentScrollOwner();

  if (article && article.scrollHeight > article.clientHeight + 10) {
    if (!supportsGagaDock(mode)) return article;
  }

  if (main && main.scrollHeight > main.clientHeight + 10) {
    return main;
  }

  if (article && article.scrollHeight > article.clientHeight + 10) {
    return article;
  }

  return doc;
}

export function resolveReadingScrollContext(): ReadingScrollContext | null {
  const owner = readingScrollOwner();
  const element = readingElement();
  if (!owner || !element) return null;
  return {
    owner,
    readingElement: element,
    scrollContext: owner === documentScrollOwner() ? createWindowScrollContext() : createElementScrollContext(owner)
  };
}

export function getUnifiedScrollMetrics() {
  const owner = readingScrollOwner();
  const context = owner === documentScrollOwner() ? createWindowScrollContext() : createElementScrollContext(owner);
  const m = context.measure();
  return { scrollTop: m.scrollTop, scrollHeight: m.scrollHeight, clientHeight: m.viewportHeight,
    maxScroll: m.maxScrollTop, percentage: Math.round(m.progress * 10) / 10 };
}
