import { initInformationSurface as initEngineInformationSurface } from '@gaga/engine-runtime/runtime/information-surface';
import { getInformationPreviewRestoreDelayMs } from '../../config/systems';
import { positionLinkPreview } from '../../config/contextual-ux.mjs';

// Native composedPath is cleared after dispatch; preserve it across hover intent.
export function snapshotPreviewEvent(event:Event):Event {
  const path=event.composedPath();
  return new Proxy(event,{get(target,key){
    if(key==='composedPath')return ()=>path;
    const value=Reflect.get(target,key,target);
    return typeof value==='function'?value.bind(target):value;
  }});
}

let initialized = false;
export function initInformationSurface() {
  const card = document.querySelector<HTMLElement>('[data-gaga-hover-preview-card]');
  if (initialized || !card) return;
  initialized = true;
  let active: HTMLElement | null = null, suppressed: HTMLElement | null = null;
  const id = 'gaga-link-preview';
  let pointer: {x:number; y:number} | null = null;
  card.id = id; card.setAttribute('role', 'tooltip');
  function unbind() {
    if (!active) return;
    const remaining = (active.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(value => value && value !== id);
    if (remaining.length) active.setAttribute('aria-describedby', remaining.join(' ')); else active.removeAttribute('aria-describedby');
  }
  function close() { card!.hidden = true; pointer = null; unbind(); }
  function position() {
    if (!active || card!.hidden) return;
    const rect = active.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) { close(); return; }
    const anchor = pointer ?? { x:rect.left, y:rect.bottom };
    const point = positionLinkPreview({left:anchor.x, top:anchor.y, bottom:anchor.y}, card!.getBoundingClientRect(), { width: innerWidth, height: innerHeight });
    card!.style.left = point.left + 'px'; card!.style.top = point.top + 'px'; card!.style.width = point.width + 'px';
  }
  let intentTimer:number|undefined, intentTarget:HTMLElement|null=null;
  const listeners=new Map<EventListenerOrEventListenerObject,EventListener>();
  const invoke=(listener:EventListenerOrEventListenerObject,event:Event)=>typeof listener==='function'?listener.call(document,event):listener.handleEvent(event);
  const addScopedListener:Document['addEventListener']=((type:string,listener:EventListenerOrEventListenerObject,options?:AddEventListenerOptions|boolean)=>{
    const wrapped:EventListener=event=>{
      const related=(event as PointerEvent|FocusEvent).relatedTarget;
      if((type==='pointerout'||type==='focusout')&&related instanceof Node&&card.contains(related))return;
      if(type==='pointerout'){if(intentTarget&&related instanceof Node&&intentTarget.contains(related))return;window.clearTimeout(intentTimer);intentTarget=null;}
      if(type==='pointerover'||type==='focusin'){
        const target=(event.target instanceof Element?event.target:null)?.closest<HTMLElement>('[data-gaga-preview]');
        if(!target)return;
        let url:URL;try{url=new URL(target.dataset.gagaPreviewHref??target.getAttribute('href')??'',location.href);}catch{return;}
        if(url.origin!==location.origin||!['http:','https:'].includes(url.protocol))return;
        if(type==='pointerover'){
          if((event as PointerEvent).pointerType!=='mouse')return;
          if(related instanceof Node&&target.contains(related))return;
          window.clearTimeout(intentTimer);intentTarget=target;const p=event as PointerEvent, delayedEvent=snapshotPreviewEvent(event);
          intentTimer=window.setTimeout(()=>{pointer={x:p.clientX,y:p.clientY};for(const field of card.querySelectorAll('[data-gaga-info-field]'))field.textContent='';if(target.isConnected)invoke(listener,delayedEvent);},120);return;
        }
      }
      if(type==='focusin')for(const field of card.querySelectorAll('[data-gaga-info-field]'))field.textContent='';
      invoke(listener,event);
    };
    listeners.set(listener,wrapped);document.addEventListener(type,wrapped,options);
  }) as Document['addEventListener'];
  // The public document port scopes Engine preview projection to its own card, never page metadata.
  const projection = {
    querySelector: ((selector: string) => selector === '[data-gaga-right-rail]' ? card : card.querySelector(selector)) as Document['querySelector'],
    querySelectorAll: card.querySelectorAll.bind(card) as Document['querySelectorAll'],
    addEventListener: addScopedListener,
    removeEventListener: ((type:string,listener:EventListenerOrEventListenerObject,options?:EventListenerOptions|boolean)=>{const wrapped=listeners.get(listener);if(wrapped){document.removeEventListener(type,wrapped,options);listeners.delete(listener);}}) as Document['removeEventListener'],
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
  document.addEventListener('pointermove', event => { if (event.pointerType !== 'mouse' || !active?.contains(event.target as Node)) return; pointer = {x:event.clientX,y:event.clientY}; position(); }, {passive:true});
  document.addEventListener('focusin', () => { pointer = null; position(); });
  card.dataset.gagaPreviewReady = 'true';
  const observer = new MutationObserver(() => {
    if (!card.hasAttribute('data-gaga-preview-state')) { close(); active = null; suppressed = null; }
  });
  observer.observe(card, { attributes: true, attributeFilter: ['data-gaga-preview-state'] });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !card.hidden) { event.preventDefault(); event.stopPropagation(); suppressed = active; close(); } }, { capture: true });
  document.addEventListener('scroll', position, { capture: true, passive: true });
  window.addEventListener('resize', position, { passive: true });
  window.addEventListener('pagehide', () => { window.clearTimeout(intentTimer);capability.cleanup(); observer.disconnect(); }, { once: true });
}
