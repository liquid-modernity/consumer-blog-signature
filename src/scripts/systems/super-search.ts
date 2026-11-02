import {loadPublicSearch,searchPublicIndex} from '../../lib/public-search';
import {searchRank,normalizeSearch} from '@gaga/arsenal/search';
import {runSiteCommand} from './site-commands';
import type {GagaActionCommand} from '../../config/actions';
export function initSuperSearch(form:HTMLFormElement,close:()=>void){
 const input=form.querySelector<HTMLInputElement>('input')!,list=form.querySelector<HTMLElement>('[data-gaga-search-suggestions]')!,status=form.querySelector<HTMLElement>('[role="status"]')!,all=form.querySelector<HTMLAnchorElement>('[data-gaga-search-all]')!;
 const commands=Array.from(document.querySelectorAll<HTMLButtonElement>('[data-gaga-action-runtime-actions] [data-gaga-action]')).filter(b=>!b.hidden&&['share-page','toggle-reader-preferences','speak'].includes(b.dataset.gagaAction??''));
 let revision=0,selected=-1;let entries:{id:string;title:string;href?:string;command?:GagaActionCommand}[]=[];
 input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-controls',list.id);input.setAttribute('aria-expanded','false');
 function active(){for(const [index,el]of Array.from(list.children).entries())el.setAttribute('aria-selected',String(index===selected));if(selected>=0)input.setAttribute('aria-activedescendant',list.children[selected].id);else input.removeAttribute('aria-activedescendant');}
 function clear(){entries=[];selected=-1;list.replaceChildren();input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');}
 async function update(){const epoch=++revision,q=normalizeSearch(input.value);clear();all.hidden=!q;all.href=form.action+'?q='+encodeURIComponent(input.value.trim());status.textContent='';if(!q)return;
  try{const data=await loadPublicSearch();if(epoch!==revision)return;entries=searchPublicIndex(data,q,6).map(r=>({id:r.id,title:r.title,href:new URL(r.href,location.href).pathname}));
   const command=commands.find(b=>searchRank(b.getAttribute('aria-label'),q)>=40);if(command&&entries.length<6)entries.push({id:'command-'+command.dataset.gagaAction,title:command.getAttribute('aria-label')!,command:command.dataset.gagaAction as GagaActionCommand});
   for(const [index,entry]of entries.entries()){const option=document.createElement(entry.href?'a':'button');option.id='gaga-search-result-'+index;option.setAttribute('role','option');option.setAttribute('aria-selected','false');option.tabIndex=-1;option.textContent=entry.title;if(option instanceof HTMLAnchorElement)option.href=entry.href!;else(option as HTMLButtonElement).type='button';option.addEventListener('pointermove',()=>{selected=index;active();});option.addEventListener('click',event=>{if(entry.command){event.stopPropagation();close();runSiteCommand(entry.command,{source:'click',target:command});}});list.append(option);}
   input.setAttribute('aria-expanded',String(entries.length>0));status.textContent=entries.length?`${entries.length} hasil`:'Belum ada hasil.';
  }catch{if(epoch===revision)status.textContent='Pencarian belum tersedia. Buka semua hasil.';}
 }
 input.addEventListener('input',()=>void update());input.addEventListener('keydown',event=>{if(!entries.length||!['ArrowDown','ArrowUp'].includes(event.key))return;event.preventDefault();selected=event.key==='ArrowDown'?(selected+1)%entries.length:(selected<=0?entries.length-1:selected-1);active();});
 form.addEventListener('submit',event=>{if(selected<0)return;event.preventDefault();const entry=entries[selected];if(entry.href)location.assign(entry.href);else if(entry.command){close();runSiteCommand(entry.command,{source:'keyboard',target:commands.find(b=>b.dataset.gagaAction===entry.command)});}});
 return ()=>{revision++;clear();};
}
