import { readAllHighlights, saveHighlight, removeHighlight, updateHighlightNote, resolveContentLanguage, type HighlightEntity, type HighlightLocation } from './reading-knowledge';
import { personalState, resolvePersonalAnchor } from '../../lib/personal-state';
import { currentPersonalContent, preparePersonalBlocks, personalBlock } from './personal-context';
import { captureSelectionTarget } from '@gaga/engine-runtime/runtime/annotation';
import { requestToast } from '@gaga/engine-runtime/runtime/events';
import { registerSiteCommand } from './site-commands';
import { positionLinkPreview } from '../../config/contextual-ux.mjs';
type SpeechMode = 'article'|'selection';
type SpeechState = 'idle'|'playing'|'paused'|'completed'|'error';
interface SpeakerController { state:SpeechState; mode:SpeechMode; currentText:string; rate:number; progress:number; voice:SpeechSynthesisVoice|null; playSelection:(text:string,lang:string)=>void; playArticle:(elements:HTMLElement[],lang:string)=>void; pause:()=>void; resume:()=>void; stop:()=>void; setRate:(rate:number)=>void; setVoice:(voice:SpeechSynthesisVoice)=>void; }
let activeSpeaker:SpeakerController|null=null, speechDockEl:HTMLElement|null=null, speechDockEmbedded=false;
let selectionMenuEl:HTMLElement|null=null, activeHighlightPopupEl:HTMLElement|null=null, popupAnchor:HTMLElement|null=null;
let initialized=false;
function getArticleMetadata(article:HTMLElement){const c=currentPersonalContent()?.content;return {route:c?.href??location.pathname,title:c?.title??document.querySelector('h1')?.textContent?.trim()??document.title,author:c?.author,topic:undefined,language:c?.language??resolveContentLanguage(article)};}
function focusReading(target:HTMLElement|null){if(!target?.isConnected)return;const temporary=!target.hasAttribute('tabindex');if(temporary){target.tabIndex=-1;target.addEventListener('blur',()=>target.removeAttribute('tabindex'),{once:true});}target.focus({preventScroll:true});}
function placeSurface(surface:HTMLElement,rect:DOMRect){surface.style.position='fixed';const p=positionLinkPreview(rect,surface.getBoundingClientRect(),{width:innerWidth,height:innerHeight});const island=document.querySelector<HTMLElement>('[data-gaga-action-runtime]')?.getBoundingClientRect();let top=p.top;if(island&&top<island.bottom&&top+surface.offsetHeight>island.top&&p.left<island.right&&p.left+p.width>island.left)top=island.bottom+surface.offsetHeight+8<innerHeight?island.bottom+8:Math.max(8,island.top-surface.offsetHeight-8);surface.style.left=p.left+'px';surface.style.top=top+'px';surface.style.width=p.width+'px';}
function textRangeForHighlight(element:HTMLElement,highlight:HighlightEntity):Range|null{
 const pos=resolvePersonalAnchor(element.textContent??'',highlight,element.dataset.gagaBlockHash??'');if(!pos)return null;
 const nodes:Text[]=[];const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);while(walker.nextNode())nodes.push(walker.currentNode as Text);
 let cursor=0,start:Text|undefined,end:Text|undefined,startOffset=0,endOffset=0;
 for(const node of nodes){const next=cursor+node.length;if(!start&&pos.start>=cursor&&pos.start<next){start=node;startOffset=pos.start-cursor;}if(pos.end>cursor&&pos.end<=next){end=node;endOffset=pos.end-cursor;break;}cursor=next;}
 if(!start||!end)return null;const range=document.createRange();range.setStart(start,startOffset);range.setEnd(end,endOffset);return range;
}
function wireHighlightClick(mark:HTMLElement,highlight:HighlightEntity){mark.addEventListener('click',e=>{if((e.target as Element)?.closest('a'))return;e.preventDefault();e.stopPropagation();showHighlightPopup(mark,highlight);});mark.addEventListener('keydown',e=>{if(e.target===mark&&(e.key==='Enter'||e.key===' ')){e.preventDefault();showHighlightPopup(mark,highlight);}});}
function applyHighlightToElement(block:HTMLElement,highlight:HighlightEntity){const range=textRangeForHighlight(block,highlight);if(!range||range.collapsed||Array.from(block.querySelectorAll('mark[data-gaga-highlight-id]')).some(mark=>range.intersectsNode(mark)))return false;const mark=document.createElement('mark');mark.className='gaga-highlight-mark';mark.dataset.gagaHighlightId=highlight.id;mark.id='hl-'+highlight.id;mark.tabIndex=0;mark.setAttribute('aria-label',highlight.note?'Sorotan dengan catatan pribadi':'Sorotan pribadi');if(highlight.note)mark.dataset.gagaHasNote='true';try{mark.appendChild(range.extractContents());range.insertNode(mark);wireHighlightClick(mark,highlight);return true;}catch{return false;}}
function restoreArticleHighlights(body:HTMLElement){const c=currentPersonalContent();if(!c)return;for(const h of readAllHighlights().filter(h=>h.contentIdentity===c.content.contentIdentity)){
 if(body.querySelector('[data-gaga-highlight-id="'+CSS.escape(h.id)+'"]'))continue;
 const block=personalBlock(body,h.location.blockId);const restored=!!block&&applyHighlightToElement(block,h);const resolution=restored?'resolved':'unresolved';if(h.resolution!==resolution)saveHighlight({...h,resolution,updatedAt:personalState.now()});
 }
 let id='';try{id=location.hash.startsWith('#hl-')?decodeURIComponent(location.hash.slice(4)):'';}catch{}if(id)body.querySelector<HTMLElement>('[data-gaga-highlight-id="'+CSS.escape(id)+'"]')?.scrollIntoView({block:'center'});
}
function closeHighlightPopup(restore=false){activeHighlightPopupEl?.remove();activeHighlightPopupEl=null;if(restore)focusReading(popupAnchor);popupAnchor=null;}
function showHighlightPopup(mark:HTMLElement,highlight:HighlightEntity){closeHighlightPopup();closeSelectionMenu();popupAnchor=mark;const popup=document.createElement('div');popup.className='gaga-highlight-popup';popup.setAttribute('role','dialog');popup.setAttribute('aria-modal','false');popup.setAttribute('aria-label','Sorotan pribadi');popup.innerHTML=`<div class="gaga-highlight-popup__inner"><div class="gaga-highlight-popup__actions"><button type="button" data-action="listen">Dengarkan</button><button type="button" data-action="copy">Salin</button><button type="button" data-action="note">${highlight.note?'Ubah catatan':'Catatan'}</button><button type="button" data-action="delete">Hapus sorotan</button><button type="button" data-action="close" aria-label="Tutup sorotan">×</button></div><div class="gaga-highlight-popup__note-form" hidden><textarea class="gaga-highlight-popup__textarea" rows="3" maxlength="4000" aria-label="Catatan pribadi"></textarea><button type="button" data-action="save-note">Simpan catatan</button></div></div>`;
 const textarea=popup.querySelector('textarea')!;textarea.value=highlight.note??'';document.body.append(popup);activeHighlightPopupEl=popup;placeSurface(popup,mark.getBoundingClientRect());const listen=popup.querySelector<HTMLButtonElement>('[data-action="listen"]')!;listen.hidden=!('speechSynthesis'in window);
 popup.querySelector('[data-action="close"]')?.addEventListener('click',()=>closeHighlightPopup(true));listen.addEventListener('click',()=>{listenToSelection(highlight.text,resolveContentLanguage(mark));closeHighlightPopup(true);});popup.querySelector('[data-action="copy"]')?.addEventListener('click',()=>{void copyTextToClipboard(highlight.text);closeHighlightPopup(true);});popup.querySelector('[data-action="note"]')?.addEventListener('click',()=>{(popup.querySelector('[data-gaga-note-editor],.gaga-highlight-popup__note-form') as HTMLElement).hidden=false;textarea.focus();placeSurface(popup,mark.getBoundingClientRect());});
 popup.querySelector('[data-action="save-note"]')?.addEventListener('click',()=>{if(updateHighlightNote(highlight.id,textarea.value)){highlight.note=textarea.value.trim();mark.dataset.gagaHasNote=highlight.note?'true':'false';closeHighlightPopup(true);}else requestToast({message:'Catatan belum tersimpan. Penyimpanan tidak tersedia.',tone:'warn'});});
 popup.querySelector('[data-action="delete"]')?.addEventListener('click',()=>{if(!removeHighlight(highlight.id)){requestToast({message:'Sorotan belum terhapus.',tone:'warn'});return;}const parent=mark.parentElement;mark.replaceWith(...mark.childNodes);closeHighlightPopup();focusReading(parent);});
 popup.querySelector<HTMLElement>('button:not([hidden])')?.focus({preventScroll:true});
}
interface SelectionCapture { range:Range; text:string; location:HighlightLocation; block:HTMLElement; blockText:string; content:NonNullable<ReturnType<typeof currentPersonalContent>>['content']; }
function captureSelection(body:HTMLElement,range:Range,selection:Selection):SelectionCapture|null{
 const current=currentPersonalContent();if(!current||current.body!==body||!body.contains(range.startContainer)||!body.contains(range.endContainer))return null;
 const target=captureSelectionTarget({contentId:current.content.contentIdentity,selection});if(!target||target.exactText.trim().length<2)return null;const block=personalBlock(body,target.blockId);if(!block?.dataset.gagaBlockHash)return null;
 return {range:range.cloneRange(),text:target.exactText,location:{blockId:target.blockId,startOffset:target.startOffset,endOffset:target.endOffset,prefix:target.prefix??'',suffix:target.suffix??'',blockHash:block.dataset.gagaBlockHash},block,blockText:block.textContent??'',content:current.content};
}
function captureIsCurrent(c:SelectionCapture){return currentPersonalContent()?.content.contentIdentity===c.content.contentIdentity&&c.block.isConnected&&c.block.textContent===c.blockText&&c.range.toString()===c.text;}
function persistCapture(c:SelectionCapture,note?:string,quoted=false){if(!captureIsCurrent(c)){requestToast({message:'Seleksi berubah. Pilih kembali teksnya.',tone:'warn'});return false;}const old=readAllHighlights().find(h=>h.contentIdentity===c.content.contentIdentity&&h.location.blockId===c.location.blockId&&h.location.startOffset===c.location.startOffset&&h.location.endOffset===c.location.endOffset&&h.text===c.text);if(Array.from(c.block.querySelectorAll<HTMLElement>('mark[data-gaga-highlight-id]')).some(mark=>mark.dataset.gagaHighlightId!==old?.id&&c.range.intersectsNode(mark))){requestToast({message:'Seleksi bertumpang tindih dengan sorotan. Buka sorotan yang ada untuk mengubahnya.',tone:'info'});return false;}const now=personalState.now(),meta=getArticleMetadata(c.block);const entity:HighlightEntity={...(old??{}),id:old?.id??crypto.randomUUID(),namespace:c.content.namespace,schemaVersion:1,contentIdentity:c.content.contentIdentity,contentType:c.content.contentType,articleId:c.content.href,canonicalUrl:c.content.canonicalUrl,articleTitle:c.content.title,author:c.content.author,language: meta.language,text:c.text,location:c.location,createdAt:old?.createdAt??now,updatedAt:now,note:note??old?.note,quoted:quoted||old?.quoted,resolution:'resolved'};
 if(!saveHighlight(entity)){requestToast({message:'Fragmen belum tersimpan. Penyimpanan tidak tersedia.',tone:'warn'});return false;}
 const body=currentPersonalContent()?.body;if(body&&!body.querySelector('[data-gaga-highlight-id="'+CSS.escape(entity.id)+'"]'))applyHighlightToElement(c.block,entity);window.getSelection()?.removeAllRanges();requestToast({message:quoted?'Kutipan tersimpan di perangkat ini.':note?'Catatan tersimpan di perangkat ini.':'Sorotan tersimpan di perangkat ini.',tone:'ok'});return true;
}
let selectionEpoch=0, dismissedSelection='', selectionReturn:HTMLElement|null=null;
function closeSelectionMenu(restore=false){selectionEpoch++;selectionMenuEl?.remove();selectionMenuEl=null;if(restore)focusReading(selectionReturn);selectionReturn=null;}
function initSelectionIntelligence(body:HTMLElement){let timer:number|undefined,entered=false;
 const handle=()=>{if(window.getSelection()?.isCollapsed&&!document.activeElement?.matches('.gaga-selection-menu textarea'))dismissedSelection='';window.clearTimeout(timer);const epoch=++selectionEpoch;timer=window.setTimeout(()=>{void(async()=>{
  if(selectionMenuEl?.contains(document.activeElement)&&(!window.getSelection()?.isCollapsed||document.activeElement?.matches('textarea')))return;
  const selection=window.getSelection();if(!selection||selection.isCollapsed||selection.rangeCount!==1||selection.toString().trim().length<2){closeSelectionMenu();return;}
  const range=selection.getRangeAt(0);const parent=range.startContainer.parentElement;if(parent?.closest('nav,button,input,textarea,[contenteditable],.gaga-selection-menu,.gaga-highlight-popup'))return;
  await preparePersonalBlocks(body);if(epoch!==selectionEpoch)return;const captured=captureSelection(body,range,selection);if(!captured){closeSelectionMenu();return;}
  const signature=captured.location.blockId+':'+captured.location.startOffset+':'+captured.location.endOffset+':'+captured.text;if(signature===dismissedSelection)return;renderSelectionMenu(captured);entered=false;
 })();},120);};
 document.addEventListener('selectionchange',handle);body.addEventListener('mouseup',handle);body.addEventListener('touchend',handle);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){const s=window.getSelection();if(s?.rangeCount){const r=s.getRangeAt(0),block=r.startContainer.parentElement?.closest<HTMLElement>('[data-gaga-block-id]');if(block){const before=r.cloneRange();before.selectNodeContents(block);before.setEnd(r.startContainer,r.startOffset);dismissedSelection=block.dataset.gagaBlockId+':'+before.toString().length+':'+(before.toString().length+r.toString().length)+':'+r.toString();}}closeSelectionMenu(true);closeHighlightPopup(true);}
  else if(event.key==='Tab'&&selectionMenuEl&&!entered&&!selectionMenuEl.contains(document.activeElement)){event.preventDefault();entered=true;selectionMenuEl.querySelector<HTMLElement>('button:not([hidden])')?.focus();}
 });
 document.addEventListener('pointerdown',e=>{const target=e.target as Element;if(!target.closest('.gaga-selection-menu,.gaga-highlight-popup,.gaga-highlight-mark')){closeSelectionMenu();closeHighlightPopup();}});
 window.addEventListener('resize',()=>{closeSelectionMenu();closeHighlightPopup();});
}
function renderSelectionMenu(c:SelectionCapture){closeSelectionMenu();const menu=document.createElement('div');menu.className='gaga-selection-menu';menu.setAttribute('role','toolbar');menu.setAttribute('aria-label','Aksi seleksi');
 menu.innerHTML="\n    <div class=\"gaga-selection-menu__bar\">\n      <button type=\"button\" class=\"gaga-selection-menu__btn\" data-gaga-action=\"selection-highlight\" title=\"Sorot Teks (H)\" aria-label=\"Sorot teks\">\n        <svg class=\"gaga-icon\" viewBox=\"0 0 24 24\" width=\"15\" height=\"15\" fill=\"currentColor\"><path d=\"M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z\"/></svg>\n        <span>Sorot</span>\n        <kbd>H</kbd>\n      </button>\n\n      <span class=\"gaga-selection-menu__sep\" aria-hidden=\"true\"></span>\n\n      <button type=\"button\" class=\"gaga-selection-menu__btn\" data-gaga-action=\"selection-listen\" title=\"Dengarkan Seleksi (S)\" aria-label=\"Dengarkan seleksi\">\n        <svg class=\"gaga-icon\" viewBox=\"0 0 24 24\" width=\"15\" height=\"15\" fill=\"currentColor\"><path d=\"M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z\"/></svg>\n        <span>Dengarkan</span>\n        <kbd>S</kbd>\n      </button>\n\n      <span class=\"gaga-selection-menu__sep\" aria-hidden=\"true\"></span>\n\n      <button type=\"button\" class=\"gaga-selection-menu__btn\" data-gaga-action=\"selection-copy\" title=\"Salin teks\" aria-label=\"Salin teks\">\n        <svg class=\"gaga-icon\" viewBox=\"0 0 24 24\" width=\"15\" height=\"15\" fill=\"currentColor\"><path d=\"M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z\"/></svg>\n        <span>Salin</span>\n      </button>\n\n      <span class=\"gaga-selection-menu__sep\" aria-hidden=\"true\"></span>\n\n      <button type=\"button\" class=\"gaga-selection-menu__btn\" data-gaga-action=\"selection-note\" title=\"Tambah Catatan\" aria-label=\"Tambah catatan\">\n        <svg class=\"gaga-icon\" viewBox=\"0 0 24 24\" width=\"15\" height=\"15\" fill=\"currentColor\"><path d=\"M19 3H4.99C3.89 3 3 3.9 3 5v14c0 1.1.89 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2z\"/></svg>\n        <span>Catatan</span>\n      </button>\n      <details class=\"gaga-selection-menu__more\"><summary aria-label=\"Aksi seleksi lainnya\">···</summary><button type=\"button\" data-gaga-action=\"selection-quote\">Simpan kutipan</button></details>\n    </div>\n\n    <div class=\"gaga-selection-menu__note-input\" hidden>\n      <textarea class=\"gaga-selection-menu__field\" aria-label=\"Catatan pribadi\" placeholder=\"Catatan pribadi\" rows=\"3\" maxlength=\"4000\"></textarea>\n      <button type=\"button\" class=\"gaga-btn gaga-btn--sm gaga-btn--primary\" data-gaga-action=\"save-selection-note\">Simpan</button>\n    </div>\n";
 document.body.append(menu);selectionMenuEl=menu;selectionReturn=c.block;placeSurface(menu,c.range.getBoundingClientRect());menu.querySelector<HTMLButtonElement>('[data-gaga-action="selection-listen"]')!.hidden=!('speechSynthesis'in window);
 menu.addEventListener('pointerdown',e=>{if((e.target as Element).closest('button,summary'))e.preventDefault();});
 menu.querySelector('[data-gaga-action="selection-highlight"]')?.addEventListener('click',()=>{if(persistCapture(c))closeSelectionMenu(true);});
 menu.querySelector('[data-gaga-action="selection-listen"]')?.addEventListener('click',()=>{if(captureIsCurrent(c))listenToSelection(c.text,c.content.language??'id');closeSelectionMenu(true);});
 menu.querySelector('[data-gaga-action="selection-copy"]')?.addEventListener('click',()=>{if(captureIsCurrent(c))void copyTextToClipboard(c.text);closeSelectionMenu(true);});
 const form=menu.querySelector<HTMLElement>('.gaga-selection-menu__note-input')!,field=menu.querySelector<HTMLTextAreaElement>('textarea')!,bar=menu.querySelector<HTMLElement>('.gaga-selection-menu__bar')!;
 menu.querySelector('[data-gaga-action="selection-note"]')?.addEventListener('click',()=>{form.hidden=false;bar.hidden=true;field.focus();placeSurface(menu,c.range.getBoundingClientRect());});
 menu.querySelector('[data-gaga-action="save-selection-note"]')?.addEventListener('click',()=>{if(field.value.trim()&&persistCapture(c,field.value.trim()))closeSelectionMenu(true);});
 menu.querySelector('[data-gaga-action="selection-quote"]')?.addEventListener('click',()=>{if(persistCapture(c,undefined,true))closeSelectionMenu(true);});
}
async function createHighlightFromSelection(range:Range,selection:Selection,_article:HTMLElement,note?:string){const current=currentPersonalContent();if(!current)return;await preparePersonalBlocks(current.body);const captured=captureSelection(current.body,range,selection);if(captured)persistCapture(captured,note);}
async function copyTextToClipboard(text:string){try{if(!navigator.clipboard?.writeText)throw Error('Unavailable');await navigator.clipboard.writeText(text);requestToast({message:'Teks disalin.',tone:'ok'});}catch{requestToast({message:'Papan klip tidak tersedia. Gunakan salin bawaan browser.',tone:'warn'});}}
export function listenToSelection(text:string,language='id'){if(!('speechSynthesis'in window)||!text.trim())return false;activeSpeaker??=initSmartSpeaker();activeSpeaker.playSelection(text,language);return true;}

