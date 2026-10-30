import { type SavedItem } from '@gaga/engine-runtime/reader';
import { onRuntimeEvent, requestQuickActionsSync, requestToast } from '@gaga/engine-runtime/runtime/events';
import { readJson } from '@gaga/engine-runtime/runtime/storage';
import { personalState, continueReading, personalStateChanged } from '../../lib/personal-state';
import { currentPersonalContent } from './personal-context';
import { listenToSelection } from './reader-enhancements';
import { resolveReadingScrollContext, getUnifiedScrollMetrics } from './reading-scroll';
import {
  continuityStoragePolicy,
  type ContinuityItem,
  type ContinuityState,
  type ContinuityStatus
} from '../../config/continuity';
import { i18nText, isI18nMessageKey, type I18nMessageKey } from '../../config/i18n';
import { defaultReaderLanguage, isReaderLanguage, type ReaderLanguage } from '../../config/reader';
import { storageKeys } from '../../config/systems';
import {
  removeHighlight,
  updateHighlightNote,
  removePersonalQuote,
  formatDateLocale,
  normalizeSpeechLang,
  type HighlightEntity
} from './reading-knowledge';
import { getReadingBehaviorMetrics } from './reading-behaviour';

let initialized = false;
let lastProgressWrite = 0;
let latestHeading: Pick<ContinuityItem, 'lastHeadingId' | 'lastHeadingText' | 'progress'> | null = null;
let currentLibraryTab = 'saved';

export function getActiveLibraryTab(): string {
  return currentLibraryTab;
}

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
 const current=currentPersonalContent();if(!current)return null;
 const c=current.content;return {id:c.contentIdentity,href:c.href,title:c.title,namespace:c.namespace,schemaVersion:c.schemaVersion,contentIdentity:c.contentIdentity,contentType:c.contentType};
}
const continuityStore = personalState.reading;

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
  if (progress >= continuityStoragePolicy.completionProgress) {
    // Prevent premature completion if user is just rapidly skimming through the page
    const metrics = getReadingBehaviorMetrics();
    if (metrics.state === 'SKIMMING' && metrics.totalDeepReadingMs < 12000) {
      return existing?.status ?? 'in-progress';
    }
    return 'completed';
  }
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
    createdAt: existing?.createdAt ?? existing?.updatedAt ?? updatedAt,
    namespace: article.namespace, schemaVersion: 1, contentIdentity: article.id, contentType: article.contentType,
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
  if(!personalState.removeSaved(id)){requestToast({message:'Bacaan belum terhapus. Penyimpanan tidak tersedia.',tone:'warn'});return;}
  requestQuickActionsSync({ source: 'reading-continuity' });
  renderSavedScreen();
  requestToast({ message: 'Artikel dihapus dari tersimpan', tone: 'info' });
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

function cloneHighlightItem(highlight: HighlightEntity) {
  const template = document.querySelector<HTMLTemplateElement>('[data-gaga-highlight-item-template]');
  if (!template) return null;
  const fragment = template.content.cloneNode(true) as DocumentFragment;
  const card = fragment.querySelector<HTMLElement>('[data-gaga-knowledge-item]');
  if (!card) return null;

  card.dataset.gagaHighlightId = highlight.id;
  if(highlight.resolution==='unresolved'){const status=document.createElement('small');status.dataset.gagaAnchorStatus='unresolved';status.textContent='Anchor belum tersambung; fragmen tetap tersimpan.';card.append(status);}
  const targetHref = `${highlight.articleId}#hl-${encodeURIComponent(highlight.id)}`;

  const quoteEl = card.querySelector<HTMLElement>('[data-gaga-highlight-text]');
  if (quoteEl) quoteEl.textContent = highlight.text;

  const noteContainer = card.querySelector<HTMLElement>('[data-gaga-highlight-note-container]');
  const noteText = card.querySelector<HTMLElement>('[data-gaga-highlight-note-text]');
  if (highlight.note && highlight.note.trim()) {
    if (noteContainer) noteContainer.hidden = false;
    if (noteText) noteText.textContent = highlight.note;
  }

  const articleLink = card.querySelector<HTMLAnchorElement>('[data-gaga-highlight-article]');
  const titleEl = card.querySelector<HTMLElement>('[data-gaga-highlight-title]');
  if (articleLink) articleLink.href = targetHref;
  if (titleEl) titleEl.textContent = highlight.articleTitle || 'Artikel';

  const authorEl = card.querySelector<HTMLElement>('[data-gaga-highlight-author]');
  if (authorEl) authorEl.textContent = highlight.author ? ` · ${highlight.author}` : '';

  const topicEl = card.querySelector<HTMLElement>('[data-gaga-highlight-topic]');
  if (topicEl) topicEl.textContent = highlight.topic ? ` · ${highlight.topic}` : '';

  const dateEl = card.querySelector<HTMLElement>('[data-gaga-highlight-date]');
  if (dateEl) dateEl.textContent = formatDateLocale(highlight.createdAt);

  const jumpBtn = card.querySelector<HTMLAnchorElement>('[data-gaga-highlight-jump]');
  if (jumpBtn) jumpBtn.href = targetHref;

  const copyBtn = card.querySelector<HTMLButtonElement>('[data-gaga-highlight-copy]');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const formatted = `"${highlight.text}"\n— ${highlight.articleTitle || 'Artikel'} (${highlight.author || ''})`;
      navigator.clipboard?.writeText(formatted).then(() => {
        requestToast({ message: 'Kutipan disalin ke papan klip', tone: 'ok' });
      });
    });
  }

  const listenBtn = card.querySelector<HTMLButtonElement>('[data-gaga-highlight-listen]');
  if (listenBtn) {
    listenBtn.addEventListener('click', () => {
      listenToSelection(highlight.text, normalizeSpeechLang(highlight.language || document.documentElement.lang || 'id'));
    });
  }

  const removeBtn = card.querySelector<HTMLButtonElement>('[data-gaga-highlight-remove]');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      removeHighlight(highlight.id);
      renderSavedScreen();
      requestToast({ message: 'Sorotan dihapus dari Pustaka', tone: 'info' });
    });
  }

  return fragment;
}

