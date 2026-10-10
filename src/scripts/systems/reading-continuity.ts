import { isSavedItem, type SavedItem } from '@gaga/engine-web/reader';
import { onRuntimeEvent, requestQuickActionsSync } from '@gaga/engine-web/runtime/events';
import { readArray, readJson, writeJson } from '@gaga/engine-web/runtime/storage';
import { createReadingCollectionStore } from '@gaga/engine-web/runtime/reading-collection';
import {
  continuityStoragePolicy,
  isContinuityStatus,
  isLocalContinuityHref,
  type ContinuityItem,
  type ContinuityState,
  type ContinuityStatus
} from '../../config/continuity';
import { i18nText, isI18nMessageKey, type I18nMessageKey } from '../../config/i18n';
import { defaultReaderLanguage, isReaderLanguage, type ReaderLanguage } from '../../config/reader';
import { storageKeys } from '../../config/systems';

let initialized = false;
let lastProgressWrite = 0;
let latestHeading: Pick<ContinuityItem, 'lastHeadingId' | 'lastHeadingText' | 'progress'> | null = null;

const statusMessageKeys = {
  'read-next': 'reading.statusReadNext',
  'in-progress': 'reading.statusInProgress',
  reference: 'reading.statusReference',
  completed: 'reading.statusCompleted'
} as const satisfies Record<ContinuityStatus, I18nMessageKey>;

function currentReaderLanguage(): ReaderLanguage {
  const projected = document.body.dataset.gagaLanguage;
  if (isReaderLanguage(projected)) return projected;
  return readJson(storageKeys.language, defaultReaderLanguage, isReaderLanguage);
}

function statusLabel(status: ContinuityStatus) {
  return i18nText(statusMessageKeys[status], currentReaderLanguage());
}

function localizeGeneratedContent(root: ParentNode) {
  const language = currentReaderLanguage();
  for (const node of root.querySelectorAll<HTMLElement>('[data-gaga-i18n-key]')) {
    const key = node.dataset.gagaI18nKey;
    if (!isI18nMessageKey(key)) continue;
    const text = i18nText(key, language);
    if (node.dataset.gagaI18nTarget === 'aria') node.setAttribute('aria-label', text);
    else node.textContent = text;
  }
  return root;
}

function nowIso() {
  return new Date().toISOString();
}

function currentArticle() {
  const frame = document.querySelector<HTMLElement>('[data-gaga-app-frame]');
  if (!frame || frame.dataset.gagaContentKind !== 'article') return null;
  return {
    id: frame.dataset.gagaPageId ?? location.pathname,
    href: location.pathname,
    title: frame.dataset.gagaPageTitle ?? document.title
  };
}

const continuityStore = createReadingCollectionStore<ContinuityStatus>({
  storageKey: storageKeys.continuity,
  isStatus: isContinuityStatus,
  validateHref: isLocalContinuityHref,
  maxItems: continuityStoragePolicy.maxItems,
  retentionMs: continuityStoragePolicy.retentionDays * 24 * 60 * 60 * 1000
});

function readContinuityState(): ContinuityState {
  return continuityStore.read();
}

function writeContinuityState(items: ContinuityItem[], currentId?: string) {
  return continuityStore.write(items, currentId);
}

function destinationFor(item: ContinuityItem) {
  if (!item.lastHeadingId) return item.href;
  const url = new URL(item.href, location.origin);
  url.hash = item.lastHeadingId;
  return url.pathname + url.hash;
}

function statusFromProgress(existing: ContinuityItem | undefined, progress: number): ContinuityStatus {
  if (progress >= continuityStoragePolicy.completionProgress) return 'completed';
  if (existing?.status === 'reference' || existing?.status === 'completed') return existing.status;
  if (progress > 2) return 'in-progress';
  return existing?.status ?? 'in-progress';
}

function upsertCurrent(values: Partial<ContinuityItem>) {
  const article = currentArticle();
  if (!article) return;
  const state = readContinuityState();
  const existing = state.items.find((item) => item.id === article.id);
  const progress = Math.max(0, Math.min(100, values.progress ?? existing?.progress ?? 0));
  const status = statusFromProgress(existing, progress);
  const updatedAt = nowIso();
  const next: ContinuityItem = {
    id: article.id,
    href: article.href,
    title: article.title,
    progress,
    status,
    updatedAt,
    ...(existing?.lastHeadingId ? { lastHeadingId: existing.lastHeadingId } : {}),
    ...(existing?.lastHeadingText ? { lastHeadingText: existing.lastHeadingText } : {}),
    ...values,
    ...(status === 'completed' ? { completedAt: existing?.completedAt ?? updatedAt } : {})
  };
  writeContinuityState([next, ...state.items.filter((item) => item.id !== article.id)], article.id);
  renderArticleControls(next);
  renderSavedScreen();
}

function removeSavedBookmark(id: string) {
  const saved = readArray(storageKeys.saved, isSavedItem);
  writeJson(storageKeys.saved, saved.filter((item) => item.id !== id));
  requestQuickActionsSync({ source: 'reading-continuity' });
  renderSavedScreen();
}

