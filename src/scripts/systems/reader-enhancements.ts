import {
  readAllHighlights,
  saveHighlight,
  removeHighlight,
  updateHighlightNote,
  resolveContentLanguage,
  type HighlightEntity,
  type HighlightLocation
} from './reading-knowledge';
import { requestToast } from '@gaga/engine-web/runtime/events';
import { registerSiteCommand } from './site-commands';

type SpeechMode = 'article' | 'selection';
type SpeechState = 'idle' | 'playing' | 'paused' | 'completed' | 'error';

interface SpeakerController {
  state: SpeechState;
  mode: SpeechMode;
  currentText: string;
  rate: number;
  voice: SpeechSynthesisVoice | null;
  playSelection: (text: string, lang: string) => void;
  playArticle: (elements: HTMLElement[], lang: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setRate: (rate: number) => void;
  setVoice: (voice: SpeechSynthesisVoice) => void;
}

let activeSpeaker: SpeakerController | null = null;
let speechDockEl: HTMLElement | null = null;
let selectionMenuEl: HTMLElement | null = null;
let activeHighlightPopupEl: HTMLElement | null = null;

function getArticleMetadata(article: HTMLElement) {
  const route =
    article.dataset.gagaArticleRoute ||
    (article.closest('[data-gaga-app-frame]') as HTMLElement)?.dataset.gagaPageId ||
    location.pathname;

  const title =
    article.dataset.gagaArticleTitle ||
    article.querySelector('h1')?.textContent?.trim() ||
    document.title.replace(/•.*$/, '').trim();

  const author =
    article.dataset.gagaArticleAuthor ||
    article.querySelector('[class*="author-name"]')?.textContent?.trim() ||
    'Consumer Signature';

  const topic =
    article.dataset.gagaArticleTopic ||
    article.querySelector('[class*="kicker"], [class*="breadcrumb"] a:last-of-type')?.textContent?.trim() ||
    'Arsitektur Produk';

  const language = resolveContentLanguage(article);

  return { route, title, author, topic, language };
}

function ensureBlockIds(container: HTMLElement) {
  const blocks = container.querySelectorAll<HTMLElement>(
    'p, blockquote, li, h2, h3, h4, [data-gaga-content-block]'
  );
  blocks.forEach((el, index) => {
    if (!el.dataset.gagaBlockId) {
      el.dataset.gagaBlockId = el.id ? `block-${el.id}` : `p-${index}`;
    }
  });
}

function findSelectionLocation(range: Range, container: HTMLElement): HighlightLocation | null {
  const startBlock = range.startContainer.nodeType === Node.ELEMENT_NODE
    ? (range.startContainer as HTMLElement).closest<HTMLElement>('[data-gaga-block-id]')
    : range.startContainer.parentElement?.closest<HTMLElement>('[data-gaga-block-id]');

  const endBlock = range.endContainer.nodeType === Node.ELEMENT_NODE
    ? (range.endContainer as HTMLElement).closest<HTMLElement>('[data-gaga-block-id]')
    : range.endContainer.parentElement?.closest<HTMLElement>('[data-gaga-block-id]');

  if (!startBlock || startBlock !== endBlock) {
    const fallbackBlock = (range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? (range.commonAncestorContainer as HTMLElement)
      : range.commonAncestorContainer.parentElement)?.closest<HTMLElement>('[data-gaga-block-id]');
    if (!fallbackBlock) return null;
  }

  const targetBlock = startBlock || (container.querySelector('[data-gaga-block-id]') as HTMLElement);
  if (!targetBlock) return null;

  const blockId = targetBlock.dataset.gagaBlockId || 'block-0';
  const blockText = targetBlock.textContent || '';
  const exactText = range.toString();

  const preRange = range.cloneRange();
  preRange.selectNodeContents(targetBlock);
  try {
    preRange.setEnd(range.startContainer, range.startOffset);
  } catch {
    // Offset boundary safe fallback
  }
  const startOffset = preRange.toString().length;
  const endOffset = startOffset + exactText.length;

  const contextLen = 32;
  const prefix = blockText.slice(Math.max(0, startOffset - contextLen), startOffset);
  const suffix = blockText.slice(endOffset, endOffset + contextLen);

  return {
    blockId,
    startOffset,
    endOffset,
    prefix,
    suffix,
    selector: `[data-gaga-block-id="${blockId}"]`
  };
}

/* =========================================================================
   HIGHLIGHT CONTINUITY & RESTORATION
   ========================================================================= */

function restoreArticleHighlights(article: HTMLElement) {
  const { route } = getArticleMetadata(article);
  const allHighlights = readAllHighlights();
  const articleHighlights = allHighlights.filter((h) => {
    return h.articleId === route || h.articleId === location.pathname || route.startsWith(h.articleId);
  });

  if (!articleHighlights.length) return;

  for (const h of articleHighlights) {
    if (article.querySelector(`[data-gaga-highlight-id="${h.id}"]`)) continue;

    let targetBlock: HTMLElement | null = null;
    if (h.location?.blockId) {
      targetBlock = article.querySelector<HTMLElement>(`[data-gaga-block-id="${h.location.blockId}"]`);
    }

    if (!targetBlock) {
      const allBlocks = article.querySelectorAll<HTMLElement>('[data-gaga-block-id], p, blockquote, li');
      for (const b of allBlocks) {
        if (b.textContent && b.textContent.includes(h.text)) {
          targetBlock = b;
          break;
        }
      }
    }

    if (!targetBlock) continue;

    applyHighlightToElement(targetBlock, h);
  }

  // Handle jump back from Library: #hl-{id}
  if (location.hash.startsWith('#hl-')) {
    const targetId = location.hash.replace('#hl-', '');
    setTimeout(() => {
      const mark = article.querySelector<HTMLElement>(`[data-gaga-highlight-id="${targetId}"]`);
      if (mark) {
        mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        mark.classList.add('gaga-highlight-mark--active');
        mark.focus?.();
        requestToast({
          message: 'Sorotan dipulihkan dari Pustaka',
          tone: 'ok',
          x: window.innerWidth / 2,
          y: 60
        });
        setTimeout(() => {
          mark.classList.remove('gaga-highlight-mark--active');
        }, 3200);
      }
    }, 200);
  }
}

function applyHighlightToElement(element: HTMLElement, highlight: HighlightEntity) {
  const text = highlight.text.trim();
  if (!text) return;

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let textNode: Text | null = null;
  while ((textNode = walker.nextNode() as Text | null)) {
    if (textNode.parentElement?.classList.contains('gaga-highlight-mark')) continue;

    const idx = textNode.nodeValue?.indexOf(text) ?? -1;
    if (idx !== -1 && textNode.nodeValue) {
      const matchRange = document.createRange();
      matchRange.setStart(textNode, idx);
      matchRange.setEnd(textNode, idx + text.length);

      const mark = document.createElement('mark');
      mark.className = 'gaga-highlight-mark';
      mark.dataset.gagaHighlightId = highlight.id;
      mark.id = `hl-${highlight.id}`;
      mark.tabIndex = 0;
      mark.setAttribute('role', 'mark');
      mark.setAttribute(
        'aria-label',
        highlight.note ? `Sorotan dengan catatan: ${highlight.note}` : 'Teks yang disorot'
      );
      if (highlight.note) {
        mark.dataset.gagaHasNote = 'true';
      }

      try {
        matchRange.surroundContents(mark);
        wireHighlightClick(mark, highlight);
      } catch {
        // Fallback for non-simple boundary range
      }
      break;
    }
  }
}

function wireHighlightClick(mark: HTMLElement, highlight: HighlightEntity) {
  mark.addEventListener('click', (e) => {
    e.stopPropagation();
    showHighlightPopup(mark, highlight);
  });
  mark.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showHighlightPopup(mark, highlight);
    }
  });
}

