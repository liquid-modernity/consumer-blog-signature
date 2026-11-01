import {onRuntimeEvent,type ToastDetail} from '@gaga/engine-runtime/runtime/events';
import {feedbackSurfaceRoles} from '../../config/contextual-surfaces.mjs';
import {contextViewport} from '../../lib/context-viewport';
let toast:HTMLOutputElement|undefined,timer=0;
function position(){if(!toast)return;const v=contextViewport();toast.style.left=(v.left+v.width/2)+'px';toast.style.bottom='calc('+Math.max(0,innerHeight-v.top-v.height+56)+'px + var(--gaga-safe-area-bottom,0px))';toast.style.maxWidth=Math.max(1,v.width-32)+'px';}
export function initToast(){window.addEventListener('resize',position,{passive:true});window.visualViewport?.addEventListener('resize',position,{passive:true});onRuntimeEvent('toastRequested',(detail:ToastDetail)=>{
 if(!detail.message)return;
 if(!toast){toast=document.createElement('output');toast.className='gaga-toast';toast.dataset.gagaFeedbackSurface=feedbackSurfaceRoles.status;toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');toast.setAttribute('aria-atomic','true');document.body.append(toast);}
 toast.textContent=detail.message;toast.dataset.gagaState='visible';toast.dataset.gagaTone=detail.tone??'info';
 position();
 clearTimeout(timer);timer=window.setTimeout(()=>{if(toast)toast.dataset.gagaState='hidden';},Math.max(2400,Math.min(5000,detail.message.length*55)));
});}