function getSpeakableBlocks(article: HTMLElement): HTMLElement[] {
  const prose = article.querySelector<HTMLElement>(
    '.gaga-flagship-article__prose, .gaga-markdown-content, [data-gaga-reading-surface]'
  ) || article;
  return Array.from(prose.querySelectorAll<HTMLElement>('h2, h3, p, blockquote, li'))
    .filter((el) => el.innerText.trim().length > 0);
}

function initSmartSpeaker(): SpeakerController {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  let currentUtterance: SpeechSynthesisUtterance | null = null;
  let voices: SpeechSynthesisVoice[] = [];

  const updateVoices = () => {
    if (synth) voices = synth.getVoices();
  };
  updateVoices();
  synth?.addEventListener?.('voiceschanged', updateVoices);
  let keepAliveTimer: number | undefined;

  const startKeepAlive = () => {
    window.clearInterval(keepAliveTimer);
    keepAliveTimer = window.setInterval(() => {
      if (synth && synth.speaking && !synth.paused) {
        synth.pause();
        synth.resume();
      }
    }, 10000);
  };

  const stopKeepAlive = () => {
    window.clearInterval(keepAliveTimer);
  };

  const controller: SpeakerController = {
    state: 'idle',
    mode: 'article',
    currentText: '',
    rate: 1.0,
    progress: 0,
    voice: null,

    playSelection(text: string, lang: string) {
      if (!synth) {
        requestToast({ message: 'Sintesis suara tidak didukung peramban ini', tone: 'warn' });
        return;
      }
      this.stop();
      this.mode = 'selection';
      this.progress = 0;
      this.currentText = text;
      this.state = 'playing';

      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = lang;
      utt.rate = this.rate;

      const matchedVoice = voices.find((v) => v.lang.startsWith(lang.split('-')[0])) || null;
      if (matchedVoice) {
        utt.voice = matchedVoice;
        this.voice = matchedVoice;
      }

      utt.onboundary = event => { if (currentUtterance !== utt) return; this.progress = Math.min(1,event.charIndex / Math.max(1,text.length)); const bar = speechDockEl?.querySelector<HTMLProgressElement>('progress'); if (bar) bar.value = this.progress; };
      utt.onstart = () => {
        if(currentUtterance!==utt)return;
        this.state = 'playing';
        renderSpeechDock(this);
      };
      utt.onend = () => {
        if (currentUtterance !== utt) return;
        this.progress = 1;
        this.state = 'completed';
        renderSpeechDock(this);
        setTimeout(() => {
          if (this.state === 'completed' && currentUtterance === utt) this.stop();
        }, 2400);
      };
      utt.onerror = () => {
        if(currentUtterance!==utt)return;
        this.state = 'error';
        renderSpeechDock(this);
        requestToast({ message: 'Narasi suara tidak dapat diputar', tone: 'warn' });
        setTimeout(() => {
          if (this.state === 'error' && currentUtterance === utt) this.stop();
        }, 1800);
      };

      currentUtterance = utt;
      synth.speak(utt);
      renderSpeechDock(this);
      requestToast({ message: 'Memutar narasi pilihan', tone: 'ok' });
    },

    playArticle(elements: HTMLElement[], lang: string) {
      if (!synth) return;
      this.stop();
      this.mode = 'article';
      this.progress = 0;

      const validElements = elements.filter((el) => el.innerText.trim().length > 0);
      if (!validElements.length) {
        requestToast({ message: 'Tidak ada teks yang dapat dinarasikan', tone: 'warn' });
        return;
      }

      let currentIndex = 0;
      const matchedVoice = voices.find((v) => v.lang.startsWith(lang.split('-')[0])) || null;
      if (matchedVoice) this.voice = matchedVoice;

      const clearActiveBlockHighlight = () => {
        document.querySelectorAll('.gaga-speech-active-sentence').forEach((el) => {
          el.classList.remove('gaga-speech-active-sentence');
        });
      };

      const speakNextBlock = () => {
        if (this.state !== 'playing' || currentIndex >= validElements.length) {
          if (currentIndex >= validElements.length) {
            clearActiveBlockHighlight();
            this.progress = 1;
            this.state = 'completed';
            renderSpeechDock(this);
            const finishedUtterance=currentUtterance;
            setTimeout(() => {
              if (this.state === 'completed' && currentUtterance===finishedUtterance) this.stop();
            }, 2400);
          }
          return;
        }

        const el = validElements[currentIndex];
        const blockText = el.innerText.trim();
        clearActiveBlockHighlight();
        el.classList.add('gaga-speech-active-sentence');
        el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.dataset.gagaReaderMotion === 'reduced' ? 'auto' : 'smooth', block: 'nearest' });

        this.progress = currentIndex / validElements.length;
        this.currentText = blockText;
        renderSpeechDock(this);

        const utt = new SpeechSynthesisUtterance(blockText);
        utt.lang = lang;
        utt.rate = this.rate;
        if (matchedVoice) utt.voice = matchedVoice;

        utt.onend = () => {
          if (currentUtterance !== utt) return;
          currentIndex++;
          speakNextBlock();
        };

        utt.onerror = (err) => {
          if (currentUtterance !== utt) return;
          // Host error objects can contain utterance text; keep it browser-local.
          currentIndex++;
          speakNextBlock();
        };

        currentUtterance = utt;
        synth.speak(utt);
      };

      this.state = 'playing';
      startKeepAlive();
      speakNextBlock();
      requestToast({ message: 'Memulai narasi terpandu artikel', tone: 'ok' });
    },

    pause() {
      if (synth && this.state === 'playing') {
        synth.pause();
        this.state = 'paused';
        stopKeepAlive();
        renderSpeechDock(this);
      }
    },

    resume() {
      if (synth && this.state === 'paused') {
        synth.resume();
        this.state = 'playing';
        startKeepAlive();
        renderSpeechDock(this);
      }
    },

    stop() {
      this.state = 'idle';
      currentUtterance = null;
      stopKeepAlive();
      if (synth) {
        synth.cancel();
      }
      document.querySelectorAll('.gaga-speech-active-sentence').forEach((el) => {
        el.classList.remove('gaga-speech-active-sentence');
      });
      currentUtterance = null;
      this.progress = 0;
      this.state = 'idle';
      this.currentText = '';
      closeSpeechDock();
    },

    setRate(rate: number) {
      this.rate = rate;
      if (currentUtterance && this.state === 'playing' && this.mode === 'selection') {
        const text = this.currentText;
        const lang = currentUtterance.lang;
        this.stop();
        this.playSelection(text, lang);
        return;
      }
      // Article narration applies the new rate to the next block without
      // discarding the reader's current position.
      renderSpeechDock(this);
    },

    setVoice(voice: SpeechSynthesisVoice) {
      this.voice = voice;
      renderSpeechDock(this);
    }
  };

  return controller;
}

