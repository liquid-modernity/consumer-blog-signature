import { createPresenceRegistry } from '../config/presence-composition.mjs';
import { personalPresenceConfig } from '../config/personal-presence.mjs';
import { presenceContent } from '../config/presence-content.ts';
import { routeRegistry } from '../config/routes.ts';
import { siteConfig } from '../config/site.ts';
// This application-owned binding normalizes existing content; renderers never read provider objects.
export const presenceProviders = {
 'profile-document':()=>({id:'consumer.page.about',title:'Tentang PakRPP',summary:'Sistem publikasi pengetahuan yang mengutamakan ketertelusuran argumen, disiplin bukti, dan kejelasan struktur.',sourceEntryId:'about',sections:[]}),
 'editorial-authors':()=>presenceContent.author,
 'support-information':()=>({...presenceContent.support,links:[{id:'rss',label:{id:'Distribusi Sindikasi · Halaman RSS',en:'Open syndication · RSS'},href:'/system/rss',enabled:true,order:1}]}),
 'public-contact':()=>siteConfig.contact.email?({...presenceContent.contact,sections:[{id:'kontak',type:'links',label:{id:'Kontak',en:'Contact'},enabled:true,order:1,items:[{id:'email',title:siteConfig.contact.email,href:'mailto:'+siteConfig.contact.email,enabled:true,order:1}]}]}):null,
 'unpopulated':()=>null
};
export const presence = createPresenceRegistry(personalPresenceConfig,{origin:siteConfig.url,providers:presenceProviders,reservedPaths:Object.entries(routeRegistry).filter(([key])=>key!=='about').flatMap(([,value])=>Object.entries(value).flatMap(([key,path])=>typeof path==='string'&&path!=='/:slug'&&!key.startsWith('about')?[path.includes('/:')?path.slice(0,path.indexOf('/:'))+'/*':path]:[]))});
export function presenceNavigation(rootOnly=false){return presence.navigation('id',rootOnly);}