function cloneNoteItem(highlight: HighlightEntity) {
  const template = document.querySelector<HTMLTemplateElement>('[data-gaga-note-item-template]');
  if (!template || !highlight.note) return null;
  const fragment = template.content.cloneNode(true) as DocumentFragment;
  const card = fragment.querySelector<HTMLElement>('[data-gaga-knowledge-item]');
  if (!card) return null;

  card.dataset.gagaHighlightId = highlight.id;
  if(highlight.resolution==='unresolved'){const status=document.createElement('small');status.dataset.gagaAnchorStatus='unresolved';status.textContent='Anchor belum tersambung; fragmen tetap tersimpan.';card.append(status);}
  const targetHref = `${highlight.articleId}#hl-${encodeURIComponent(highlight.id)}`;

  const noteBody = card.querySelector<HTMLElement>('[data-gaga-note-text]');
  if (noteBody) noteBody.textContent = highlight.note;

  const contextQuote = card.querySelector<HTMLElement>('[data-gaga-note-context]');
  if (contextQuote) contextQuote.textContent = highlight.text;

  const articleLink = card.querySelector<HTMLAnchorElement>('[data-gaga-note-article]');
  const titleEl = card.querySelector<HTMLElement>('[data-gaga-note-title]');
  if (articleLink) articleLink.href = targetHref;
  if (titleEl) titleEl.textContent = `${highlight.articleTitle || 'Artikel'} · ${highlight.topic || ''}`;

  const dateEl = card.querySelector<HTMLElement>('[data-gaga-note-date]');
  if (dateEl) dateEl.textContent = formatDateLocale(highlight.createdAt);

  const jumpBtn = card.querySelector<HTMLAnchorElement>('[data-gaga-note-jump]');
  if (jumpBtn) jumpBtn.href = targetHref;

  const removeBtn = card.querySelector<HTMLButtonElement>('[data-gaga-note-remove]');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      updateHighlightNote(highlight.id, '');
      renderSavedScreen();
      requestToast({ message: 'Catatan dihapus, sorotan tetap tersimpan', tone: 'info' });
    });
  }

  return fragment;
}

