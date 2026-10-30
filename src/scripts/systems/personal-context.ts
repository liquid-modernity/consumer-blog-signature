import { personalStateNamespace as namespace } from '../../config/personal-state.mjs';
import { personalState, localPersonalHref, type PersonalContent } from '../../lib/personal-state';
const blockCache = new WeakMap<HTMLElement, {
    text: string;
    heading: string;
    hash: string;
}>();
export function currentPersonalContent(): {
    content: PersonalContent;
    body: HTMLElement;
} | null {
    const frame = document.querySelector<HTMLElement>('[data-gaga-app-frame]');
    const scope = document.querySelector<HTMLElement>('[data-gaga-personal-readable="true"]');
    const body = scope?.querySelector<HTMLElement>('[data-gaga-document-body]') ?? scope;
    if (!frame?.dataset.gagaPageId || !body)
        return null;
    const href = localPersonalHref(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? location.pathname, personalState.origin);
    if (!href)
        return null;
    return { body, content: { namespace, schemaVersion: 1, contentIdentity: frame.dataset.gagaPageId, contentType: scope?.dataset.gagaPersonalKind === 'article' ? 'article' : 'document', href, canonicalUrl: new URL(href, personalState.origin).href, title: frame.dataset.gagaPageTitle ?? document.querySelector('h1')?.textContent?.trim() ?? document.title, author: scope?.dataset.gagaPersonalAuthor || undefined, language: document.documentElement.lang } };
}
export async function preparePersonalBlocks(body: HTMLElement) {
    let heading = '';
    for (const block of body.querySelectorAll<HTMLElement>('h2[id],h3[id],p,blockquote,li')) {
        if (block.closest('nav,button,textarea,[contenteditable],.gaga-selection-menu,.gaga-highlight-popup'))
            continue;
        if (block.matches('h2[id],h3[id]'))
            heading = block.id;
        const text = block.textContent ?? '';
        const previous = blockCache.get(block);
        let hash = previous?.text === text && previous.heading === heading ? previous.hash : undefined;
        if (!hash)
            hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(heading + '\0' + text)))).map(x => x.toString(16).padStart(2, '0')).join('');
        blockCache.set(block, { text, heading, hash });
        block.dataset.gagaBlockHash = hash;
        if (!block.dataset.gagaBlockId || block.dataset.gagaPersonalBlock === 'true') {
            block.dataset.gagaBlockId = block.id ? 'id:' + block.id : 'quote:' + hash;
            block.dataset.gagaPersonalBlock = 'true';
        }
    }
}
export function personalBlock(body: HTMLElement, id: string) { const matches = Array.from(body.querySelectorAll<HTMLElement>('[data-gaga-block-id]')).filter(b => b.dataset.gagaBlockId === id); return matches.length === 1 ? matches[0] : null; }
