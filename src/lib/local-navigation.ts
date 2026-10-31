import { resolveLocalContext, flattenNavigation } from '../features/local-navigation/model.mjs';
import { documentExperience, documentNavigation } from '../config/document-experience.ts';
import { getEnabledRootSections, getEnabledTopics, referenceRegistry } from '../config/pakrpp-architecture.ts';
import { routes, routeRegistry } from '../config/routes.ts';
import type { ArchiveYearGroup } from './pakrpp-content';
import type { TopicGroup, TagGroup } from './content';
import type { EditorialSectionSummary } from './editorial';

// All family membership comes from existing configuration and normalized content.
export function localContext(path: string, title: string, topics: TopicGroup[], sections: EditorialSectionSummary[], archive: ArchiveYearGroup[] = [], tags: TagGroup[] = []) {
  const profile = documentExperience(path);
  const configured = getEnabledRootSections();
  const family = profile?.id === 'information' ? 'about' : profile?.id === 'section' ? 'sections' : profile?.id
    ?? configured.find(s => (s.id === 'topics' || s.id === 'archive') && (path === routes[s.id].index || path.startsWith(routes[s.id].index + '/')))?.id;
  const config = configured.find(s => s.id === family);
  let items: { id: string; label: string; labelEn?: string; href: string; children?: {id:string;label:string;href:string}[] }[] = [];
  let ordered: {id:string;label:string;href:string}[] = [];
  if (family === 'sections' && routeRegistry.sections.enabled) {
    items = [{id:'sections',label:profile!.label,href:profile!.root}, ...sections.map(s => ({id:s.slug,label:s.name,href:s.href}))];
  } else if (family === 'topics' && routeRegistry.topics.enabled && config) {
    items = [{id:family,label:config.label,href:routes.topics.index}, ...getEnabledTopics().filter(t => topics.some(g => g.slug === t.slug && g.count > 0)).map(t => ({id:t.id,label:t.label,labelEn:t.labelEn,href:routes.topics.detail(t.slug)}))];
  } else if (family === 'archive' && routeRegistry.archive.enabled && config) {
    const years = archive.filter(y => y.count > 0);
    const periods = years.map(y => ({id:y.year,label:y.year,href:y.href,children:y.months.filter(m=>m.count>0).map(m=>({id:y.year+'-'+m.month,label:m.label,href:m.href}))}));
    items = [{id:family,label:config.label,href:routes.archive.index}, ...periods];
    ordered = periods.some(y => y.href === path) ? periods : periods.flatMap(y => y.children);
  } else if (profile && config && (family !== 'knowledge' || routeRegistry.knowledge.enabled) && (family !== 'system' || routeRegistry.system.enabled) && (family !== 'legal' || routeRegistry.legal.enabled)) {
    items = documentNavigation(profile).map(i => ({id:i.href,label:i.title,labelEn:i.labelEn,href:i.href,
      ...(family === 'knowledge' && i.href === routes.knowledge.tags && (path === i.href || path.startsWith(i.href + '/')) ? {children:tags.filter(t=>t.count>0).map(t=>({id:'tag-'+t.slug,label:t.tag,href:routes.knowledge.tagDetail(t.slug)}))} : {}),
      ...(family === 'knowledge' && i.href === routes.knowledge.references && (path === i.href || path.startsWith(i.href + '/')) ? {children:referenceRegistry.map(r=>({id:'reference-'+r.slug,label:r.title,href:routes.knowledge.referenceDetail(r.slug)}))} : {})
    }));
  }
  return { ...resolveLocalContext({path,title,family,items,ordered}), headingSequence: path === routes.knowledge.index };
}
export function localDestinations(context: Awaited<ReturnType<typeof localContext>>) {
  return new Set(flattenNavigation(context.localNavigation).map(i => i.href));
}