function cloneQuoteItem(highlight: HighlightEntity) {
  const template = document.querySelector<HTMLTemplateElement>('[data-gaga-quote-item-template]');
  if (!template) return null;
  const fragment = template.content.cloneNode(true) as DocumentFragment;
  const card = fragment.querySelector<HTMLElement>('[data-gaga-knowledge-item]');
  if (!card) return null;

  card.dataset.gagaHighlightId = highlight.id;
  if(highlight.resolution==='unresolved'){const status=document.createElement('small');status.dataset.gagaAnchorStatus='unresolved';status.textContent='Anchor belum tersambung; fragmen tetap tersimpan.';card.append(status);}
  const targetHref = `${highlight.articleId}#hl-${encodeURIComponent(highlight.id)}`;

  const quoteText = card.querySelector<HTMLElement>('[data-gaga-quote-text]');
  if (quoteText) quoteText.textContent = highlight.text;

  const authorEl = card.querySelector<HTMLElement>('[data-gaga-quote-author]');
  if (authorEl) authorEl.textContent = highlight.author || '';

  const titleEl = card.querySelector<HTMLElement>('[data-gaga-quote-title]');
  if (titleEl) titleEl.textContent = highlight.articleTitle || 'Artikel';

  const dateEl = card.querySelector<HTMLElement>('[data-gaga-quote-date]');
  if (dateEl) dateEl.textContent = formatDateLocale(highlight.createdAt);

  const jumpBtn = card.querySelector<HTMLAnchorElement>('[data-gaga-quote-jump]');
  if (jumpBtn) jumpBtn.href = targetHref;

  const copyBtn = card.querySelector<HTMLButtonElement>('[data-gaga-quote-copy]');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const formatted = `"${highlight.text}"\n— ${highlight.author || ''}, ${highlight.articleTitle || ''}`;
      navigator.clipboard?.writeText(formatted).then(() => {
        requestToast({ message: 'Kutipan disalin ke papan klip', tone: 'ok' });
      });
    });
  }

  const remove=document.createElement('button');remove.type='button';remove.textContent='Hapus kutipan';remove.dataset.gagaQuoteRemove='';remove.addEventListener('click',()=>{if(removePersonalQuote(highlight.id))renderSavedScreen();});card.append(remove);
  return fragment;
}

