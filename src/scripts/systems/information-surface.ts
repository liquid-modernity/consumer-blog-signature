import { contextViewport } from '../../lib/context-viewport';
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
  let positionFrame = 0;
  const schedulePosition = () => { if (!positionFrame) positionFrame = requestAnimationFrame(() => {positionFrame=0;position();}); };
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
    const viewport = contextViewport();
    if (rect.bottom < viewport.top || rect.top > viewport.top + viewport.height) { close(); return; }
    const anchor = pointer ?? { x:rect.left, y:rect.bottom };
    const point = positionLinkPreview({left:anchor.x, top:anchor.y, bottom:anchor.y}, card!.getBoundingClientRect(), viewport);
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
        if (document.querySelector('[data-gaga-outline-peek][data-gaga-state="open"]')) return;
        const target=(event.target instanceof Element?event.target:null)?.closest<HTMLElement>('[data-gaga-preview]');
        if(!target)return;
        let url:URL;try{url=new URL(target.dataset.gagaPreviewHref??target.getAttribute('href')??'',location.href);}catch{return;}
        if(url.origin!==location.origin||!['http:','https:'].includes(url.protocol))return;
        if(type==='focusin'){suppressed=null;pointer=null;}
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
  // A preview instance can schedule a deferred focus-out restore after cleanup.
  const previewTimers = new Set<number>();
  const previewWindow: Pick<Window, 'setTimeout' | 'clearTimeout'> = {
    setTimeout: ((handler: TimerHandler, delay?: number, ...args: unknown[]) => {
      if (typeof handler !== 'function') throw new TypeError('Preview timer requires a function');
      const id = window.setTimeout(() => { previewTimers.delete(id); handler(...args); }, delay);
      previewTimers.add(id);
      return id;
    }) as Window['setTimeout'],
    clearTimeout: ((id?: number) => {
      if (id !== undefined) { previewTimers.delete(id); window.clearTimeout(id); }
    }) as Window['clearTimeout']
  };
  const clearPreviewTimers = () => { for (const id of previewTimers) window.clearTimeout(id); previewTimers.clear(); };
  const createPreviewCapability = () => initEngineInformationSurface({
    document: projection,
    window: previewWindow,
    restoreDelayMs: getInformationPreviewRestoreDelayMs(),
    ctaText: 'Baca publikasi',
    getFeedback: ({ target, title, href }) => {
      let url: URL;
      try { url = new URL(href ?? '', location.href); } catch { close(); return undefined; }
      if (url.origin !== location.origin || !['http:', 'https:'].includes(url.protocol) || target === suppressed) return undefined;
      unbind(); active = target;
      const label = card.querySelector<HTMLElement>('[data-gaga-hover-preview-title]'); if (label) label.textContent = title;
      const meta = card.querySelector<HTMLElement>('[data-gaga-hover-preview-meta]'); if (meta) meta.textContent = target.dataset.gagaPreviewMeta ?? '';
      const reveal=()=>{
        if(active!==target||suppressed===target||!target.isConnected)return;
        card.hidden = pointer === null && matchMedia('(hover: none)').matches && !target.matches(':focus-visible');
        if(!card.hidden){target.setAttribute('aria-describedby', [...new Set((target.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean).concat(id))].join(' '));position();}
      };
      // Focus fires before the browser scrolls its target into view.
      if(target===document.activeElement){card.hidden=true;requestAnimationFrame(reveal);}else reveal();
      return undefined;
    }
  });
  let capability = createPreviewCapability();
  document.addEventListener('pointermove', event => { if (event.pointerType !== 'mouse' || !active?.contains(event.target as Node)) return; pointer = {x:event.clientX,y:event.clientY}; schedulePosition(); }, {passive:true});
  document.addEventListener('focusin', () => { pointer = null; schedulePosition(); });
  card.dataset.gagaPreviewReady = 'true';
  const observer = new MutationObserver(() => {
    if (!card.hasAttribute('data-gaga-preview-state')) { close(); active = null; suppressed = null; }
  });
  observer.observe(card, { attributes: true, attributeFilter: ['data-gaga-preview-state'] });
  const outline = document.querySelector<HTMLElement>('[data-gaga-outline-peek]');
  const outlineObserver = new MutationObserver(() => {
    if (outline?.dataset.gagaState !== 'open') return;
    window.clearTimeout(intentTimer); intentTarget = null; close(); active = null; suppressed = null;
    capability.cleanup(); clearPreviewTimers(); capability = createPreviewCapability();
  });
  if (outline) outlineObserver.observe(outline, { attributes: true, attributeFilter: ['data-gaga-state'] });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !card.hidden) { event.preventDefault(); event.stopPropagation(); suppressed = active; close(); } }, { capture: true });
  document.addEventListener('scroll', schedulePosition, { capture: true, passive: true });
  window.addEventListener('resize', schedulePosition, { passive: true });
  window.visualViewport?.addEventListener('resize',schedulePosition,{passive:true});window.visualViewport?.addEventListener('scroll',schedulePosition,{passive:true});
  window.addEventListener('pagehide',event=>{if(event.persisted)return;window.clearTimeout(intentTimer);if(positionFrame)cancelAnimationFrame(positionFrame);capability.cleanup();clearPreviewTimers();observer.disconnect();outlineObserver.disconnect();});
}
