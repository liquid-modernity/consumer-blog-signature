import { getAuthors } from './content';
import { toCanonicalPublications } from './pakrpp-content';
import { presenceSections } from '../config/presence-composition.mjs';
export async function resolvePresenceContent(capability: {providerBinding:string; data:{id:string;title:string;summary:string;language?:string;sections:any[];[key:string]:any}}) {
 const data=capability.data;
 if(capability.providerBinding!=='editorial-authors')return data;
 const [authors,publications]=await Promise.all([getAuthors(),toCanonicalPublications()]);
 return {...data,sections:presenceSections([...data.sections,
  ...(authors.length?[{id:'penulis',type:'entries',enabled:true,order:2,label:{id:'Penulis',en:'Authors'},items:authors.map((a,order)=>({id:a.contentId,title:a.title,summary:a.summary??'',href:a.href,enabled:true,order}))}]:[]),
  ...(publications.length?[{id:'publikasi-terkait',type:'entries',enabled:true,order:3,label:{id:'Publikasi Terkait',en:'Related publications'},items:publications.map((p,order)=>({id:p.id,title:p.title,summary:p.publishedAt??'',href:p.canonicalHref,enabled:true,order}))}]:[])
 ])};
}