function showHighlightPopup(mark: HTMLElement, highlight: HighlightEntity) {
  closeHighlightPopup();
  closeSelectionMenu();

  const popup = document.createElement('div');
  popup.className = 'gaga-highlight-popup';
  popup.setAttribute('role', 'dialog');
  popup.setAttribute('aria-label', 'Kelola Sorotan');

  const rect = mark.getBoundingClientRect();
  const top = rect.bottom + window.scrollY + 8;
  const left = Math.max(16, Math.min(window.innerWidth - 300, rect.left + window.scrollX));

  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;

  popup.innerHTML = `
    <div class="gaga-highlight-popup__inner">
      <div class="gaga-highlight-popup__header">
        <span class="gaga-highlight-popup__badge">
          <svg class="gaga-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          Sorotan Pustaka
        </span>
        <button type="button" class="gaga-highlight-popup__close" aria-label="Tutup" data-action="close">✕</button>
      </div>
      ${
        highlight.note
          ? `<div class="gaga-highlight-popup__note"><strong>Catatan:</strong> ${escapeHtml(highlight.note)}</div>`
          : ''
      }
      <div class="gaga-highlight-popup__actions">
        <button type="button" class="gaga-btn gaga-btn--sm" data-action="listen">
          <svg class="gaga-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
          Dengarkan
        </button>
        <button type="button" class="gaga-btn gaga-btn--sm" data-action="copy">
          <svg class="gaga-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
          Salin
        </button>
        <button type="button" class="gaga-btn gaga-btn--sm" data-action="note">
          <svg class="gaga-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/></svg>
          ${highlight.note ? 'Ubah Catatan' : 'Tambah Catatan'}
        </button>
        <button type="button" class="gaga-btn gaga-btn--sm gaga-btn--danger" data-action="delete">
          <svg class="gaga-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          Hapus
        </button>
      </div>
      <div class="gaga-highlight-popup__note-form" hidden>
        <textarea class="gaga-highlight-popup__textarea" placeholder="Tuliskan catatan refleksi...">${highlight.note || ''}</textarea>
        <div class="gaga-highlight-popup__form-actions">
          <button type="button" class="gaga-btn gaga-btn--sm" data-action="save-note">Simpan</button>
          <button type="button" class="gaga-btn gaga-btn--sm gaga-btn--ghost" data-action="cancel-note">Batal</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(popup);
  activeHighlightPopupEl = popup;

  popup.querySelector('[data-action="close"]')?.addEventListener('click', closeHighlightPopup);
  popup.querySelector('[data-action="listen"]')?.addEventListener('click', () => {
    closeHighlightPopup();
    if (activeSpeaker) {
      activeSpeaker.playSelection(highlight.text, resolveContentLanguage(mark));
    }
  });
  popup.querySelector('[data-action="copy"]')?.addEventListener('click', () => {
    copyTextToClipboard(highlight.text, mark);
    closeHighlightPopup();
  });
  popup.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
    removeHighlight(highlight.id);
    const parent = mark.parentNode;
    if (parent) {
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
    }
    requestToast({
      message: 'Sorotan dihapus dari Pustaka',
      tone: 'info',
      x: window.innerWidth / 2,
      y: 60
    });
    closeHighlightPopup();
  });

  const noteForm = popup.querySelector<HTMLElement>('.gaga-highlight-popup__note-form');
  const actionsBar = popup.querySelector<HTMLElement>('.gaga-highlight-popup__actions');
  const textarea = popup.querySelector<HTMLTextAreaElement>('textarea');

  popup.querySelector('[data-action="note"]')?.addEventListener('click', () => {
    if (noteForm && actionsBar) {
      noteForm.hidden = false;
      actionsBar.hidden = true;
      textarea?.focus();
    }
  });
  popup.querySelector('[data-action="cancel-note"]')?.addEventListener('click', () => {
    if (noteForm && actionsBar) {
      noteForm.hidden = true;
      actionsBar.hidden = false;
    }
  });
  popup.querySelector('[data-action="save-note"]')?.addEventListener('click', () => {
    const val = textarea?.value || '';
    updateHighlightNote(highlight.id, val);
    highlight.note = val;
    mark.dataset.gagaHasNote = val.trim() ? 'true' : 'false';
    requestToast({
      message: 'Catatan sorotan diperbarui',
      tone: 'ok',
      x: window.innerWidth / 2,
      y: 60
    });
    closeHighlightPopup();
  });
}

function closeHighlightPopup() {
  if (activeHighlightPopupEl) {
    activeHighlightPopupEl.remove();
    activeHighlightPopupEl = null;
  }
}

/* =========================================================================
   SELECTION INTELLIGENCE (FLOATING CONTEXTUAL ACTION MENU)
   ========================================================================= */

function initSelectionIntelligence(article: HTMLElement) {
  let debounceTimer: number | undefined;

  const handleSelection = () => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) {
        closeSelectionMenu();
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 2) {
        closeSelectionMenu();
        return;
      }

      const range = selection.getRangeAt(0);
      const commonContainer = range.commonAncestorContainer;
      const element = commonContainer.nodeType === Node.ELEMENT_NODE
        ? (commonContainer as HTMLElement)
        : commonContainer.parentElement;

      // Ensure selection is inside readable content and not inside buttons/inputs
      const readingSurface = element?.closest(
        '[data-gaga-article-shell], .gaga-flagship-article__prose, .sl-markdown-content, [data-gaga-reading-surface]'
      );
      if (!readingSurface) {
        closeSelectionMenu();
        return;
      }

      if (element?.closest('.gaga-selection-menu, .gaga-highlight-popup, .gaga-speech-dock, button, input, textarea')) {
        return;
      }

      renderSelectionMenu(range, selection, article);
    }, 120);
  };

  document.addEventListener('selectionchange', handleSelection);
  article.addEventListener('mouseup', handleSelection);
  article.addEventListener('touchend', handleSelection);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSelectionMenu();
      closeHighlightPopup();
    }
  });

  document.addEventListener('mousedown', (e) => {
    const target = e.target as HTMLElement | null;
    if (
      !target?.closest('.gaga-selection-menu') &&
      !target?.closest('.gaga-highlight-popup') &&
      !target?.closest('.gaga-highlight-mark')
    ) {
      closeSelectionMenu();
      closeHighlightPopup();
    }
  });
}

function renderSelectionMenu(range: Range, selection: Selection, article: HTMLElement) {
  closeSelectionMenu();
  closeHighlightPopup();

  const rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return;

  const menu = document.createElement('div');
  menu.className = 'gaga-selection-menu';
  menu.setAttribute('role', 'toolbar');
  menu.setAttribute('aria-label', 'Aksi Seleksi Teks');

  menu.innerHTML = `
    <div class="gaga-selection-menu__bar">
      <button type="button" class="gaga-selection-menu__btn" data-gaga-action="selection-highlight" title="Sorot Teks (H)" aria-label="Sorot teks">
        <svg class="gaga-icon" viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        <span>Sorot</span>
        <kbd>H</kbd>
      </button>

      <span class="gaga-selection-menu__sep" aria-hidden="true"></span>

      <button type="button" class="gaga-selection-menu__btn" data-gaga-action="selection-listen" title="Dengarkan Seleksi (S)" aria-label="Dengarkan seleksi">
        <svg class="gaga-icon" viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
        <span>Dengarkan</span>
        <kbd>S</kbd>
      </button>

      <span class="gaga-selection-menu__sep" aria-hidden="true"></span>

      <button type="button" class="gaga-selection-menu__btn" data-gaga-action="selection-copy" title="Salin Kutipan" aria-label="Salin kutipan">
        <svg class="gaga-icon" viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
        <span>Salin</span>
      </button>

      <span class="gaga-selection-menu__sep" aria-hidden="true"></span>

      <button type="button" class="gaga-selection-menu__btn" data-gaga-action="selection-note" title="Tambah Catatan" aria-label="Tambah catatan">
        <svg class="gaga-icon" viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M19 3H4.99C3.89 3 3 3.9 3 5v14c0 1.1.89 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
        <span>Catatan</span>
      </button>
    </div>

    <div class="gaga-selection-menu__note-input" hidden>
      <input type="text" class="gaga-selection-menu__field" placeholder="Ketik catatan refleksi..." maxlength="200" />
      <button type="button" class="gaga-btn gaga-btn--sm gaga-btn--primary" data-gaga-action="save-selection-note">Simpan</button>
    </div>
  `;

  document.body.appendChild(menu);
  selectionMenuEl = menu;

  // Position with viewport clamping
  const menuWidth = 320;
  const menuHeight = 44;
  let top = rect.top + window.scrollY - menuHeight - 10;
  if (top < window.scrollY + 10) {
    top = rect.bottom + window.scrollY + 10;
  }
  let left = rect.left + window.scrollX + rect.width / 2 - menuWidth / 2;
  left = Math.max(12, Math.min(window.innerWidth - menuWidth - 12, left));

  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;

  // Wire buttons
  menu.querySelector('[data-gaga-action="selection-highlight"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    createHighlightFromSelection(range, selection, article);
    closeSelectionMenu();
  });

  menu.querySelector('[data-gaga-action="selection-listen"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    const text = selection.toString().trim();
    if (text && activeSpeaker) {
      activeSpeaker.playSelection(text, resolveContentLanguage(article));
    }
    closeSelectionMenu();
  });

  menu.querySelector('[data-gaga-action="selection-copy"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    const text = selection.toString().trim();
    copyTextToClipboard(text, article);
    closeSelectionMenu();
  });

  const noteInput = menu.querySelector<HTMLElement>('.gaga-selection-menu__note-input');
  const bar = menu.querySelector<HTMLElement>('.gaga-selection-menu__bar');
  const field = menu.querySelector<HTMLInputElement>('.gaga-selection-menu__field');

  menu.querySelector('[data-gaga-action="selection-note"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (noteInput && bar) {
      noteInput.hidden = false;
      bar.hidden = true;
      field?.focus();
    }
  });

  menu.querySelector('[data-gaga-action="save-selection-note"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    const noteText = field?.value.trim() || '';
    createHighlightFromSelection(range, selection, article, noteText);
    closeSelectionMenu();
  });

  field?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const noteText = field.value.trim();
      createHighlightFromSelection(range, selection, article, noteText);
      closeSelectionMenu();
    }
  });
}

function closeSelectionMenu() {
  if (selectionMenuEl) {
    selectionMenuEl.remove();
    selectionMenuEl = null;
  }
}

function createHighlightFromSelection(
  range: Range,
  selection: Selection,
  article: HTMLElement,
  note?: string
) {
  const text = selection.toString().trim();
  if (!text) return;

  const loc = findSelectionLocation(range, article);
  if (!loc) {
    requestToast({
      message: 'Pilih teks di dalam paragraf artikel',
      tone: 'warn',
      x: window.innerWidth / 2,
      y: 60
    });
    return;
  }

  const meta = getArticleMetadata(article);
  const id = `hl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const entity: HighlightEntity = {
    id,
    articleId: meta.route,
    articleTitle: meta.title,
    author: meta.author,
    topic: meta.topic,
    text,
    location: loc,
    createdAt: new Date().toISOString(),
    tags: ['reading', meta.topic.toLowerCase()],
    ...(note ? { note } : {})
  };

  saveHighlight(entity);

  // Wrap visually in DOM
  const mark = document.createElement('mark');
  mark.className = 'gaga-highlight-mark';
  mark.dataset.gagaHighlightId = id;
  mark.id = `hl-${id}`;
  mark.tabIndex = 0;
  mark.setAttribute('role', 'mark');
  mark.setAttribute('aria-label', note ? `Sorotan dengan catatan: ${note}` : 'Teks yang disorot');
  if (note) mark.dataset.gagaHasNote = 'true';

  try {
    range.surroundContents(mark);
    wireHighlightClick(mark, entity);
  } catch {
    // If range crosses tags, re-run full restoration to safely decorate
    restoreArticleHighlights(article);
  }

  selection.removeAllRanges();

  requestToast({
    message: note ? 'Sorotan dan catatan disimpan ke Pustaka' : 'Sorotan disimpan ke Pustaka',
    tone: 'ok',
    x: window.innerWidth / 2,
    y: 60
  });
}

