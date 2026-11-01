import { createLayoutContextCapability } from '@gaga/engine-runtime/runtime/layout-context';
import { emitLayoutChanged } from '@gaga/engine-runtime/runtime/events';
import { getLayoutMode } from '../../config/systems';
import { resolveSurfacePlan } from '../../config/surface-projection.mjs';
import { contextViewport } from '../../lib/context-viewport';

let initialized = false;
export function initLayoutContext() {
  if (initialized) return;
  initialized = true;
  const root = document.documentElement;
  const rails = { left: document.querySelector<HTMLElement>('[data-gaga-left-rail]'), right: document.querySelector<HTMLElement>('[data-gaga-right-rail]') };
  let frame = 0;
  function project(notify = true) {
    frame = 0;
    const viewport = contextViewport();
    const values = { 'inline-size': viewport.viewportWidth, 'block-size': viewport.viewportHeight, left: viewport.viewportLeft, top: viewport.viewportTop, right: Math.max(0,root.clientWidth - viewport.viewportLeft - viewport.viewportWidth), bottom: Math.max(0,innerHeight - viewport.viewportTop - viewport.viewportHeight) };
    for (const [name,value] of Object.entries(values)) root.style.setProperty('--gaga-viewport-' + name, value + 'px');
    const plan = resolveSurfacePlan({ mode: root.dataset.gagaLayout, width: viewport.width, relevance: { left: !!rails.left, right: !!rails.right } });
    let changed = false;
    for (const side of ['left','right'] as const) {
      const rail = rails[side];
      if (rail && rail.dataset.gagaProjection !== plan[side]) { rail.dataset.gagaProjection = plan[side]; changed = true; }
    }
    if (changed && notify) emitLayoutChanged({ mode: root.dataset.gagaLayout ?? getLayoutMode(innerWidth) });
  }
  const capability = createLayoutContextCapability({ resolveLayoutMode: getLayoutMode, emitLayoutChanged(detail) { project(false); emitLayoutChanged(detail); } });
  const schedule = () => { if (!frame) frame = requestAnimationFrame(() => project()); };
  window.addEventListener('resize',schedule,{passive:true});
  window.visualViewport?.addEventListener('resize',schedule,{passive:true});
  window.visualViewport?.addEventListener('scroll',schedule,{passive:true});
  project(false);
  window.addEventListener('pagehide',event=>{
    if (event.persisted) return;
    capability.cleanup(); if(frame)cancelAnimationFrame(frame);
    window.removeEventListener('resize',schedule); window.visualViewport?.removeEventListener('resize',schedule); window.visualViewport?.removeEventListener('scroll',schedule);
  },{once:true});
}
