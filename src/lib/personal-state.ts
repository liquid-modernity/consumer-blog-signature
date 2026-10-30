import { readJson, readArray, writeJson, type BrowserStorageTarget } from '@gaga/engine-runtime/runtime/storage';
import { createAnnotationStorage } from '@gaga/engine-runtime/runtime/annotation';
import { createReadingCollectionStore } from '@gaga/engine-runtime/runtime/reading-collection';
import { isSavedItem, type SavedItem } from '@gaga/engine-runtime/reader';
import { personalStateNamespace as namespace, personalStateVersion as schemaVersion, personalCanonicalOrigin, personalStorageKeys as keys, legacyAnnotationKeys } from '../config/personal-state.mjs';
import { isContinuityStatus, isLocalContinuityHref, continuityStoragePolicy, isContinuityItem, type ContinuityItem } from '../config/continuity.ts';
export interface PersonalContent {
    namespace: string;
    schemaVersion: 1;
    contentIdentity: string;
    contentType: 'article' | 'document';
    href: string;
    canonicalUrl: string;
    title: string;
    author?: string;
    language?: string;
}
export interface HighlightLocation {
    blockId: string;
    startOffset: number;
    endOffset: number;
    prefix?: string;
    suffix?: string;
    selector?: string;
    blockHash?: string;
}
export interface PersonalAnnotation extends Record<string, unknown> {
    id: string;
    namespace: string;
    schemaVersion: 1;
    contentIdentity: string;
    contentType: 'article' | 'document';
    articleId: string;
    canonicalUrl: string;
    articleTitle?: string;
    author?: string;
    topic?: string;
    text: string;
    location: HighlightLocation;
    createdAt: string;
    updatedAt: string;
    language?: string;
    tags?: string[];
    note?: string;
    quoted?: boolean;
    resolution: 'resolved' | 'unresolved';
    storageVersion?: number;
}
export const personalStateChanged = 'gaga:personal:changed';
const epoch = new Date(0).toISOString();
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string' && !!v.trim();
const date = (v: unknown) => typeof v === 'string' && Number.isFinite(Date.parse(v)) ? new Date(v).toISOString() : epoch;
export function localPersonalHref(value: unknown, origin: string): string | undefined {
    if (!text(value) || (!value.startsWith('/') && !/^https?:\/\//.test(value)) || /[\\\u0000-\u001f\u007f]/.test(value))
        return;
    try {
        const u = new URL(value, origin);
        if (u.origin !== origin || !['http:', 'https:'].includes(u.protocol))
            return;
        return u.pathname.replace(/\/+$/, '') || '/';
    }
    catch {
        return;
    }
}
function validLocation(v: unknown): v is HighlightLocation {
    return object(v) && typeof v.blockId === 'string' && Number.isInteger(v.startOffset) && Number.isInteger(v.endOffset) && Number(v.startOffset) >= 0 && Number(v.endOffset) >= Number(v.startOffset) && ['prefix', 'suffix', 'blockHash'].every(k => v[k] === undefined || typeof v[k] === 'string');
}
export function isPersonalAnnotation(v: unknown): v is PersonalAnnotation {
    return object(v) && v.namespace === namespace && v.schemaVersion === 1 && text(v.id) && v.id.length <= 200 && text(v.contentIdentity) && ['article', 'document'].includes(String(v.contentType)) && isLocalContinuityHref(v.articleId) && text(v.canonicalUrl) && text(v.text) && v.text.length <= 16000 && validLocation(v.location) && text(v.createdAt) && Number.isFinite(Date.parse(v.createdAt)) && text(v.updatedAt) && Number.isFinite(Date.parse(v.updatedAt)) && ['resolved', 'unresolved'].includes(String(v.resolution)) && (v.note === undefined || typeof v.note === 'string') && (v.quoted === undefined || typeof v.quoted === 'boolean');
}
export function createPersonalStateStore(options: {
    storage?: BrowserStorageTarget;
    origin?: string;
    now?: () => Date;
} = {}) {
    const storage = options.storage, origin = options.origin ?? personalCanonicalOrigin, now = options.now ?? (() => new Date());
    const annotations = createAnnotationStorage<PersonalAnnotation>(keys.annotations, storage, { storageVersion: 1, isRecord: isPersonalAnnotation });
    const nativeReading = createReadingCollectionStore({ storageKey: keys.continuity, storage, isStatus: isContinuityStatus, validateHref: isLocalContinuityHref, maxItems: continuityStoragePolicy.maxItems, retentionMs: continuityStoragePolicy.retentionDays * 86400000, now });
    function raw(key: string) { try {
        return (storage ?? localStorage).getItem(key);
    }
    catch {
        return null;
    } }
    function legacy(value: unknown, index: number): PersonalAnnotation | undefined {
        if (!object(value))
            return;
        if (isPersonalAnnotation(value))
            return localPersonalHref(value.canonicalUrl, origin) === value.articleId ? value : undefined;
        const target = object(value.target) ? value.target : {};
        const selected = typeof value.text === 'string' ? value.text : target.exactText;
        const href = localPersonalHref(value.articleId ?? target.contentId ?? value.url, origin);
        if (!text(selected) || selected.length > 16000 || !href)
            return;
        const id = text(value.id) ? value.id : `legacy-${Date.parse(date(value.time)) || 0}-${index}`;
        if (id.length > 200)
            return;
        const location = validLocation(value.location) ? value.location : { blockId: typeof target.blockId === 'string' ? target.blockId : '', startOffset: typeof target.startOffset === 'number' ? target.startOffset : 0, endOffset: typeof target.endOffset === 'number' ? target.endOffset : selected.length };
        return { id, namespace, schemaVersion: 1, contentIdentity: typeof value.contentIdentity === 'string' ? value.contentIdentity : href, contentType: value.contentType === 'document' ? 'document' : 'article', articleId: href, canonicalUrl: new URL(href, origin).href, articleTitle: typeof value.articleTitle === 'string' ? value.articleTitle : undefined, author: typeof value.author === 'string' ? value.author : undefined, topic: typeof value.topic === 'string' ? value.topic : undefined, tags: Array.isArray(value.tags) && value.tags.every(v => typeof v === 'string') ? value.tags : undefined, text: selected, location, createdAt: date(value.createdAt ?? value.time), updatedAt: date(value.updatedAt ?? value.createdAt ?? value.time), note: typeof value.note === 'string' ? value.note : undefined, quoted: value.quoted === true, resolution: 'unresolved', language: typeof value.language === 'string' ? value.language : undefined };
    }
    function archive(inputs: {
        key: string;
        raw: string | null;
    }[]) {
        const previous = raw(keys.annotationArchive);
        let value: {
            namespace: string;
            schemaVersion: number;
            entries: {
                key: string;
                raw: string;
            }[];
        } = { namespace, schemaVersion, entries: [] };
        if (previous !== null) {
            try {
                const p = JSON.parse(previous);
                if (!object(p) || p.namespace !== namespace || p.schemaVersion !== 1 || !Array.isArray(p.entries) || !p.entries.every(e => object(e) && typeof e.key === 'string' && typeof e.raw === 'string'))
                    return false;
                value = p as typeof value;
            }
            catch {
                return false;
            }
        }
        for (const input of inputs)
            if (input.raw !== null && input.raw !== '[]' && !value.entries.some(a => a.key === input.key && a.raw === input.raw))
                value.entries.push({ key: input.key, raw: input.raw });
        writeJson(keys.annotationArchive, value, storage);
        return raw(keys.annotationArchive) === JSON.stringify(value);
    }
    let writable = true;
    function migrate() {
        const inputs = [keys.annotations, ...legacyAnnotationKeys].map(key => ({ key, raw: raw(key) }));
        const values = inputs.map(s => { try {
            return JSON.parse(s.raw ?? '[]') as unknown;
        }
        catch {
            return undefined;
        } });
        // Preserve future records verbatim; an older client must not downgrade their schema.
        if(object(values[0]) && ((values[0].schemaVersion!==undefined&&values[0].schemaVersion!==1)||(values[0].version!==undefined&&values[0].version!==1)||(values[0].storageVersion!==undefined&&values[0].storageVersion!==1)||(values[0].namespace!==undefined&&values[0].namespace!==namespace))){writable=false;return annotations.read();}
        if (Array.isArray(values[0]) && values[0].some(v => object(v) && ((v.schemaVersion !== undefined && v.schemaVersion !== 1) || (v.storageVersion !== undefined && v.storageVersion !== 1) || (v.namespace !== undefined && v.namespace !== namespace)))) {
            writable = false;
            return annotations.read();
        }
        const current = annotations.read();
        const needs = inputs.some((s, i) => s.raw !== null && (!Array.isArray(values[i]) || (values[i] as unknown[]).some(v => i === 0 ? !(isPersonalAnnotation(v) && object(v) && v.storageVersion === 1) : true)));
        if (!needs) {
            writable = true;
            return current;
        }
        if (!archive(inputs)) {
            writable = false;
            return current;
        }
        const merged = new Map<string, PersonalAnnotation>();
        for (let i = inputs.length - 1; i >= 0; i--)
            if (Array.isArray(values[i]))
                (values[i] as unknown[]).forEach((value, index) => { const entry = legacy(value, index); if (entry)
                    merged.set(entry.id, entry); });
        const records = [...merged.values()].map(r => ({ ...r, storageVersion: 1 }));
        writeJson(keys.annotations, records, storage);
        if (raw(keys.annotations) !== JSON.stringify(records)) {
            writable = false;
            return current;
        }
        for (const key of legacyAnnotationKeys)
            writeJson(key, [], storage);
        writable = legacyAnnotationKeys.every(key => raw(key) === '[]' || raw(key) === null);
        return annotations.read();
    }
    function readableContinuity() {
        const input = raw(keys.continuity);
        if (input === null)
            return nativeReading.read();
        let value: unknown;
        try {
            value = JSON.parse(input);
        }
        catch {
            return { version: 1 as const, updatedAt: '', items: [] };
        }
        if (!object(value) || value.version !== 1 || !Array.isArray(value.items))
            return { version: 1 as const, updatedAt: '', items: [] };
        const items = value.items.filter(v => isContinuityItem(v) && (!object(v) || (v.schemaVersion === undefined || v.schemaVersion === 1) && (v.namespace === undefined || v.namespace === namespace))) as ContinuityItem[];
        return { version: 1 as const, updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : '', currentId: typeof value.currentId === 'string' ? value.currentId : undefined, items };
    }
    const reading = {
        read: readableContinuity,
        write(items: ContinuityItem[], currentId?: string) {
            const input = raw(keys.continuity);
            let value: unknown;
            try {
                value = JSON.parse(input ?? 'null');
            }
            catch {
                value = undefined;
            }
            if (object(value) && (value.version !== 1 || (Array.isArray(value.items) && value.items.some(v => object(v) && ((v.schemaVersion !== undefined && v.schemaVersion !== 1) || (v.namespace !== undefined && v.namespace !== namespace))))))
                return readableContinuity();
            if (input !== null && (!object(value) || !Array.isArray(value.items) || !value.items.every(isContinuityItem)) && !archive([{ key: keys.continuity, raw: input }]))
                return readableContinuity();
            nativeReading.write(items, currentId);
            return readableContinuity();
        }
    };
    function preference(key: string) { const value = raw(key); if (value === null)
        return null; try {
        return JSON.parse(value);
    }
    catch {
        return key === keys.identity ? value : null;
    } }
    function changed(action: string, id: string) { if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(personalStateChanged, { detail: { domain: 'annotations', action, id } }));
        window.dispatchEvent(new CustomEvent('gaga:highlights:changed', { detail: { action, id } }));
    } }
    return {
        namespace, schemaVersion, keys, reading,
        saved: () => readArray(keys.saved, (v): v is SavedItem => isSavedItem(v) && !!localPersonalHref(v.href, origin), storage),
        annotations: () => migrate().filter(v => localPersonalHref(v.canonicalUrl, origin) === v.articleId),
        removeSaved(id: string) { const values = readJson<unknown[]>(keys.saved, [], Array.isArray, storage); const next = values.filter(v => !isSavedItem(v) || v.id !== id); writeJson(keys.saved, next, storage); return raw(keys.saved) === JSON.stringify(next); },
        save(annotation: PersonalAnnotation) { migrate(); if (!writable || !isPersonalAnnotation(annotation) || localPersonalHref(annotation.canonicalUrl, origin) !== annotation.articleId)
            return false; annotations.save(annotation); const stored = annotations.read().find(v => v.id === annotation.id); const ok = !!stored && JSON.stringify(stored) === JSON.stringify({ ...annotation, storageVersion: 1 }); if (ok)
            changed('save', annotation.id); return ok; },
        remove(id: string) { migrate(); if (!writable)
            return false; annotations.remove(id); const ok = !annotations.read().some(v => v.id === id); if (ok)
            changed('remove', id); return ok; },
        snapshot() { const marks = migrate().filter(v=>localPersonalHref(v.canonicalUrl,origin)===v.articleId), continuity = reading.read(); return { namespace, schemaVersion, reading: continuity, saved: this.saved(), preferences: Object.fromEntries(['reader', 'theme', 'language', 'identity', 'designLanguage', 'sfx'].map(k => [k, preference(keys[k as keyof typeof keys])])), highlights: marks, notes: marks.filter(r => r.note?.trim()), quotes: marks.filter(r => r.quoted), history: continuity.items, context: readJson(keys.returnContext, null, (_v): _v is unknown => true, storage) }; },
        now: () => now().toISOString(), origin
    };
}
// Offsets are only accepted inside an unchanged, uniquely identified block.
export function resolvePersonalAnchor(text: string, record: Pick<PersonalAnnotation, 'text' | 'location'>, blockHash: string): {
    start: number;
    end: number;
} | undefined {
    const a = record.location;
    if (!a.blockHash || a.blockHash !== blockHash)
        return;
    if (text.slice(a.startOffset, a.endOffset) !== record.text)
        return;
    if (a.prefix !== undefined && !text.slice(0, a.startOffset).endsWith(a.prefix))
        return;
    if (a.suffix !== undefined && !text.slice(a.endOffset).startsWith(a.suffix))
        return;
    return { start: a.startOffset, end: a.endOffset };
}
export function continueReading(items: {
    status: string;
    progress: number;
}[]) { return items.filter(v => v.status !== 'completed' && ((v.status === 'in-progress' && v.progress > 2) || v.status === 'read-next')); }
export const personalState = createPersonalStateStore();