function copyTextToClipboard(text: string, contextElement: HTMLElement) {
  const meta = getArticleMetadata(contextElement.closest('[data-gaga-article-shell]') || contextElement);
  const formatted = `"${text}"\n— ${meta.title} (${meta.author})`;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(formatted).then(() => {
      requestToast({
        message: 'Kutipan disalin ke papan klip',
        tone: 'ok',
        x: window.innerWidth / 2,
        y: 60
      });
    });
  }
}

/* =========================================================================
   SMART SPEAKER RUNTIME (ARTICLE & SELECTION SPEECH WITH DOCK)
   ========================================================================= */

function initSmartSpeaker(): SpeakerController {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  let currentUtterance: SpeechSynthesisUtterance | null = null;
  let voices: SpeechSynthesisVoice[] = [];

  const updateVoices = () => {
    if (synth) voices = synth.getVoices();
  };
  updateVoices();
  if (synth && 'onvoiceschanged' in synth) {
    synth.onvoiceschanged = updateVoices;
  }

  const controller: SpeakerController = {
    state: 'idle',
    mode: 'article',
    currentText: '',
    rate: 1.0,
    voice: null,

    playSelection(text: string, lang: string) {
      if (!synth) {
        requestToast({ message: 'Sintesis suara tidak didukung peramban ini', tone: 'warn' });
        return;
      }
      this.stop();
      this.mode = 'selection';
      this.currentText = text;
      this.state = 'playing';

      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = lang;
      utt.rate = this.rate;

      const matchedVoice = voices.find((v) => v.lang.startsWith(lang.split('-')[0])) || null;
      if (matchedVoice) {
        utt.voice = matchedVoice;
        this.voice = matchedVoice;
      }

      utt.onstart = () => {
        this.state = 'playing';
        renderSpeechDock(this);
      };
      utt.onend = () => {
        this.state = 'completed';
        renderSpeechDock(this);
        setTimeout(() => {
          if (this.state === 'completed') this.stop();
        }, 2400);
      };
      utt.onerror = () => {
        this.state = 'error';
        renderSpeechDock(this);
      };

      currentUtterance = utt;
      synth.speak(utt);
      renderSpeechDock(this);
      requestToast({ message: 'Memutar narasi pilihan', tone: 'ok' });
    },

    playArticle(elements: HTMLElement[], lang: string) {
      if (!synth) return;
      this.stop();
      this.mode = 'article';

      const combinedText = elements
        .map((el) => el.innerText.trim())
        .filter((t) => t.length > 0)
        .join('. ');

      if (!combinedText) {
        requestToast({ message: 'Tidak ada teks yang dapat dinarasikan', tone: 'warn' });
        return;
      }

      this.currentText = combinedText;
      this.state = 'playing';

      const utt = new SpeechSynthesisUtterance(combinedText);
      utt.lang = lang;
      utt.rate = this.rate;

      const matchedVoice = voices.find((v) => v.lang.startsWith(lang.split('-')[0])) || null;
      if (matchedVoice) {
        utt.voice = matchedVoice;
        this.voice = matchedVoice;
      }

      utt.onstart = () => {
        this.state = 'playing';
        renderSpeechDock(this);
      };
      utt.onend = () => {
        this.state = 'completed';
        renderSpeechDock(this);
        setTimeout(() => {
          if (this.state === 'completed') this.stop();
        }, 2400);
      };
      utt.onerror = () => {
        this.state = 'error';
        renderSpeechDock(this);
      };

      currentUtterance = utt;
      synth.speak(utt);
      renderSpeechDock(this);
      requestToast({ message: 'Memutar narasi artikel penuh', tone: 'ok' });
    },

    pause() {
      if (synth && this.state === 'playing') {
        synth.pause();
        this.state = 'paused';
        renderSpeechDock(this);
      }
    },

    resume() {
      if (synth && this.state === 'paused') {
        synth.resume();
        this.state = 'playing';
        renderSpeechDock(this);
      }
    },

    stop() {
      if (synth) {
        synth.cancel();
      }
      this.state = 'idle';
      this.currentText = '';
      closeSpeechDock();
    },

    setRate(rate: number) {
      this.rate = rate;
      if (currentUtterance && this.state === 'playing') {
        // Restart with new rate
        const text = this.currentText;
        const lang = currentUtterance.lang;
        this.stop();
        if (this.mode === 'selection') this.playSelection(text, lang);
      }
      renderSpeechDock(this);
    },

    setVoice(voice: SpeechSynthesisVoice) {
      this.voice = voice;
      renderSpeechDock(this);
    }
  };

  return controller;
}

