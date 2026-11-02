// Astro/content routing remains host-owned; only explicitly admitted public source may render.
const required=(ok,message)=>{if(!ok)throw new TypeError('Personal Presence: '+message);};
export function projectPresenceRoutes(registry,entries,toSlug){
 const owned=new Set(registry.sourceEntryIds);
 const paths=entries.filter(entry=>!owned.has(entry.id)).map(entry=>({params:{slug:toSlug(entry.id)},props:{entry}}));
 for(const capability of registry.capabilities){
  required(!paths.some(p=>'/'+p.params.slug===capability.path),'route conflicts with content: '+capability.path);
  const entry=capability.data.sourceEntryId?entries.find(e=>e.id===capability.data.sourceEntryId):undefined;
  required(!capability.data.sourceEntryId||entry,'missing source document');
  if(entry)required(entry.data?.status==='published'&&entry.data?.visibility==='public'&&entry.data?.draft===false,'source document must be explicitly public and published');
  paths.push({params:{slug:capability.path.slice(1)},props:{entry,capability}});
 }
 return paths;
}
