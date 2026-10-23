import { initInformationSurface as initEngineInformationSurface } from '@gaga/engine-web/runtime/information-surface';
import { requestFeedback, requestOutline } from '@gaga/engine-web/runtime/events';
import { getInformationPreviewRestoreDelayMs } from '../../config/systems';

let initialized = false;

function syncExtendedPreviewFields() {
  const getField = (name: string) => document.querySelector<HTMLElement>(`[data-gaga-info-field="${name}"]`);
  const defaults = {
    previewTitle: getField('previewTitle')?.textContent?.trim(),
    contextMeta: getField('contextMeta')?.textContent?.trim(),
    publishedDate: getField('publishedDate')?.textContent?.trim()
  };

  const applyExtended = (target: HTMLElement) => {
    const titleEl = getField('previewTitle');
    if (titleEl && target.dataset.gagaPreviewTitle) {
      titleEl.textContent = target.dataset.gagaPreviewTitle;
    }
    const metaEl = getField('contextMeta');
    if (metaEl && target.dataset.gagaPreviewMeta) {
      metaEl.textContent = target.dataset.gagaPreviewMeta;
    }
    const dateEl = getField('publishedDate');
    if (dateEl && target.dataset.gagaPreviewDate) {
      dateEl.textContent = target.dataset.gagaPreviewDate;
    }
  };

  document.addEventListener('pointerover', (event) => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-gaga-preview]')
      : null;
    if (target) applyExtended(target);
  }, { passive: true });

  document.addEventListener('focusin', (event) => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-gaga-preview]')
      : null;
    if (target) applyExtended(target);
  });

  const rail = document.querySelector<HTMLElement>('[data-gaga-right-rail]');
  if (rail) {
    const observer = new MutationObserver(() => {
      if (!rail.hasAttribute('data-gaga-preview-state')) {
        const titleEl = getField('previewTitle');
        if (titleEl && defaults.previewTitle) titleEl.textContent = defaults.previewTitle;
        const metaEl = getField('contextMeta');
        if (metaEl && defaults.contextMeta) metaEl.textContent = defaults.contextMeta;
        const dateEl = getField('publishedDate');
        if (dateEl && defaults.publishedDate) dateEl.textContent = defaults.publishedDate;
      }
    });
    observer.observe(rail, { attributes: true, attributeFilter: ['data-gaga-preview-state'] });
  }
}

export function initInformationSurface() {
  if (initialized) return;
  initialized = true;
  initEngineInformationSurface({
    ctaText: 'Baca Publikasi',
    restoreDelayMs: getInformationPreviewRestoreDelayMs(),
    requestFeedback,
    requestOutline,
    getFeedback: ({ title }) => ({
      label: `Preview ${title}`,
      x: window.innerWidth - 220,
      y: 64,
      source: 'information-preview'
    })
  });
  syncExtendedPreviewFields();
}