function renderSpeechDock(controller: SpeakerController) {
  if (controller.state === 'idle') {
    closeSpeechDock();
    return;
  }

  if (!speechDockEl) {
    speechDockEl = document.createElement('div');
    speechDockEl.className = 'gaga-speech-dock';
    speechDockEl.setAttribute('role', 'region');
    speechDockEl.setAttribute('aria-label', 'Kontrol Narasi Suara');
    document.body.appendChild(speechDockEl);
  }

  const snippet =
    controller.currentText.length > 70
      ? controller.currentText.slice(0, 67) + '...'
      : controller.currentText;

  speechDockEl.innerHTML = `
    <div class="gaga-speech-dock__inner">
      <div class="gaga-speech-dock__info">
        <span class="gaga-speech-dock__badge ${controller.mode === 'selection' ? 'gaga-speech-dock__badge--selection' : ''}">
          <span class="gaga-speech-dock__wave" aria-hidden="true">
            <span></span><span></span><span></span>
          </span>
          ${controller.mode === 'selection' ? 'Narasi Pilihan' : 'Narasi Lengkap'}
        </span>
        <span class="gaga-speech-dock__text" title="${escapeHtml(controller.currentText)}">${escapeHtml(snippet)}</span>
      </div>

      <div class="gaga-speech-dock__controls">
        ${
          controller.state === 'playing'
            ? `<button type="button" class="gaga-speech-dock__btn" data-speech="pause" aria-label="Jeda narasi">
                <svg class="gaga-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
               </button>`
            : `<button type="button" class="gaga-speech-dock__btn gaga-speech-dock__btn--play" data-speech="resume" aria-label="Lanjutkan narasi">
                <svg class="gaga-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
               </button>`
        }

        <button type="button" class="gaga-speech-dock__btn" data-speech="rate" aria-label="Kecepatan: ${controller.rate}x">
          ${controller.rate}x
        </button>

        <button type="button" class="gaga-speech-dock__btn gaga-speech-dock__btn--stop" data-speech="stop" aria-label="Hentikan narasi">
          <svg class="gaga-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>
        </button>
      </div>
    </div>
  `;

  speechDockEl.querySelector('[data-speech="pause"]')?.addEventListener('click', () => controller.pause());
  speechDockEl.querySelector('[data-speech="resume"]')?.addEventListener('click', () => controller.resume());
  speechDockEl.querySelector('[data-speech="stop"]')?.addEventListener('click', () => controller.stop());
  speechDockEl.querySelector('[data-speech="rate"]')?.addEventListener('click', () => {
    const nextRate = controller.rate === 1.0 ? 1.25 : controller.rate === 1.25 ? 1.5 : 1.0;
    controller.setRate(nextRate);
  });
}

