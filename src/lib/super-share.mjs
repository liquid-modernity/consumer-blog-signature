import { personalCanonicalOrigin } from '../config/personal-state.mjs';
// Public source identity only; personal annotations and browser preview origins never enter payloads.
export function resolveShareContext(input) {
 if(typeof input?.contentIdentity!=='string' || !input.contentIdentity.trim() || typeof input.title!=='string' || !input.title.trim())return null;
 let url;try{url=new URL(input.canonicalUrl);if(url.origin!==personalCanonicalOrigin||url.username||url.password)return null;}catch{return null;}
 url.hash='';url.search='';
 const selection=typeof input.selection==='string'&&input.selection.trim()?input.selection:undefined;
 const anchor=selection&&typeof input.anchor==='string'&&input.anchor&&!/[\s\u0000-\u001f]/.test(input.anchor)?input.anchor:undefined;
 const author=typeof input.author==='string'&&input.author.trim()?input.author.trim():undefined;
 const date=typeof input.date==='string'&&/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(input.date)&&Number.isFinite(Date.parse(input.date))?input.date:undefined;
 return Object.freeze({contentIdentity:input.contentIdentity,title:input.title.trim(),canonicalUrl:url.href,author,date,selection,anchor});
}
export function shareSourceUrl(context){const url=new URL(context.canonicalUrl);if(context.anchor)url.hash=context.anchor;return url.href;}
export function shareCopy(context,kind){
 if(kind==='link')return context.canonicalUrl;
 if(kind==='rich')return context.title+'\n'+context.canonicalUrl;
 if(kind==='quote')return context.selection?context.selection+'\n\n— '+context.title+(context.author?' · '+context.author:'')+'\n'+shareSourceUrl(context):null;
 if(kind==='reference')return (context.author?context.author+'. ':'')+context.title+(context.date?' ('+context.date+')':'')+'. '+context.canonicalUrl;
 return null;
}
export function sharePayload(context){return {title:context.title,url:shareSourceUrl(context),...(context.selection?{text:context.selection}:{})};}
export function shareActions(context,{native=false,clipboard=false}={}){return context?{link:clipboard,rich:clipboard,quote:clipboard&&!!context.selection,reference:clipboard,text:true,poster:context.title.length<=240&&(!context.selection||context.selection.length<=600),native}:null;}
export function textCard(context){return (context.selection?shareCopy(context,'quote'):context.title+(context.author?'\n'+context.author:'')+(context.date?'\n'+context.date:'')+'\n'+context.canonicalUrl)+'\n';}
export function posterInput(context){return Object.freeze({title:context.title,quote:context.selection??'',byline:[context.author,context.date].filter(Boolean).join(' · '),source:shareSourceUrl(context)});}
export function wrapPosterText(text,width,measure){const lines=[];for(const paragraph of text.split('\n')){let line='';for(const character of Array.from(paragraph)){if(line&&measure(line+character)>width){lines.push(line);line='';}line+=character;}lines.push(line);}return lines;}
export function shareOutcomeMessage(outcome){return {shared:'Dibagikan.',copied:'Disalin.',cancelled:'Pembagian dibatalkan.',unsupported:'Native Share tidak tersedia. Gunakan Salin tautan.',failed:'Belum dapat dibagikan. Coba Salin tautan.'}[outcome.status]??'Aksi belum selesai.';}
