import { routes } from './routes.ts';
import { presence, presenceNavigation } from '../lib/presence.ts';
import { presenceLabel } from '../config/presence-composition.mjs';
import { personalPresenceConfig } from './personal-presence.mjs';
import { getEnabledRootSections, referenceRegistry } from './pakrpp-architecture.ts';

export const documentProfiles = [
  { id: 'knowledge', root: routes.knowledge.root, label: 'Pengetahuan', navigation: 'rail', outline: true },
  { id: 'information', root: personalPresenceConfig.routes.profile, label: presenceLabel(personalPresenceConfig.capabilities.find(c=>c.id==='profile')!.label), navigation: 'inline', outline: true },
  { id: 'legal', root: routes.legal.root, label: 'Legal', navigation: 'inline', outline: true },
  { id: 'system', root: routes.system.root, label: 'Sistem', navigation: 'rail', outline: true },
  { id: 'section', root: routes.sections.index, label: 'Sections', navigation: 'editorial', outline: false }
] as const;
export type DocumentProfile = typeof documentProfiles[number];
export const cleanDocumentPath = (path: string) => path.replace(/\/+$/, '') || '/';
export function documentExperience(pathname: string) {
  const path = cleanDocumentPath(pathname);
  const capability = presence.at(path);
  const profile = capability ? documentProfiles.find(p=>p.id==='information') : documentProfiles.find(p => path === p.root || path.startsWith(p.root + '/'));
  if (!profile) return undefined;
  const knowledgeViews: Record<string, string> = { '/knowledge': 'explorer', '/knowledge/index': 'index', '/knowledge/graph': 'graph', '/knowledge/tags': 'tags', '/knowledge/references': 'references' };
  const explorer = path === profile.root || path in knowledgeViews;
  const readable=profile.id==='information'||(profile.id==='legal'&&path!==profile.root)||(profile.id==='system'&&path!==profile.root)||(profile.id==='knowledge'&&referenceRegistry.some(ref=>path==='/knowledge/references/'+ref.slug));
  return { ...profile, readable:capability?capability.readable:readable, view: knowledgeViews[path] ?? (profile.id === 'section' ? 'editorial' : explorer ? 'explorer' : 'reader'), mode: profile.id === 'section' ? 'editorial' : explorer ? 'explorer' : 'reader', outline: profile.outline && path !== '/knowledge/graph' && (!capability||capability.readable) };
}
export function documentNavigation(profile: Pick<DocumentProfile, 'id' | 'root' | 'label'>) {
  if(profile.id==='information')return presenceNavigation();
  const section = getEnabledRootSections().find(s => s.id === (profile.id === 'information' ? 'about' : profile.id));
  const items = (section?.items ?? []).filter(i => !i.external).map(i => ({ href: i.href, title: i.label, labelEn:i.labelEn, summary: i.meta ?? '' }));
  return [{ href: profile.root, title: profile.label, labelEn:profile.label, summary: section?.description ?? '' }, ...items.filter(i => i.href !== profile.root)];
}
export function documentBreadcrumbs(pathname: string, title: string) {
  const path = cleanDocumentPath(pathname), profile = documentExperience(path);
  if (!profile) return [];
  const trail = [{ title: 'Beranda', href: '/' }];
  if (path !== profile.root && (profile.id!=='information'||presence.route('profile'))) trail.push({ title: profile.label, href: profile.root });
  const parent = documentNavigation(profile).find(i => i.href !== profile.root && path.startsWith(i.href + '/'));
  if (parent) trail.push({ title: parent.title, href: parent.href });
  return [...trail, { title, href: path }];
}
// Navigation metadata is an existing public application projection, never a second CMS model.
export function documentDiscoveryEntries() {
  return [
    ...documentProfiles.filter(p => p.id !== 'section').flatMap(profile => documentNavigation(profile).map(item => ({ ...item, kind: profile.id }))),
    ...referenceRegistry.map(ref => ({ href: '/knowledge/references/' + ref.slug, title: ref.title, summary: ref.summary, kind: 'knowledge' as const }))
  ];
}