function closeSpeechDock() {
  if (speechDockEl) {
    speechDockEl.remove();
    speechDockEl = null;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* =========================================================================
   PUBLIC INITIALIZER
   ========================================================================= */

export function initReaderEnhancements() {
  activeSpeaker = initSmartSpeaker();

  const article = document.querySelector<HTMLElement>(
    '[data-gaga-article-shell], .gaga-flagship-article, [data-gaga-reading-surface]'
  );

  if (article) {
    ensureBlockIds(article);
    restoreArticleHighlights(article);
    initSelectionIntelligence(article);

    // Wire existing article speak button
    const speakButton = article.querySelector<HTMLButtonElement>('[data-gaga-speak-article]');
    if (speakButton) {
      speakButton.addEventListener('click', () => {
        if (activeSpeaker?.state === 'playing') {
          activeSpeaker.pause();
        } else if (activeSpeaker?.state === 'paused') {
          activeSpeaker.resume();
        } else {
          const blocks = Array.from(
            article.querySelectorAll<HTMLElement>(
              '.gaga-flagship-article__prose p, .sl-markdown-content p, p'
            )
          );
          activeSpeaker?.playArticle(blocks, resolveContentLanguage(article));
        }
      });
    }

    // Wire existing highlight selection button
    const highlightButton = article.querySelector<HTMLButtonElement>('[data-gaga-highlight-selection]');
    if (highlightButton) {
      highlightButton.addEventListener('click', () => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) {
          requestToast({ message: 'Pilih teks di dalam artikel terlebih dahulu', tone: 'warn' });
          return;
        }
        createHighlightFromSelection(sel.getRangeAt(0), sel, article);
      });
    }
  }

  // Connect to Gaga Action Runtime universal commands
  registerSiteCommand('highlight', () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      requestToast({ message: 'Pilih teks di dalam artikel terlebih dahulu (H)', tone: 'warn' });
      return false;
    }
    const currentArticle = document.querySelector<HTMLElement>(
      '[data-gaga-article-shell], .gaga-flagship-article, [data-gaga-reading-surface]'
    );
    if (!currentArticle) return false;
    createHighlightFromSelection(sel.getRangeAt(0), sel, currentArticle);
    return true;
  });

  registerSiteCommand('speak', () => {
    const sel = window.getSelection();
    const currentArticle = document.querySelector<HTMLElement>(
      '[data-gaga-article-shell], .gaga-flagship-article, [data-gaga-reading-surface]'
    );
    if (!currentArticle) return false;

    // If selection exists, read selection!
    if (sel && !sel.isCollapsed && sel.toString().trim()) {
      activeSpeaker?.playSelection(sel.toString().trim(), resolveContentLanguage(currentArticle));
      return true;
    }

    // Otherwise toggle full article reading!
    if (activeSpeaker?.state === 'playing') {
      activeSpeaker.pause();
    } else if (activeSpeaker?.state === 'paused') {
      activeSpeaker.resume();
    } else {
      const blocks = Array.from(
        currentArticle.querySelectorAll<HTMLElement>(
          '.gaga-flagship-article__prose p, .sl-markdown-content p, p'
        )
      );
      activeSpeaker?.playArticle(blocks, resolveContentLanguage(currentArticle));
    }
    return true;
  });
}
