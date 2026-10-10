import {
  createElementScrollContext,
  type ScrollContext
} from '@gaga/engine-web/runtime/scroll-context';
import { supportsBottomDock } from '../../config/systems';

export type ReadingScrollContext = {
  owner: HTMLElement;
  readingElement: HTMLElement;
  scrollContext: ScrollContext;
};

function articleScrollOwner() {
  return document.querySelector<HTMLElement>('[data-gaga-article-scroll]');
}

function mainScrollOwner() {
  return document.querySelector<HTMLElement>('[data-gaga-main-region]');
}

function readingElement() {
  return (
    document.querySelector<HTMLElement>('.gaga-article-scroll__inner') ??
    document.querySelector<HTMLElement>('.sl-markdown-content') ??
    mainScrollOwner()
  );
}

export function readingScrollOwner() {
  const mode = document.documentElement.dataset.gagaLayout;
  if (!supportsBottomDock(mode)) return articleScrollOwner() ?? mainScrollOwner();
  return mainScrollOwner() ?? articleScrollOwner();
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

export function articleReadingScopeIsActive() {
  const readingScope = document.querySelector<HTMLElement>('[data-gaga-article-scroll]');
  if (!readingScope) return false;
  const owner = readingScrollOwner();
  if (!owner) return false;
  const scopeRect = readingScope.getBoundingClientRect();
  const ownerRect = owner.getBoundingClientRect();
  return scopeRect.bottom > ownerRect.top + 1 && scopeRect.top < ownerRect.bottom - 1;
}
