// Strict semantic validation; instance choices live in config/providers, never in this renderer contract.
export const presenceCapabilityIds = Object.freeze(['profile','author','resume','portfolio','contact','support','campaign','audience']);
export const presenceSectionTypes = Object.freeze(['text','entries','links']);
const idPattern=/^[a-z][a-z0-9._-]*$/;
const required=(ok,message)=>{if(!ok)throw new TypeError('Personal Presence: '+message);};
const text=v=>typeof v==='string'&&v.trim().length>0;
export function presencePath(value){required(typeof value==='string'&&/^\/(?:[a-z0-9][a-z0-9._~-]*)(?:\/[a-z0-9][a-z0-9._~-]*)*$/.test(value)&&!value.split('/').some(s=>s==='.'||s==='..'),'unsafe route');return value;}
export function presenceLink(value){
 required(text(value)&&!/[\u0000-\u0020]/.test(value)&&!/%(?:0[0-9a-f]|1[0-9a-f]|7f)/i.test(value),'invalid link');
 if(value.startsWith('/')){presencePath(value);return value;}
 const url=new URL(value);required(['https:','mailto:'].includes(url.protocol)&&!url.username&&!url.password&&(url.protocol!=='mailto:'||url.pathname.includes('@'))&&!(url.protocol==='mailto:'&&/[?&#]/.test(value)),'unsafe link');return value;
}
export function presenceLabel(labels,locale='id'){required(labels&&text(labels.id)&&text(labels.en),'localized label required');return locale==='en'?labels.en:labels.id;}
function ordered(items,name){
 required(Array.isArray(items),name+' must be a list');const ids=new Set();
 for(const item of items){required(item&&idPattern.test(item.id)&&!ids.has(item.id),'duplicate/invalid '+name+' ID');ids.add(item.id);required(typeof item.enabled==='boolean'&&Number.isSafeInteger(item.order),'invalid '+name+' visibility/order');}
 return items.filter(i=>i.enabled).sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));
}
export function presenceSections(sections){
 return ordered(sections,'section').map(section=>{
  required(presenceSectionTypes.includes(section.type),'unknown section type');presenceLabel(section.label);
  required(section.text===undefined||text(section.text),'invalid section text');
  const items=ordered(section.items??[],'item').map(item=>{required(text(item.title),'item title required');if(item.href)presenceLink(item.href);required(item.summary===undefined||typeof item.summary==='string','invalid item summary');return {...item};});
  required(section.type==='text'?text(section.text):items.length>0,'empty enabled section');
  return {...section,items};
 });
}
/** @param {any} config @param {{origin:string,providers:Record<string,Function>,reservedPaths?:string[]}} options */
export function createPresenceRegistry(config,{origin,providers,reservedPaths=[]}){
 const base=new URL(origin);required(base.protocol==='https:'&&!base.username&&!base.password&&base.pathname==='/'&&!base.search&&!base.hash,'canonical origin required');
 required(config&&config.routes&&Array.isArray(config.capabilities),'config required');
 const declared=new Set(),paths=new Set(),sourceEntryIds=new Set();const all=[];
 ordered(config.capabilities,'capability');
 for(const capability of config.capabilities){
  required(!declared.has(capability.id),'duplicate capability ID');declared.add(capability.id);presenceLabel(capability.label);
  required(typeof capability.providerBinding==='string'&&typeof providers[capability.providerBinding]==='function','unknown provider binding');
  required(['document','index','methods'].includes(capability.presentationProfile),'unsupported presentation profile');
  required(typeof capability.readable==='boolean'&&typeof capability.rootNavigation==='boolean','invalid eligibility/navigation');
  const path=presencePath(config.routes[capability.route]);
  const data=providers[capability.providerBinding](capability);
  if(data?.sourceEntryId){required(text(data.sourceEntryId),'invalid source entry');sourceEntryIds.add(data.sourceEntryId);}
  if(!capability.enabled)continue;
  required(!paths.has(path)&&!reservedPaths.some(p=>p.endsWith('/*')?(path===p.slice(0,-2)||path.startsWith(p.slice(0,-1))):p===path),'route collision: '+path);paths.add(path);
  if(data==null)continue; // An unpopulated optional capability never projects a placeholder or dead route.
  required(text(data.id)&&text(data.title)&&text(data.summary),'missing semantic content identity/title/summary');
  const sections=presenceSections(data.sections??[]);
  required(text(data.sourceEntryId)||sections.length>0,'content required');
  const links=ordered(data.links??[],'link').map(link=>{presenceLabel(link.label);presenceLink(link.href);return {...link};});
  all.push({...capability,path,canonicalUrl:new URL(path,base).href,data:{...data,sections,links}});
 }
 required(new Set(all.map(c=>c.data.id)).size===all.length,'duplicate semantic content identity');
 const capabilities=all.sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));
 const navigation=(locale='id',rootOnly=false)=>capabilities.filter(c=>!rootOnly||c.rootNavigation).map(c=>({id:c.id,href:c.path,title:presenceLabel(c.label,locale),label:presenceLabel(c.label,locale),labelEn:presenceLabel(c.label,'en'),summary:c.data.summary,icon:c.icon??'article'}));
 return {capabilities,navigation,sourceEntryIds:[...sourceEntryIds],route:id=>capabilities.find(c=>c.id===id)?.path,canonical:id=>capabilities.find(c=>c.id===id)?.canonicalUrl,at:path=>capabilities.find(c=>c.path===(path.replace(/\/+$/,'')||'/')),discovery:()=>capabilities.map(c=>({id:c.data.id,href:c.path,title:presenceLabel(c.label),summary:c.data.summary,kind:'information'}))};
}

export function projectPresenceRoutes(registry,entries,toSlug){
 const owned=new Set(registry.sourceEntryIds);
 const paths=entries.filter(entry=>!owned.has(entry.id)).map(entry=>({params:{slug:toSlug(entry.id)},props:{entry}}));
 for(const capability of registry.capabilities){
  required(!paths.some(p=>'/'+p.params.slug===capability.path),'route conflicts with content: '+capability.path);
  const entry=capability.data.sourceEntryId?entries.find(e=>e.id===capability.data.sourceEntryId):undefined;
  required(!capability.data.sourceEntryId||entry,'missing source document');
  paths.push({params:{slug:capability.path.slice(1)},props:{entry,capability}});
 }
 return paths;
}