function formatMeta(item: ContinuityItem) {
  const progress = Math.round(item.progress);
  const heading = item.lastHeadingText ? ' · ' + item.lastHeadingText : '';
  return statusLabel(item.status) + ' · ' + progress + '%' + heading;
}

function renderArticleControls(item?: ContinuityItem) {
  const controls = document.querySelector<HTMLElement>('[data-gaga-continuity-current]');
  const article = currentArticle();
  if (!controls || !article) return;
  const current = item ?? readContinuityState().items.find((entry) => entry.id === article.id);
  controls.hidden = false;
  const summary = controls.querySelector<HTMLElement>('[data-gaga-continuity-current-summary]');
  if (summary) {
    const activeStatus = current?.status ?? 'unset';
    for (const statusLabel of summary.querySelectorAll<HTMLElement>('[data-gaga-continuity-current-summary-status]')) {
      statusLabel.hidden = statusLabel.dataset.gagaContinuityCurrentSummaryStatus !== activeStatus;
    }
  }

  const resume = document.querySelector<HTMLElement>('[data-gaga-continuity-resume]');
  if (!resume) return;
  const link = resume.querySelector<HTMLAnchorElement>('[data-gaga-continuity-resume-link]');
  const title = resume.querySelector<HTMLElement>('[data-gaga-continuity-resume-title]');
  const heading = resume.querySelector<HTMLElement>('[data-gaga-continuity-resume-heading]');
  const canResume = !!current &&
    current.progress > 5 &&
    current.status !== 'completed' &&
    !!current.lastHeadingId &&
    current.lastHeadingId !== '_top';
  resume.hidden = !canResume;
  if (!canResume || !current || !link || !title || !heading) return;
  link.href = destinationFor(current);
  link.dataset.gagaPreviewTitle = current.title;
  link.dataset.gagaPreviewHref = current.href;
  link.dataset.gagaPreviewSnippet = formatMeta(current);
  link.dataset.gagaPreviewTopics = 'Reader / Continuity';
  link.dataset.gagaPreviewTags = 'resume / local';
  link.dataset.gagaPreviewReadTime = String(Math.round(current.progress)) + '% ' + i18nText('continuity.readSuffix', currentReaderLanguage());
  link.dataset.gagaPreviewAuthor = 'Consumer Signature';
  title.textContent = current.title;
  heading.textContent = current.lastHeadingText ?? i18nText('continuity.resumeAction', currentReaderLanguage());
}

function cloneSavedItem(item: ContinuityItem | SavedItem, statusItem: ContinuityItem | undefined, saved: boolean) {
  const template = document.querySelector<HTMLTemplateElement>('[data-gaga-saved-item-template]');
  if (!template) return null;
  const fragment = template.content.cloneNode(true) as DocumentFragment;
  const article = fragment.querySelector<HTMLElement>('[data-gaga-continuity-item]');
  const link = fragment.querySelector<HTMLAnchorElement>('.gaga-saved-link');
  const label = fragment.querySelector<HTMLElement>('[data-gaga-saved-title]');
  const kind = fragment.querySelector<HTMLElement>('[data-gaga-saved-kind]');
  const meta = fragment.querySelector<HTMLElement>('[data-gaga-continuity-meta]');
  if (!article || !link || !label || !meta) return null;
  article.dataset.gagaContinuityId = item.id;
  link.href = statusItem ? destinationFor(statusItem) : item.href;
  link.dataset.gagaPreviewTitle = item.title;
  link.dataset.gagaPreviewHref = item.href;
  link.dataset.gagaPreviewSnippet = statusItem ? formatMeta(statusItem) : i18nText('continuity.savedBookmarkMeta', currentReaderLanguage());
  link.dataset.gagaPreviewTopics = 'Reader / Inventory';
  link.dataset.gagaPreviewTags = statusItem ? statusItem.status + ' / local' : 'saved / local';
  link.dataset.gagaPreviewReadTime = statusItem
    ? String(Math.round(statusItem.progress)) + '% ' + i18nText('continuity.readSuffix', currentReaderLanguage())
    : i18nText('continuity.localBrowser', currentReaderLanguage());
  link.dataset.gagaPreviewAuthor = 'Consumer Signature';
  label.textContent = item.title;
  if (kind) kind.textContent = saved
    ? i18nText('continuity.kindBookmark', currentReaderLanguage())
    : statusItem ? statusLabel(statusItem.status) : '';
  meta.textContent = statusItem ? formatMeta(statusItem) : i18nText('continuity.savedBookmarkMeta', currentReaderLanguage());
  const savedRemove = fragment.querySelector<HTMLElement>('[data-gaga-saved-remove]');
  if (savedRemove) savedRemove.hidden = !saved;
  localizeGeneratedContent(fragment);
  return fragment;
}

