let spineHome:Comment|undefined,returnCommands:(()=>void)|undefined;
export function attachNotchSpine(panel:HTMLElement){const spine=document.querySelector<HTMLElement>('[data-gaga-notch-spine]');if(!spine)return;if(!spineHome){spineHome=document.createComment('Notch spine position');spine.before(spineHome);}panel.prepend(spine);}
export function restoreNotchSpine(){const spine=document.querySelector<HTMLElement>('[data-gaga-notch-spine]');if(spine&&spineHome?.isConnected)spineHome.before(spine);}
export function prepareNotchReturn(){returnCommands?.();}
import {initSuperSearch} from './super-search';
import {closeContextSurface,contextSurfaceIsOpen} from './context-surface';

  import { actionForCommand } from '../../config/actions';
  import { resolveNotchPresentation } from '../../config/contextual-ux.mjs';
  import { onRuntimeEvent, requestOutline, requestReaderPanel } from '@gaga/engine-runtime/runtime/events';
  import { runSiteCommand, registerSiteCommand } from './site-commands';
  import { contextViewport } from '../../lib/context-viewport';
  import { signatureMotion } from '../../config/signature-motion.mjs';
  import { closeSuperShare, currentShareContext } from './super-share';

  export function initNotch() {
    const candidate = document.querySelector<HTMLElement>('[data-gaga-action-runtime]');
    if (!candidate || candidate.dataset.wired === 'true') return;
    const island = candidate;
    island.dataset.wired = 'true';
    if (!currentShareContext()) island.querySelectorAll<HTMLElement>('[data-gaga-action="share-page"]').forEach(button => button.hidden = true);
    const container = island.closest<HTMLElement>('[data-gaga-action-runtime-container]')!;
    const toggle = island.querySelector<HTMLButtonElement>('[data-gaga-action-island-toggle]')!;
    const context = island.querySelector<HTMLElement>('[data-gaga-notch-context]')!;
    const system = island.querySelector<HTMLElement>('[data-gaga-notch-system]')!;
    const more = island.querySelector<HTMLButtonElement>('[data-gaga-notch-more]')!;
    const reader = island.querySelector<HTMLElement>('[data-gaga-reader-panel]');
    const search = island.querySelector<HTMLElement>('[data-gaga-notch-search]')!;
    let hoverTimer = 0, touchTimer = 0;
    const spine = island.querySelector<HTMLElement>('[data-gaga-notch-spine]')!;
    const capabilityLabel=spine.querySelector<HTMLElement>('[data-gaga-notch-capability-label]')!;
    const back=spine.querySelector<HTMLButtonElement>('[data-gaga-action="smart-back"]')!;
    const title=island.querySelector<HTMLElement>('[data-gaga-island-focus-title]');
    let titleVisible=true;
    function capability(){return island.dataset.gagaShareOpen==='true'?'share':readerOpen()&&!island.hasAttribute('data-gaga-reader-closing')?'reader':!island.querySelector<HTMLElement>('[data-gaga-action-runtime-live]')!.hidden?'audio':!search.hidden?'search':contextSurfaceIsOpen()?'information':island.dataset.gagaState==='expanded'?'navigation':'';}
    function project(){
      const state=island.dataset.gagaState,cap=capability();island.dataset.gagaNotchCapability=cap;
      const names:Record<string,string>={share:'Super Share',reader:'Tampilan',audio:'Dengarkan',search:'Cari',information:'Informasi',navigation:'Navigasi'};
      if(capabilityLabel.textContent!==(names[cap]??''))capabilityLabel.textContent=names[cap]??'';if(capabilityLabel.hidden!==!cap)capabilityLabel.hidden=!cap;
      island.setAttribute('aria-label',names[cap]??island.dataset.gagaI18nId??'Navigasi');island.setAttribute('role','navigation');
      const label=cap?'Kembali ke aksi':'Kembali';back.setAttribute('aria-label',label);back.dataset.gagaI18nId=label;back.dataset.gagaI18nEn=cap?'Back to actions':'Back';back.disabled=!cap&&location.pathname==='/';
      const hideContext=state==='collapsed'||state==='micro'||['share','reader','audio','information'].includes(cap);
      if(context.hidden!==hideContext){context.hidden=hideContext;context.inert=hideContext;}
      const hideSystem=state!=='expanded'||!!cap&&cap!=='navigation';if(system.hidden!==hideSystem){system.hidden=hideSystem;system.inert=hideSystem;}
      if(title&&title.hidden!==(titleVisible||!!cap))title.hidden=titleVisible||!!cap;
      const level=state==='expanded'?'2':state==='peek'?'1':'0';island.dataset.gagaLevel=level;toggle.setAttribute('aria-expanded',String(level!=='0'));more.setAttribute('aria-expanded',String(level==='2'));
    }
    const h1=document.querySelector('main h1');if(h1){const titleObserver=new IntersectionObserver(entries=>{titleVisible=entries[0].isIntersecting;project();});titleObserver.observe(h1);window.addEventListener('pagehide',event=>{if(!event.persisted)titleObserver.disconnect();},{once:true});}
    const clearSearch=initSuperSearch(search as HTMLFormElement,()=>{search.hidden=true;search.inert=true;clearSearch();setState('peek');});
    function closeActive(){
      if(closeSuperShare(true))return true;
      if(!search.hidden){search.hidden=true;search.inert=true;clearSearch();setState('peek');island.querySelector<HTMLElement>('[data-gaga-notch-search-toggle]')?.focus();return true;}
      if(readerOpen()){requestReaderPanel({action:'close',source:'keyboard'});requestAnimationFrame(()=>island.querySelector<HTMLElement>('[data-gaga-action="toggle-reader-preferences"]')?.focus({preventScroll:true}));return true;}
      const live=island.querySelector<HTMLElement>('[data-gaga-action-runtime-live]')!;if(!live.hidden){live.querySelector<HTMLButtonElement>('[data-speech="stop"]')?.click();setState('peek');toggle.focus();return true;}
      if(contextSurfaceIsOpen()){closeContextSurface();setState('peek');return true;}
      return false;
    }
    function openSearch(){closeActive();setState('peek');search.hidden=false;search.inert=false;island.querySelector('[data-gaga-notch-search-toggle]')?.setAttribute('aria-expanded','true');project();inputFocus();return true;}
    function inputFocus(){search.querySelector('input')?.focus({preventScroll:true});}
    registerSiteCommand('open-search',openSearch);

    const readerOpen = () => reader?.dataset.gagaState === 'open';
    function setState(state: 'collapsed' | 'peek' | 'expanded', restore = false) {
      if (state !== 'expanded' && readerOpen()) requestReaderPanel({ action: 'close', source: 'click' });
      island.dataset.gagaState = state;
      if (state === 'collapsed') { search.hidden = true; search.inert = true; island.querySelector('[data-gaga-notch-search-toggle]')?.setAttribute('aria-expanded','false'); }
      if (state !== 'collapsed') requestOutline({ action: 'close', source: 'notch-open' });
      project();if (restore) (state === 'peek' ? more : toggle).focus({ preventScroll: true });
    }
    returnCommands=()=>{island.dataset.gagaState='peek';project();};
    const stateObserver=new MutationObserver(project);stateObserver.observe(island,{subtree:true,attributes:true,attributeFilter:['data-gaga-state','data-gaga-share-open','data-gaga-live-state','hidden']});
    function position() {
      const preset = resolveNotchPresentation(JSON.parse(container.dataset.gagaNotchConfig!), contextViewport().width);
      container.dataset.gagaNotchPlacement = preset.placement; container.dataset.gagaNotchShape = preset.shape;
    }
    island.addEventListener('pointerenter', event => { clearTimeout(hoverTimer); if (event.pointerType === 'mouse' && island.dataset.gagaState === 'collapsed') hoverTimer = window.setTimeout(() => setState('peek'), signatureMotion.hoverMs); });
    island.addEventListener('pointerleave', event => { clearTimeout(hoverTimer); if (event.pointerType === 'mouse') hoverTimer = window.setTimeout(() => { if (island.dataset.gagaState === 'peek' && !island.matches(':focus-within')) setState('collapsed'); }, signatureMotion.leaveMs); });
    island.addEventListener('touchstart', () => { if (island.dataset.gagaState === 'collapsed') touchTimer = window.setTimeout(() => setState('peek'), signatureMotion.holdMs); }, { passive: true });
    island.addEventListener('touchend', () => clearTimeout(touchTimer), { passive: true });
    island.addEventListener('touchcancel', () => clearTimeout(touchTimer), { passive: true });
    island.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target || target.closest('[data-gaga-reader-panel]')&&!target.closest('[data-gaga-notch-spine]')) return;
      if(target.closest('[data-gaga-action="smart-back"]')&&closeActive()){event.preventDefault();return;}
      if (target.closest('[data-gaga-action-island-toggle]')) { if(closeActive()){event.preventDefault();return;} clearTimeout(hoverTimer); setState(island.dataset.gagaState === 'collapsed' ? 'peek' : 'collapsed'); return; }
      if(target.closest('[data-gaga-notch-search-toggle]')){if(!search.hidden)closeActive();else openSearch();return;}
      if (target.closest('[data-gaga-notch-more]')) { setState(island.dataset.gagaState === 'expanded' ? 'peek' : 'expanded'); return; }
      if (target.closest('a[href], summary')) return;
      const button = target.closest<HTMLButtonElement>('[data-gaga-action]');
      // Let the single Engine Save listener receive the real click exactly once.
      if (button?.dataset.gagaAction === 'save-reading') return;
      const action = actionForCommand(button?.dataset.gagaAction);
      if (button && action?.command) {
        event.preventDefault(); event.stopPropagation();
        if (action.command === 'toggle-reader-preferences') setState('expanded');
        if (action.command === 'toggle-outline') {
          setState('collapsed');
          runSiteCommand(action.command, { source: 'click', target: document.querySelector<HTMLElement>('[data-gaga-outline-opener]') });
          return;
        }
        runSiteCommand(action.command, { source: 'click', target: button, pointer: { x: event.clientX, y: event.clientY } });
        return;
      }
      if (target.closest('[data-gaga-island-bar]')) setState('expanded');
    });
    island.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      event.preventDefault(); event.stopPropagation();
      if(closeActive())return;
      setState(island.dataset.gagaState === 'expanded' ? 'peek' : 'collapsed', true);
    });
    // Native click distinguishes an outside tap from a touch pan.
    document.addEventListener('click', event => {
      if (event.target instanceof Node && !island.contains(event.target)&&!contextSurfaceIsOpen()) {
        const closedReader = readerOpen();
        setState('collapsed');
        if (closedReader) requestAnimationFrame(() => toggle.focus({ preventScroll: true }));
      }
    }, { passive: true });
    onRuntimeEvent('readerPanelCommand', detail => { if (detail.action !== 'close') closeSuperShare(); if (detail.action === 'open' || detail.action === 'toggle' && !readerOpen()) setState('expanded'); });
    onRuntimeEvent('layoutChanged', position);
    window.visualViewport?.addEventListener('resize',position,{passive:true});
    window.addEventListener('resize', position, { passive: true });
    window.addEventListener('pagehide', event => { if(!event.persisted)stateObserver.disconnect(); clearTimeout(hoverTimer); clearTimeout(touchTimer); }, { once: true });
    position(); setState('collapsed');project();
  }