function syncSpeechActionState(controller?: SpeakerController | null) {
  const active = !!controller && (controller.state === 'playing' || controller.state === 'paused');
  document.querySelectorAll<HTMLButtonElement>('[data-gaga-action="speak"]').forEach((button) => {
    button.classList.toggle('gaga-is-active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function renderSpeechDock(controller: SpeakerController) {
  syncSpeechActionState(controller);
  if (controller.state === 'idle') {
    closeSpeechDock();
    return;
  }

  if (!speechDockEl) {
    const embeddedSurface = document.querySelector<HTMLElement>('[data-gaga-action-runtime-live]');
    if (embeddedSurface) {
      speechDockEl = embeddedSurface;
      speechDockEmbedded = true;
      speechDockEl.hidden = false;
      speechDockEl.setAttribute('role', 'region');
      speechDockEl.setAttribute('aria-label', 'Kontrol Narasi Suara');
      const runtime = speechDockEl.closest<HTMLElement>('[data-gaga-action-runtime]');
      if (runtime) {
        runtime.dataset.gagaLiveState = 'speaking';
        runtime.dataset.gagaState = 'expanded';
      }
    } else {
      speechDockEl = document.createElement('div');
      speechDockEl.className = 'gaga-speech-dock';
      speechDockEl.setAttribute('role', 'region');
      speechDockEl.setAttribute('aria-label', 'Kontrol Narasi Suara');
      document.body.appendChild(speechDockEl);
    }
  }

  const snippet =
    controller.currentText.length > 70
      ? controller.currentText.slice(0, 67) + '...'
      : controller.currentText;

  const focused = speechDockEl.contains(document.activeElement) ? (document.activeElement as HTMLElement)?.dataset.speech : null;
  speechDockEl.innerHTML = `
    <div class="gaga-speech-dock__inner">
      <div class="gaga-speech-dock__info">
        <span class="gaga-speech-dock__badge ${controller.mode === 'selection' ? 'gaga-speech-dock__badge--selection' : ''}">
          <span class="gaga-speech-dock__wave" aria-hidden="true">
            <span></span><span></span><span></span>
          </span>
          ${controller.mode === 'selection' ? 'Narasi Pilihan' : 'Narasi Lengkap'}
        </span>
        <span class="gaga-speech-dock__text" title="${escapeHtml(controller.currentText)}">${escapeHtml(snippet)}</span>
      </div>

      <progress max="1" value="${controller.progress}" aria-label="Kemajuan narasi${controller.mode === 'article' ? ' per bagian' : ''}"></progress>
      <div class="gaga-speech-dock__controls">
        ${
          controller.state === 'playing'
            ? `<button type="button" class="gaga-speech-dock__btn" data-speech="pause" aria-label="Jeda narasi">
                <svg class="gaga-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
               </button>`
            : `<button type="button" class="gaga-speech-dock__btn gaga-speech-dock__btn--play" data-speech="resume" aria-label="Lanjutkan narasi">
                <svg class="gaga-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
               </button>`
        }

        <button type="button" class="gaga-speech-dock__btn" data-speech="rate" aria-label="Kecepatan: ${controller.rate}x">
          ${controller.rate}x
        </button>

        <button type="button" class="gaga-speech-dock__btn gaga-speech-dock__btn--stop" data-speech="stop" aria-label="Hentikan narasi">
          <svg class="gaga-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>
        </button>
      </div>
    </div>
  `;

  const nextFocus = focused === 'pause' && controller.state === 'paused' ? 'resume' : focused === 'resume' && controller.state === 'playing' ? 'pause' : focused;
  if (nextFocus) speechDockEl.querySelector<HTMLElement>(`[data-speech="${nextFocus}"]`)?.focus({preventScroll:true});
  speechDockEl.querySelector('[data-speech="pause"]')?.addEventListener('click', () => controller.pause());
  speechDockEl.querySelector('[data-speech="resume"]')?.addEventListener('click', () => controller.resume());
  speechDockEl.querySelector('[data-speech="stop"]')?.addEventListener('click', () => controller.stop());
  speechDockEl.querySelector('[data-speech="rate"]')?.addEventListener('click', () => {
    const nextRate = controller.rate === 1.0 ? 1.25 : controller.rate === 1.25 ? 1.5 : 1.0;
    controller.setRate(nextRate);
  });
}

function closeSpeechDock() {
  syncSpeechActionState(null);
  if (!speechDockEl) return;

  if (speechDockEmbedded) {
    const restoreFocus = speechDockEl.contains(document.activeElement);
    const runtime = speechDockEl.closest<HTMLElement>('[data-gaga-action-runtime]');
    speechDockEl.innerHTML = '';
    speechDockEl.hidden = true;
    speechDockEl.removeAttribute('role');
    speechDockEl.removeAttribute('aria-label');
    if (runtime) {
      runtime.dataset.gagaLiveState = 'idle';
      runtime.dataset.gagaState = 'collapsed';
      runtime.querySelector('[data-gaga-action-island-toggle]')?.setAttribute('aria-expanded', 'false');
      if (restoreFocus) runtime.querySelector<HTMLElement>('[data-gaga-action-island-toggle]')?.focus({preventScroll:true});
    }
  } else {
    speechDockEl.remove();
  }

  speechDockEl = null;
  speechDockEmbedded = false;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* =========================================================================
   PUBLIC INITIALIZER
   ========================================================================= */

export async function initReaderEnhancements() {
  if(initialized)return; initialized=true;
  activeSpeaker ??= initSmartSpeaker();
  window.addEventListener('pagehide',()=>activeSpeaker?.stop(),{once:true});

  const article = currentPersonalContent()?.body ?? document.querySelector<HTMLElement>(
    '[data-gaga-article-shell], .gaga-flagship-article, [data-gaga-reading-surface]'
  );

  if (article) {
    const personal=currentPersonalContent();
    if(personal){await preparePersonalBlocks(personal.body);restoreArticleHighlights(personal.body);initSelectionIntelligence(personal.body);window.addEventListener('storage',event=>{if(event.key!==personalState.keys.annotations&&event.key!==null)return;const records=readAllHighlights();for(const mark of personal.body.querySelectorAll<HTMLElement>('mark[data-gaga-highlight-id]'))if(!records.some(h=>h.id===mark.dataset.gagaHighlightId)){mark.replaceWith(...mark.childNodes);}closeSelectionMenu();closeHighlightPopup();void preparePersonalBlocks(personal.body).then(()=>restoreArticleHighlights(personal.body));});}

    // Wire existing article speak button
    const speakButton = article.querySelector<HTMLButtonElement>('[data-gaga-speak-article]');
    if (speakButton) {
      speakButton.addEventListener('click', () => {
        if (activeSpeaker?.state === 'playing') {
          activeSpeaker.pause();
        } else if (activeSpeaker?.state === 'paused') {
          activeSpeaker.resume();
        } else {
          activeSpeaker?.playArticle(getSpeakableBlocks(article), resolveContentLanguage(article));
        }
      });
    }

    // Wire existing highlight selection button
    const highlightButton = article.querySelector<HTMLButtonElement>('[data-gaga-highlight-selection]');
    if (highlightButton) {
      highlightButton.addEventListener('click', () => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) {
          requestToast({ message: 'Pilih teks di dalam artikel terlebih dahulu', tone: 'warn' });
          return;
        }
        createHighlightFromSelection(sel.getRangeAt(0), sel, article);
      });
    }
  }

  // Connect to Gaga Action Runtime universal commands
  registerSiteCommand('highlight', () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      requestToast({ message: 'Pilih teks di dalam artikel terlebih dahulu (H)', tone: 'warn' });
      return false;
    }
    const currentArticle = currentPersonalContent()?.body ?? document.querySelector<HTMLElement>(
      '[data-gaga-article-shell], .gaga-flagship-article, [data-gaga-reading-surface]'
    );
    if (!currentArticle) return false;
    createHighlightFromSelection(sel.getRangeAt(0), sel, currentArticle);
    return true;
  });

  registerSiteCommand('speak', () => {
    const sel = window.getSelection();
    const currentArticle = currentPersonalContent()?.body ?? document.querySelector<HTMLElement>(
      '[data-gaga-article-shell], .gaga-flagship-article, [data-gaga-reading-surface]'
    );
    if (!currentArticle) return false;

    // If selection exists, read selection!
    if (sel && !sel.isCollapsed && sel.toString().trim()) {
      activeSpeaker?.playSelection(sel.toString().trim(), resolveContentLanguage(currentArticle));
      return true;
    }

    // Otherwise toggle full article reading!
    if (activeSpeaker?.state === 'playing') {
      activeSpeaker.pause();
    } else if (activeSpeaker?.state === 'paused') {
      activeSpeaker.resume();
    } else {
      activeSpeaker?.playArticle(getSpeakableBlocks(currentArticle), resolveContentLanguage(currentArticle));
    }
    return true;
  });
}
