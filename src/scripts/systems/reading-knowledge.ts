import { createPersonalHighlight } from '@gaga/engine/annotation';
import { createAnnotationStorage } from '@gaga/engine-web/runtime/annotation';
import { readJson, writeJson } from '@gaga/engine-web/runtime/storage';

export const ANNOTATION_STORAGE_KEY = 'gaga:annotations:v1';
export const KNOWLEDGE_STORAGE_KEY = 'gaga:reading-knowledge:v1';

export interface HighlightLocation {
  blockId: string;
  startOffset: number;
  endOffset: number;
  prefix?: string;
  suffix?: string;
  selector?: string;
}

export interface HighlightEntity {
  id: string;
  articleId: string;
  articleTitle?: string;
  author?: string;
  topic?: string;
  text: string;
  location: HighlightLocation;
  createdAt: string;
  tags?: string[];
  note?: string;
}

export function normalizeSpeechLang(code?: string): string {
  if (!code) return 'id-ID';
  const clean = code.trim().toLowerCase();
  if (clean.startsWith('id')) return 'id-ID';
  if (clean.startsWith('en')) return 'en-US';
  if (clean.startsWith('ja')) return 'ja-JP';
  if (clean.startsWith('fr')) return 'fr-FR';
  if (clean.startsWith('de')) return 'de-DE';
  if (clean.startsWith('es')) return 'es-ES';
  if (clean.startsWith('zh')) return 'zh-CN';
  return code;
}

export function resolveContentLanguage(element?: Element | null): string {
  if (element) {
    const elLang = element.closest('[lang]')?.getAttribute('lang');
    if (elLang) return normalizeSpeechLang(elLang);
  }
  const article = document.querySelector<HTMLElement>('[data-gaga-article-shell], .gaga-flagship-article');
  if (article) {
    const lang = article.getAttribute('lang') || article.dataset.gagaLanguage;
    if (lang) return normalizeSpeechLang(lang);
  }
  const docLang = document.documentElement.lang;
  if (docLang) return normalizeSpeechLang(docLang);
  return 'id-ID';
}

function isHighlightEntity(value: unknown): value is HighlightEntity {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.articleId === 'string' &&
    typeof item.text === 'string' &&
    typeof item.location === 'object' &&
    item.location !== null &&
    typeof item.createdAt === 'string'
  );
}

export function readAllHighlights(): HighlightEntity[] {
  if (typeof window === 'undefined') return [];
  const knowledgeItems = readJson<HighlightEntity[]>(KNOWLEDGE_STORAGE_KEY, [], (val): val is HighlightEntity[] =>
    Array.isArray(val) && val.every(isHighlightEntity)
  );

  // Sync with engine annotation storage
  const engineStorage = createAnnotationStorage(ANNOTATION_STORAGE_KEY);
  const engineHighlights = engineStorage.read();

  const idMap = new Map<string, HighlightEntity>();
  for (const item of knowledgeItems) {
    idMap.set(item.id, item);
  }

  // Import any engine highlights that might not be in knowledgeItems
  let updated = false;
  for (const eng of engineHighlights) {
    if (!idMap.has(eng.id)) {
      const entity: HighlightEntity = {
        id: eng.id,
        articleId: eng.target.contentId,
        text: eng.target.exactText,
        location: {
          blockId: eng.target.blockId || '',
          startOffset: eng.target.startOffset ?? 0,
          endOffset: eng.target.endOffset ?? eng.target.exactText.length,
          prefix: eng.target.prefix,
          suffix: eng.target.suffix
        },
        createdAt: eng.createdAt || new Date().toISOString(),
        tags: ['reading'],
        note: eng.note
      };
      idMap.set(entity.id, entity);
      updated = true;
    }
  }

  const result = Array.from(idMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (updated) {
    writeJson(KNOWLEDGE_STORAGE_KEY, result);
  }

  return result;
}

export function saveHighlight(highlight: HighlightEntity): void {
  if (typeof window === 'undefined') return;
  const existing = readAllHighlights().filter((item) => item.id !== highlight.id);
  const updated = [highlight, ...existing];
  writeJson(KNOWLEDGE_STORAGE_KEY, updated);

  // Sync with engine storage
  try {
    const engineStorage = createAnnotationStorage(ANNOTATION_STORAGE_KEY);
    engineStorage.save(
      createPersonalHighlight({
        id: highlight.id,
        target: {
          contentId: highlight.articleId,
          blockId: highlight.location.blockId,
          exactText: highlight.text,
          startOffset: highlight.location.startOffset,
          endOffset: highlight.location.endOffset,
          prefix: highlight.location.prefix,
          suffix: highlight.location.suffix
        },
        createdAt: highlight.createdAt,
        note: highlight.note
      })
    );
  } catch (err) {
    console.warn('[Gaga Knowledge] Engine sync fallback:', err);
  }

  window.dispatchEvent(new CustomEvent('gaga:highlights:changed', { detail: { highlight, action: 'save' } }));
}

export function removeHighlight(id: string): void {
  if (typeof window === 'undefined') return;
  const existing = readAllHighlights().filter((item) => item.id !== id);
  writeJson(KNOWLEDGE_STORAGE_KEY, existing);

  try {
    const engineStorage = createAnnotationStorage(ANNOTATION_KEY_FALLBACK);
    engineStorage.remove(id);
  } catch {
    // Engine removal fallback
  }

  window.dispatchEvent(new CustomEvent('gaga:highlights:changed', { detail: { id, action: 'remove' } }));
}

const ANNOTATION_KEY_FALLBACK = ANNOTATION_STORAGE_KEY;

export function updateHighlightNote(id: string, note: string): void {
  const all = readAllHighlights();
  const target = all.find((item) => item.id === id);
  if (!target) return;
  target.note = note.trim();
  saveHighlight(target);
}

export function formatDateLocale(isoDate: string, lang = 'id'): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return isoDate;
  }
}
