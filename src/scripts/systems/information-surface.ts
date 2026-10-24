import { initInformationSurface as initEngineInformationSurface } from '@gaga/engine-runtime/runtime/information-surface';
import { requestFeedback, requestOutline } from '@gaga/engine-runtime/runtime/events';
import { getInformationPreviewRestoreDelayMs } from '../../config/systems';

let initialized = false;

function syncDualHoverPreviewSurface() {
  const getField = (name: string) => document.querySelector<HTMLElement>(`[data-gaga-info-field="${name}"]`);
  const defaults = {
    previewTitle: getField('previewTitle')?.textContent?.trim(),
    contextMeta: getField('contextMeta')?.textContent?.trim(),
    publishedDate: getField('publishedDate')?.textContent?.trim()
  };

  const card = document.querySelector<HTMLElement>('[data-gaga-hover-preview-card]');
  const cardMeta = document.querySelector<HTMLElement>('[data-gaga-hover-preview-meta]');
  const cardTitle = document.querySelector<HTMLElement>('[data-gaga-hover-preview-title]');
  const cardSnippet = document.querySelector<HTMLElement>('[data-gaga-hover-preview-snippet]');

  const island = document.querySelector<HTMLElement>('[data-gaga-action-runtime]');
  const statusBadge = document.querySelector<HTMLElement>('[data-gaga-island-status-badge]');
  const peekTitle = document.querySelector<HTMLElement>('[data-gaga-island-peek-title]');

  let restoreTimer = 0;
  let savedBadgeText: string | null = null;
  let savedPeekText: string | null = null;

  const applyExtended = (target: HTMLElement) => {
    window.clearTimeout(restoreTimer);

    const previewTitle = target.dataset.gagaPreviewTitle?.trim() || target.textContent?.trim() || '';
    const previewType = target.dataset.gagaPreviewType?.trim() || '';
    const previewTopics = target.dataset.gagaPreviewTopics?.trim() || '';
    const previewReadTime = target.dataset.gagaPreviewReadTime?.trim() || '';
    const previewDate = target.dataset.gagaPreviewDate?.trim() || '';
    const previewMeta = target.dataset.gagaPreviewMeta?.trim()
      || [previewType, previewTopics, previewDate, previewReadTime].filter(Boolean).join(' · ');
    const previewSnippet = target.dataset.gagaPreviewSnippet?.trim() || '';

    // 1. Legacy info field sync (if present)
    const titleEl = getField('previewTitle');
    if (titleEl && previewTitle) titleEl.textContent = previewTitle;
    const metaEl = getField('contextMeta');
    if (metaEl && previewMeta) metaEl.textContent = previewMeta;
    const dateEl = getField('publishedDate');
    if (dateEl && previewDate) dateEl.textContent = previewDate;

    // 2. Gaga Dynamic Notch Island status sync
    if (statusBadge) {
      if (savedBadgeText === null) {
        savedBadgeText = statusBadge.textContent?.trim() ?? statusBadge.dataset.gagaDefaultBadge ?? 'INDEKS';
      }
      const badgeLabel = previewType
        ? `PRATINJAU · ${previewType.toUpperCase()}`
        : previewTopics
          ? `PRATINJAU · ${previewTopics.split(',')[0].trim().toUpperCase()}`
          : 'PRATINJAU';
      statusBadge.textContent = badgeLabel;
    }
    if (peekTitle && previewTitle) {
      if (savedPeekText === null) {
        savedPeekText = peekTitle.textContent?.trim() ?? '';
      }
      peekTitle.textContent = previewTitle;
    }
    if (island) {
      island.dataset.gagaIntent = 'aware';
    }

    // 3. Minimalist floating summary card sync
    if (card && previewTitle && (previewSnippet || previewMeta)) {
      if (cardMeta) {
        cardMeta.textContent = previewMeta || 'Publikasi PakRPP';
        cardMeta.toggleAttribute('hidden', !previewMeta);
      }
      if (cardTitle) {
        cardTitle.textContent = previewTitle;
      }
      if (cardSnippet) {
        cardSnippet.textContent = previewSnippet;
        cardSnippet.toggleAttribute('hidden', !previewSnippet);
      }
      card.removeAttribute('hidden');
    }
  };

  const scheduleRestore = () => {
    window.clearTimeout(restoreTimer);
    restoreTimer = window.setTimeout(() => {
      if (card) {
        card.setAttribute('hidden', '');
      }
      if (statusBadge && savedBadgeText !== null) {
        statusBadge.textContent = statusBadge.dataset.gagaDefaultBadge || savedBadgeText;
        savedBadgeText = null;
      }
      if (peekTitle && savedPeekText !== null) {
        peekTitle.textContent = savedPeekText;
        savedPeekText = null;
      }
      if (island) {
        delete island.dataset.gagaIntent;
      }
      const titleEl = getField('previewTitle');
      if (titleEl && defaults.previewTitle) titleEl.textContent = defaults.previewTitle;
      const metaEl = getField('contextMeta');
      if (metaEl && defaults.contextMeta) metaEl.textContent = defaults.contextMeta;
      const dateEl = getField('publishedDate');
      if (dateEl && defaults.publishedDate) dateEl.textContent = defaults.publishedDate;
    }, 220);
  };

  document.addEventListener('pointerover', (event) => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-gaga-preview]')
      : null;
    if (target) {
      applyExtended(target);
    }
  }, { passive: true });

  document.addEventListener('pointerout', (event) => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-gaga-preview]')
      : null;
    if (!target) return;
    const related = event.relatedTarget instanceof Element
      ? event.relatedTarget.closest<HTMLElement>('[data-gaga-preview]')
      : null;
    if (related !== target) {
      scheduleRestore();
    }
  }, { passive: true });

  document.addEventListener('focusin', (event) => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-gaga-preview]')
      : null;
    if (target) applyExtended(target);
  });

  document.addEventListener('focusout', (event) => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-gaga-preview]')
      : null;
    if (target) scheduleRestore();
  });
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
  syncDualHoverPreviewSurface();
}
