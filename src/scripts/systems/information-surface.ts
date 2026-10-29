import { initInformationSurface as initEngineInformationSurface } from '@gaga/engine-runtime/runtime/information-surface';
import { getInformationPreviewRestoreDelayMs } from '../../config/systems';
import { positionLinkPreview } from '../../config/contextual-ux.mjs';

let initialized = false;
export function initInformationSurface() {
  const card = document.querySelector<HTMLElement>('[data-gaga-hover-preview-card]');
  if (initialized || !card) return;
  initialized = true;
  let active: HTMLElement | null = null, suppressed: HTMLElement | null = null;
  const id = 'gaga-link-preview';
  card.id = id; card.setAttribute('role', 'tooltip');
  function unbind() {
    if (!active) return;
    const remaining = (active.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(value => value && value !== id);
    if (remaining.length) active.setAttribute('aria-describedby', remaining.join(' ')); else active.removeAttribute('aria-describedby');
  }
  function close() { card!.hidden = true; unbind(); }
  function position() {
    if (!active || card!.hidden) return;
    const rect = active.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) { close(); return; }
    const point = positionLinkPreview(rect, card!.getBoundingClientRect(), { width: innerWidth, height: innerHeight });
    card!.style.left = point.left + 'px'; card!.style.top = point.top + 'px'; card!.style.width = point.width + 'px';
  }
  // The public document port scopes Engine preview projection to its own card, never page metadata.
  const projection = {
    querySelector: ((selector: string) => selector === '[data-gaga-right-rail]' ? card : card.querySelector(selector)) as Document['querySelector'],
    querySelectorAll: card.querySelectorAll.bind(card) as Document['querySelectorAll'],
    addEventListener: document.addEventListener.bind(document),
    removeEventListener: document.removeEventListener.bind(document),
    get activeElement() { return document.activeElement; }
  };
  const capability = initEngineInformationSurface({
    document: projection,
    restoreDelayMs: getInformationPreviewRestoreDelayMs(),
    ctaText: 'Baca publikasi',
    getFeedback: ({ target, title, href }) => {
      let url: URL;
      try { url = new URL(href ?? '', location.href); } catch { close(); return undefined; }
      if (url.origin !== location.origin || !['http:', 'https:'].includes(url.protocol) || target === suppressed) return undefined;
      unbind(); active = target;
      const label = card.querySelector<HTMLElement>('[data-gaga-hover-preview-title]'); if (label) label.textContent = title;
      const meta = card.querySelector<HTMLElement>('[data-gaga-hover-preview-meta]'); if (meta) meta.textContent = target.dataset.gagaPreviewMeta ?? '';
      card.hidden = matchMedia('(hover: none)').matches && !target.matches(':focus-visible');
      if (!card.hidden) {
        target.setAttribute('aria-describedby', [...new Set((target.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean).concat(id))].join(' '));
        position();
      }
      return undefined;
    }
  });
  card.dataset.gagaPreviewReady = 'true';
  const observer = new MutationObserver(() => {
    if (!card.hasAttribute('data-gaga-preview-state')) { close(); active = null; suppressed = null; }
  });
  observer.observe(card, { attributes: true, attributeFilter: ['data-gaga-preview-state'] });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !card.hidden) { suppressed = active; close(); } });
  document.addEventListener('scroll', position, { capture: true, passive: true });
  window.addEventListener('resize', position, { passive: true });
  window.addEventListener('pagehide', () => { capability.cleanup(); observer.disconnect(); }, { once: true });
}
