import { createWindowScrollContext } from '@gaga/engine-runtime/runtime/scroll-context';
import { resolveReadingScrollContext } from './reading-scroll';
import { onRuntimeEvent } from '@gaga/engine-runtime/runtime/events';
import { signatureMotion as policy, initialScrollIntent, resolveScrollIntent, signatureVisibility, notchGeometry, signatureReducedMotion } from '../../config/signature-motion.mjs';

let cleanup: (() => void) | undefined;
export function initSignatureMotion() {
  cleanup?.();
  const container = document.querySelector<HTMLElement>('[data-gaga-action-runtime-container]');
  const notch = container?.querySelector<HTMLElement>('[data-gaga-action-runtime]');
  if (!container || !notch) return;
  const outline = document.querySelector<HTMLElement>('[data-gaga-outline-stack]');
  const sheet = outline?.querySelector<HTMLElement>('[data-gaga-outline-peek]');
  const reader = notch.querySelector<HTMLElement>('[data-gaga-reader-panel]');
  const search = notch.querySelector<HTMLElement>('[data-gaga-notch-search]');
  const live = notch.querySelector<HTMLElement>('[data-gaga-action-runtime-live]');
  const primary = notch.querySelector<HTMLElement>('[data-gaga-action-runtime-actions]');
  const overflow = notch.querySelector<HTMLElement>('[data-gaga-notch-overflow]');
  const movable = Array.from(primary?.querySelectorAll<HTMLElement>('[data-gaga-action-id="focusmode"], [data-gaga-action-id="speak"]') ?? []);
  const markers = movable.map(button => { const marker = document.createComment('command position'); button.before(marker); return marker; });
  const progress = notch.querySelector<HTMLElement>('[data-gaga-reading-progress]');
  const progressLabel = notch.querySelector<HTMLElement>('[data-gaga-reading-progress-value]');
  const outlineProgress = outline?.querySelector<HTMLProgressElement>('[data-gaga-outline-progress]');
  const outlineOpener = outline?.querySelector<HTMLElement>('[data-gaga-outline-opener]');
  const outlineLabel = outline?.querySelector<HTMLElement>('[data-gaga-outline-current-label]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let context = resolveReadingScrollContext();
  let body: HTMLElement | undefined;
  let contentEnd = 0, frame = 0, active = false, geometryDirty = true;
  let intent = initialScrollIntent(context?.scrollContext.measure().scrollTop ?? 0);
  let unsubscribe: (() => void) | undefined;
  let pointerNotch = false, pointerOutline = false;
  let notchState = 'visible', outlineState = 'visible';
  const releases: (() => void)[] = [];
  const listen = (target: EventTarget, name: string, handler: EventListener, options?: AddEventListenerOptions | boolean) => {
    target.addEventListener(name, handler, options); releases.push(() => target.removeEventListener(name, handler, options));
  };
  for (const [token, value] of [['reveal',policy.revealMs],['retract',policy.retractMs],['geometry',policy.geometryMs],['context',policy.contextMs]] as const)
    document.documentElement.style.setProperty('--gaga-signature-' + token, value + 'ms');

  function measureBoundary() {
    if (!context || !body) return;
    // Body excludes metadata/footer chrome; the scroll owner itself has no fixed elementTop.
    contentEnd = body === context.owner ? body.scrollHeight : context.scrollContext.measure().scrollTop + context.scrollContext.elementTop(body) + body.scrollHeight;
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  const resize = new ResizeObserver(() => { geometryDirty = true; schedule(); });
  function bind() {
    unsubscribe?.(); resize.disconnect(); context = resolveReadingScrollContext();
    if (context?.owner === document.scrollingElement) context.scrollContext = createWindowScrollContext();
    body = document.querySelector<HTMLElement>('[data-gaga-article-body], [data-gaga-document-body]') ?? context?.readingElement;
    if (context) { unsubscribe = context.scrollContext.addChangeListener(schedule); resize.observe(context.owner); }
    if (body) resize.observe(body);
    active = false; intent = initialScrollIntent(context?.scrollContext.measure().scrollTop ?? 0);
    notchState = outlineState = 'visible'; geometryDirty = true; schedule();
  }
  function project() {
    container!.dataset.gagaSignatureState = notchState;
    if (outline) outline.dataset.gagaSignatureState = outlineState;
  }
  function reveal() { notchState = outlineState = 'visible'; project(); }
  function update() {
    frame = 0;
    if (!context) return;
    if (geometryDirty) { measureBoundary(); geometryDirty = false; }
    const m = context.scrollContext.measure();
    const pins = {
      notch: pointerNotch || notch!.contains(document.activeElement) || !['collapsed','micro'].includes(notch!.dataset.gagaState ?? 'collapsed') || reader?.dataset.gagaState === 'open' || !!live && !live.hidden,
      outline: pointerOutline || !!outline?.contains(document.activeElement) || sheet?.dataset.gagaState === 'open'
    };
    const released = notchState === 'pinned' && !pins.notch || outlineState === 'pinned' && !pins.outline;
    if (released) intent = { ...initialScrollIntent(m.scrollTop), signal: 'hold' };
    else intent = resolveScrollIntent(intent, { position: m.scrollTop, viewport: m.viewportHeight, contentEnd, active });
    notchState = signatureVisibility(notchState, intent.signal, pins.notch);
    outlineState = signatureVisibility(outlineState, intent.signal, pins.outline);
    project();
    const percent = Math.round(context.scrollContext.readingProgress(body ?? context.readingElement));
    progress?.setAttribute('aria-valuenow', String(percent));
    if (progressLabel) progressLabel.textContent = percent + '%';
    if (outlineProgress) outlineProgress.value = percent;
    outlineOpener?.setAttribute('aria-label', `Daftar isi — ${outlineLabel?.textContent ?? ''} — ${percent}%`);
    const isReduced = signatureReducedMotion(reduced.matches, document.documentElement.dataset.gagaReaderMotion);
    document.documentElement.dataset.gagaSignatureReduced = String(isReduced);
    // Reparent existing delegated controls, never a focused control or an active interaction.
    if (primary && overflow && !notch!.contains(document.activeElement) && reader?.dataset.gagaState !== 'open') {
      movable.forEach((button, index) => {
        if (innerWidth < policy.narrowWidth) { if (button.parentElement !== overflow) overflow.append(button); }
        else if (button.parentElement !== primary) markers[index].after(button);
      });
    }
    const actions = primary ? Array.from(primary.children).filter(el => el instanceof HTMLElement && !el.hidden).length : 0;
    const geometry = notchGeometry({state:notch!.dataset.gagaState,search:!!search && !search.hidden,audio:!!live && !live.hidden,panel:reader?.dataset.gagaState==='open',viewport:innerWidth,actions});
    notch!.dataset.gagaNotchGeometry = geometry.geometry;
    notch!.style.setProperty('--gaga-notch-min', geometry.min + 'px');
    notch!.style.setProperty('--gaga-notch-max', geometry.max + 'px');
  }
  // Only actual reading intent can retract; restoration/deep-link positioning starts revealed.
  const userIntent: EventListener = event => {
    if (event.target instanceof Element && event.target.closest('[data-gaga-action-runtime], [data-gaga-outline-stack], input, textarea, select, [contenteditable]')) return;
    if (event instanceof KeyboardEvent && !['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)) return;
    active = true;
  };
  listen(document, 'wheel', userIntent, {passive:true,capture:true});
  listen(document, 'touchmove', userIntent, {passive:true,capture:true});
  listen(document, 'keydown', userIntent, true);
  listen(document, 'keydown', event => {
    if ((event as KeyboardEvent).key === 'Tab' && !(event.target instanceof Element && event.target.closest('[data-gaga-selection-action]'))) reveal();
  }, true);
  listen(document, 'focusin', () => { if (notch.contains(document.activeElement)) {notchState='pinned';project();} if (outline?.contains(document.activeElement)) {outlineState='pinned';project();} schedule(); }, true);
  listen(document, 'focusout', schedule, true);
  for (const [surface, isNotch] of [[notch,true],[outline,false]] as const) if (surface) {
    listen(surface,'pointerenter', event => { if (fine.matches && (event as PointerEvent).pointerType !== 'touch') {if(isNotch)pointerNotch=true;else pointerOutline=true;schedule();} });
    listen(surface,'pointerleave', () => {if(isNotch)pointerNotch=false;else pointerOutline=false;schedule();});
  }
  const stateObserver = new MutationObserver(schedule);
  stateObserver.observe(notch,{subtree:true,attributes:true,attributeFilter:['data-gaga-state','data-gaga-live-state','hidden']});
  if(sheet) stateObserver.observe(sheet,{attributes:true,attributeFilter:['data-gaga-state']});
  stateObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-gaga-reader-motion']});
  listen(reduced,'change',schedule);
  listen(window,'resize',() => {geometryDirty=true;schedule();},{passive:true});
  listen(window,'hashchange',bind);
  const unlayout = onRuntimeEvent('layoutChanged',bind);
  bind(); update();
  cleanup = () => { unsubscribe?.();unlayout();resize.disconnect();stateObserver.disconnect();if(frame)cancelAnimationFrame(frame);releases.forEach(fn=>fn());markers.forEach((marker,index)=>{marker.after(movable[index]);marker.remove();});cleanup=undefined; };
  window.addEventListener('pagehide', () => cleanup?.(), {once:true});
}
window.addEventListener('pageshow',event=>{if(event.persisted)initSignatureMotion();});
