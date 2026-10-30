import { personalState, type PersonalAnnotation, type HighlightLocation } from '../../lib/personal-state';
export { type HighlightLocation } from '../../lib/personal-state';
export type HighlightEntity = PersonalAnnotation;
export const ANNOTATION_STORAGE_KEY = 'gaga:annotations:v1';
export const KNOWLEDGE_STORAGE_KEY = personalState.keys.annotations;
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



export function readAllHighlights(): HighlightEntity[] {
 return personalState.annotations().sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)||a.id.localeCompare(b.id));
}
export function saveHighlight(highlight:HighlightEntity):boolean { return personalState.save(highlight); }
export function removeHighlight(id:string):boolean { return personalState.remove(id); }
export function updateHighlightNote(id:string,note:string):boolean {
 const target=readAllHighlights().find(v=>v.id===id);if(!target)return false;
 return saveHighlight({...target,note:note.trim(),updatedAt:personalState.now()});
}
export function removePersonalQuote(id:string):boolean {
 const target=readAllHighlights().find(v=>v.id===id);if(!target)return false;
 return saveHighlight({...target,quoted:false,updatedAt:personalState.now()});
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