function renderContinue(state: ContinuityState) {
  const section = document.querySelector<HTMLElement>('[data-gaga-continuity-continue]');
  const link = section?.querySelector<HTMLAnchorElement>('[data-gaga-continuity-continue-link]');
  const label = section?.querySelector<HTMLElement>('[data-gaga-continuity-continue-label]');
  if (!section || !link || !label) return;
  const next = state.items.find((item) => item.status === 'in-progress') ??
    state.items.find((item) => item.status === 'read-next');
  section.hidden = !next;
  if (!next) return;
  link.href = destinationFor(next);
  link.dataset.gagaPreviewTitle = next.title;
  link.dataset.gagaPreviewHref = next.href;
  link.dataset.gagaPreviewSnippet = formatMeta(next);
  link.dataset.gagaPreviewTopics = 'Reader · Continuity';
  link.dataset.gagaPreviewTags = 'continue · local';
  link.dataset.gagaPreviewReadTime = String(Math.round(next.progress)) + '% ' + i18nText('continuity.readSuffix', currentReaderLanguage());
  link.dataset.gagaPreviewAuthor = 'Consumer Signature';
  label.textContent = next.title + ' · ' + formatMeta(next);
}

function renderSavedScreen() {
  const bookmarksList = document.querySelector<HTMLElement>('[data-gaga-saved-bookmarks-list]') ??
    document.querySelector<HTMLElement>('[data-gaga-saved-list]');
  const progressList = document.querySelector<HTMLElement>('[data-gaga-continuity-status-inventory]');
  if (!bookmarksList && !progressList) return;
  const itemTemplate = document.querySelector<HTMLTemplateElement>('[data-gaga-saved-item-template]');
  const bookmarksEmptyTemplate = document.querySelector<HTMLTemplateElement>('[data-gaga-saved-bookmarks-empty-template]');
  const progressEmptyTemplate = document.querySelector<HTMLTemplateElement>('[data-gaga-continuity-status-empty-template]');
  if (!itemTemplate) return;

  const saved = readArray(storageKeys.saved, isSavedItem);
  const state = readContinuityState();
  const savedIds = new Set(saved.map((item) => item.id));
  const progressItems = state.items.filter((item) => !savedIds.has(item.id));
  const bookmarkFragments = saved
    .map((item) => cloneSavedItem(item, state.items.find((entry) => entry.id === item.id), true))
    .filter((item): item is DocumentFragment => item instanceof DocumentFragment);
  const progressFragments = progressItems
    .map((item) => cloneSavedItem(item, item, false))
    .filter((item): item is DocumentFragment => item instanceof DocumentFragment);

  renderContinue(state);
  if (bookmarksList) {
    const emptyBookmarks = bookmarksEmptyTemplate
      ? localizeGeneratedContent(bookmarksEmptyTemplate.content.cloneNode(true) as DocumentFragment)
      : null;
    bookmarksList.replaceChildren(
      ...(bookmarkFragments.length ? bookmarkFragments : emptyBookmarks ? [emptyBookmarks] : [])
    );
  }
  if (progressList) {
    const emptyProgress = progressEmptyTemplate
      ? localizeGeneratedContent(progressEmptyTemplate.content.cloneNode(true) as DocumentFragment)
      : null;
    progressList.replaceChildren(
      ...(progressFragments.length ? progressFragments : emptyProgress ? [emptyProgress] : [])
    );
  }
}

function wireClicks() {
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const savedRemove = target?.closest<HTMLElement>('[data-gaga-saved-remove]');
    if (savedRemove) {
      const itemRoot = savedRemove.closest<HTMLElement>('[data-gaga-continuity-item]');
      if (itemRoot?.dataset.gagaContinuityId) removeSavedBookmark(itemRoot.dataset.gagaContinuityId);
      return;
    }

    const dismiss = target?.closest('[data-gaga-continuity-resume-dismiss]');
    if (dismiss) {
      const resume = document.querySelector<HTMLElement>('[data-gaga-continuity-resume]');
      if (resume) resume.hidden = true;
    }
  });
}

function wireLanguageChanges() {
  document.addEventListener('change', (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target?.matches('[data-gaga-language-option]')) return;
    queueMicrotask(() => {
      renderArticleControls();
      renderSavedScreen();
    });
  });
}

function wireProgress() {
  onRuntimeEvent('tocActiveChanged', (detail) => {
    latestHeading = {
      lastHeadingId: detail.id,
      lastHeadingText: detail.label,
      progress: Math.max(0, Math.min(100, detail.progress))
    };
    const shouldWrite = performance.now() - lastProgressWrite >= continuityStoragePolicy.progressWriteIntervalMs ||
      latestHeading.progress >= continuityStoragePolicy.completionProgress;
    if (!shouldWrite) return;
    lastProgressWrite = performance.now();
    upsertCurrent(latestHeading);
  });
  window.addEventListener('pagehide', () => {
    if (latestHeading) upsertCurrent(latestHeading);
  });
}

export function initReadingContinuity() {
  if (initialized) return;
  initialized = true;
  renderArticleControls();
  renderSavedScreen();
  wireClicks();
  wireLanguageChanges();
  wireProgress();
}
