import { createTocSpyCapability, type TocSpyCapability } from '@gaga/engine-runtime/runtime/toc-spy';
import { emitTocActiveChanged, onRuntimeEvent } from '@gaga/engine-runtime/runtime/events';
import { i18nConfig } from '../../config/i18n';
import { resolveReadingScrollContext } from './reading-scroll';
import { notifySectionChanged } from './reading-behaviour';

let initialized = false;
let capability: TocSpyCapability | null = null;
let lastActiveHeadingId = '';

export function hydrateDomOutlineIfSparse(readingRoot: HTMLElement) {
  const lists = Array.from(document.querySelectorAll<HTMLOListElement>('ol[data-gaga-info-field="outline"]'));
  if (!lists.length) return;
  const body = readingRoot.querySelector<HTMLElement>('[data-gaga-article-body]') ?? readingRoot;
  const headings = Array.from(body.querySelectorAll<HTMLElement>('h2[id], h3[id]')).filter(
    (el) => Boolean(el.id && el.id !== 'gaga-page-metadata-title' && el.textContent?.trim())
  );
  if (headings.length === 0) return;

  for (const list of lists) {
    if (list.querySelectorAll('a[href^="#"]').length > 1) continue;
    const items = headings.map((heading) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${heading.id}`;
      a.textContent = heading.textContent?.trim() ?? '';
      li.appendChild(a);
      return li;
    });
    list.replaceChildren(...items);
    const stack = list.closest<HTMLElement>('[data-gaga-outline-pending="true"]');
    if (stack) {
      for (const label of stack.querySelectorAll('[data-gaga-outline-current-label], [data-gaga-outline-sheet-current-label]')) label.textContent = headings[0].textContent?.trim() ?? '';
      for (const index of stack.querySelectorAll('[data-gaga-outline-current-index], [data-gaga-outline-sheet-current-index]')) index.textContent = '1';
      for (const total of stack.querySelectorAll('[data-gaga-outline-total], [data-gaga-outline-sheet-total]')) total.textContent = String(headings.length);
      stack.removeAttribute('data-gaga-outline-pending'); stack.hidden = false;
    }
  }
}

function bindTocSpy() {
  capability?.cleanup();
  capability = null;

  const context = resolveReadingScrollContext();
  if (!context) return;

  hydrateDomOutlineIfSparse(context.readingElement);

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