function renderContinue(state: ContinuityState) {
  const section = document.querySelector<HTMLElement>('[data-gaga-continuity-continue]');
  const link = section?.querySelector<HTMLAnchorElement>('[data-gaga-continuity-continue-link]');
  const label = section?.querySelector<HTMLElement>('[data-gaga-continuity-continue-label]');
  if (!section || !link || !label) return;
  const next = continueReading(state.items)[0] as ContinuityItem | undefined;
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

function switchLibraryTab(tabId: string) {
  currentLibraryTab = tabId;
  const tabs = document.querySelectorAll<HTMLElement>('[data-gaga-library-tab]');
  const sections = document.querySelectorAll<HTMLElement>('[data-gaga-library-section]');

  tabs.forEach((tab) => {
    const isActive = tab.dataset.gagaLibraryTab === tabId;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    tab.tabIndex = isActive ? 0 : -1;
  });

  sections.forEach((sec) => {
    sec.hidden = sec.dataset.gagaLibrarySection !== tabId;
  });

  if (history.replaceState) {
    history.replaceState(null, '', `#${tabId}`);
  }
}

function renderSavedScreen() {
  const savedScreen = document.querySelector<HTMLElement>('[data-gaga-saved-page]');
  if (!savedScreen) return;

  const snapshot = personalState.snapshot();
  const saved = snapshot.saved;
  const state = snapshot.reading;
  const allHighlights = snapshot.highlights;
  const notes = snapshot.notes;
  const quotes = snapshot.quotes;

  // Update quick stats counters
  const statSaved = savedScreen.querySelector('[data-gaga-stat-saved]');
  if (statSaved) statSaved.textContent = String(saved.length);
  const statHighlights = savedScreen.querySelector('[data-gaga-stat-highlights]');
  if (statHighlights) statHighlights.textContent = String(allHighlights.length);
  const statNotes = savedScreen.querySelector('[data-gaga-stat-notes]');
  if (statNotes) statNotes.textContent = String(notes.length);
  const statQuotes = savedScreen.querySelector('[data-gaga-stat-quotes]');
  if (statQuotes) statQuotes.textContent = String(quotes.length);

  // Update tab badges
  const badgeSaved = savedScreen.querySelector('[data-gaga-badge-saved]');
  if (badgeSaved) badgeSaved.textContent = String(saved.length);
  const badgeHighlights = savedScreen.querySelector('[data-gaga-badge-highlights]');
  if (badgeHighlights) badgeHighlights.textContent = String(allHighlights.length);
  const badgeNotes = savedScreen.querySelector('[data-gaga-badge-notes]');
  if (badgeNotes) badgeNotes.textContent = String(notes.length);
  const badgeQuotes = savedScreen.querySelector('[data-gaga-badge-quotes]');
  if (badgeQuotes) badgeQuotes.textContent = String(quotes.length);
  const badgeHistory = savedScreen.querySelector('[data-gaga-badge-history]');
  if (badgeHistory) badgeHistory.textContent = String(state.items.length);

  // Section 1: Saved Bookmarks
  const bookmarksList = savedScreen.querySelector<HTMLElement>('[data-gaga-saved-bookmarks-list]') ??
    savedScreen.querySelector<HTMLElement>('[data-gaga-saved-list]');
  const bookmarksEmptyTemplate = savedScreen.querySelector<HTMLTemplateElement>('[data-gaga-saved-bookmarks-empty-template]');
  if (bookmarksList) {
    const bookmarkFragments = saved
      .map((item) => cloneSavedItem(item, state.items.find((entry) => entry.id === item.id), true))
      .filter((item): item is DocumentFragment => item instanceof DocumentFragment);
    const emptyBookmarks = bookmarksEmptyTemplate
      ? localizeGeneratedContent(bookmarksEmptyTemplate.content.cloneNode(true) as DocumentFragment)
      : null;
    bookmarksList.replaceChildren(
      ...(bookmarkFragments.length ? bookmarkFragments : emptyBookmarks ? [emptyBookmarks] : [])
    );
  }

  // Section 2: Highlights
  const highlightsList = savedScreen.querySelector<HTMLElement>('[data-gaga-highlights-list]');
  if (highlightsList) {
    const highlightFragments = allHighlights
      .map(cloneHighlightItem)
      .filter((item): item is DocumentFragment => item instanceof DocumentFragment);
    if (highlightFragments.length) {
      highlightsList.replaceChildren(...highlightFragments);
    } else {
      highlightsList.innerHTML = `
        <div class="gaga-empty-inventory" data-gaga-motion>
          <svg class="gaga-icon" viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          <p>Belum ada teks yang disorot.</p>
          <small>Pilih teks pada artikel manapun lalu tekan "Sorot" (atau tombol H) untuk menyimpan ke sini.</small>
        </div>
      `;
    }
  }

  // Section 3: Notes
  const notesList = savedScreen.querySelector<HTMLElement>('[data-gaga-notes-list]');
  if (notesList) {
    const noteFragments = notes
      .map(cloneNoteItem)
      .filter((item): item is DocumentFragment => item instanceof DocumentFragment);
    if (noteFragments.length) {
      notesList.replaceChildren(...noteFragments);
    } else {
      notesList.innerHTML = `
        <div class="gaga-empty-inventory" data-gaga-motion>
          <svg class="gaga-icon" viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M19 3H4.99C3.89 3 3 3.9 3 5v14c0 1.1.89 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
          <p>Belum ada catatan refleksi tersimpan.</p>
          <small>Tambahkan catatan saat menyorot teks untuk merangkum wawasan Anda.</small>
        </div>
      `;
    }
  }

  // Section 4: Quotes
  const quotesList = savedScreen.querySelector<HTMLElement>('[data-gaga-quotes-list]');
  if (quotesList) {
    const quoteFragments = quotes
      .map(cloneQuoteItem)
      .filter((item): item is DocumentFragment => item instanceof DocumentFragment);
    if (quoteFragments.length) {
      quotesList.replaceChildren(...quoteFragments);
    } else {
      quotesList.innerHTML = `
        <div class="gaga-empty-inventory" data-gaga-motion>
          <svg class="gaga-icon" viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>
          <p>Belum ada kutipan pilihan.</p>
          <small>Simpan fragmen sebagai kutipan melalui aksi seleksi lainnya.</small>
        </div>
      `;
    }
  }

  // Section 5: Reading History
  const progressList = savedScreen.querySelector<HTMLElement>('[data-gaga-continuity-status-inventory]');
  const progressEmptyTemplate = savedScreen.querySelector<HTMLTemplateElement>('[data-gaga-continuity-status-empty-template]');
  if (progressList) {
    const progressItems = state.items;
    const progressFragments = progressItems
      .map((item) => cloneSavedItem(item, item, false))
      .filter((item): item is DocumentFragment => item instanceof DocumentFragment);
    const emptyProgress = progressEmptyTemplate
      ? localizeGeneratedContent(progressEmptyTemplate.content.cloneNode(true) as DocumentFragment)
      : null;
    progressList.replaceChildren(
      ...(progressFragments.length ? progressFragments : emptyProgress ? [emptyProgress] : [])
    );
  }

  for(const tab of savedScreen.querySelectorAll<HTMLElement>('[data-gaga-library-tab]')){const domain=tab.dataset.gagaLibraryTab;tab.hidden=domain==='highlights'?!allHighlights.length:domain==='notes'?!notes.length:domain==='quotes'?!quotes.length:domain==='history'?!state.items.length:false;}
  if(savedScreen.querySelector<HTMLElement>('[data-gaga-library-tab].is-active')?.hidden)switchLibraryTab('saved');
  renderContinue(state);
}

function wireLibraryTabs() {
  const nav = document.querySelector<HTMLElement>('[data-gaga-library-nav]');
  if (!nav) return;

  nav.addEventListener('click', (e) => {
    const tabBtn = (e.target as HTMLElement).closest<HTMLElement>('[data-gaga-library-tab]');
    if (!tabBtn) return;
    const tabId = tabBtn.dataset.gagaLibraryTab;
    if (tabId) switchLibraryTab(tabId);
  });

  nav.addEventListener('keydown', (event) => {
    const tabs = [...nav.querySelectorAll<HTMLElement>('[data-gaga-library-tab]')].filter(tab=>!tab.hidden);
    const index = tabs.findIndex(tab => tab === event.target);
    if (index < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
      : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    switchLibraryTab(tabs[next].dataset.gagaLibraryTab!);
    tabs[next].focus({ preventScroll: true });
    tabs[next].scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });

  // Check initial hash
  const initialHash = location.hash.replace('#', '');
  if (['saved', 'highlights', 'notes', 'quotes', 'history'].includes(initialHash)) {
    const tab=nav.querySelector<HTMLElement>('[data-gaga-library-tab="'+initialHash+'"]');
    if(tab&&!tab.hidden)switchLibraryTab(initialHash);
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

    const clearHistory = target?.closest<HTMLElement>('[data-gaga-continuity-clear-history]');
    if (clearHistory) {
      writeContinuityState([], undefined);
      latestHeading = null;
      renderArticleControls();
      renderSavedScreen();
      requestToast({ message: i18nText('continuity.historyCleared', currentReaderLanguage()), tone: 'info' });
      return;
    }

    const dismiss = target?.closest('[data-gaga-continuity-resume-dismiss]');
    if (dismiss) {
      const resume = document.querySelector<HTMLElement>('[data-gaga-continuity-resume]');
      if (resume) resume.hidden = true;
    }
  });

  window.addEventListener(personalStateChanged, () => {
    renderSavedScreen();
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
 const current=currentArticle();if(!current)return;
 const existing=readContinuityState().items.find(item=>item.id===current.id);
 // A visit updates history, retaining the meaningful continuation position and completion.
 upsertCurrent(existing ? {progress:existing.progress,lastHeadingId:existing.lastHeadingId,lastHeadingText:existing.lastHeadingText} : {progress:0,status:'in-progress'});
 let interacted=false;
 const update=()=>{if(!interacted)return;const metrics=getUnifiedScrollMetrics();latestHeading={...latestHeading,progress:Math.max(0,Math.min(100,metrics.percentage))};if(performance.now()-lastProgressWrite>=continuityStoragePolicy.progressWriteIntervalMs||latestHeading.progress>=continuityStoragePolicy.completionProgress){lastProgressWrite=performance.now();upsertCurrent(latestHeading);}};
 const bind=()=>resolveReadingScrollContext()?.scrollContext.addChangeListener(update);
 let unbind=bind();
 onRuntimeEvent('layoutChanged',()=>{unbind?.();unbind=bind();});
 document.addEventListener('wheel',()=>{interacted=true;},{passive:true});document.addEventListener('touchmove',()=>{interacted=true;},{passive:true});document.addEventListener('keydown',e=>{if((e.target as Element)?.closest('input,textarea,select,button,[contenteditable]'))return;if(['PageDown','PageUp','ArrowDown','ArrowUp','End','Home',' '].includes(e.key))interacted=true;});
 onRuntimeEvent('tocActiveChanged',detail=>{latestHeading={lastHeadingId:detail.id,lastHeadingText:detail.label,progress:Math.max(0,Math.min(100,detail.progress))};update();});
 window.addEventListener('pagehide',()=>{if(interacted&&latestHeading)upsertCurrent(latestHeading);unbind?.();},{once:true});
}

export function initReadingContinuity() {
  if (initialized) return;
  initialized = true;
  renderArticleControls();
  renderSavedScreen();
  wireLibraryTabs();
  wireClicks();
  wireLanguageChanges();
  wireProgress();
  window.addEventListener('storage',()=>{renderArticleControls();renderSavedScreen();});
}
