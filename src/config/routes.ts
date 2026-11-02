import {routePath} from '@gaga/arsenal/site';
import { personalPresenceConfig } from './personal-presence.mjs';
export const routes = {
  presence: personalPresenceConfig.routes,
  root: '/',
  anchors: {
    latest: '/#latest',
    saved: '/#saved',
    topics: '/#topics',
    archive: '/#archive',
    knowledge: '/#knowledge',
    about: '/#about',
    system: '/#system',
    legal: '/#legal',
    social: '/#social'
  },
  publications: {
    index: '/publications',
    detail: (slug: string) => routePath('/publications/:slug',{slug})
  },
  discovery: {
    latest: '/latest',
    saved: '/saved'
  },
  topics: {
    index: '/topics',
    detail: (slug: string) => routePath('/topics/:slug',{slug})
  },
  sections: { index: '/sections', detail: (slug: string) => routePath('/sections/:slug',{slug}) },
  archive: {
    index: '/archive',
    year: (year: string | number) => routePath('/archive/:year',{year}),
    month: (year: string | number, month: string | number) =>
      routePath('/archive/:year/:month',{year,month:String(month).padStart(2,'0')})
  },
  knowledge: {
    root: '/knowledge',
    graph: '/knowledge/graph',
    index: '/knowledge/index',
    tags: '/knowledge/tags',
    tagDetail: (slug: string) => routePath('/knowledge/tags/:slug',{slug}),
    references: '/knowledge/references',
    referenceDetail: (slug: string) => routePath('/knowledge/references/:slug',{slug})
  },
  about: {
    root: personalPresenceConfig.routes.profile,
    author: personalPresenceConfig.routes.author,
    support: personalPresenceConfig.routes.support,
    contact: personalPresenceConfig.routes.contact
  },
  system: {
    root: '/system',
    sitemap: '/system/sitemap',
    rss: '/system/rss',
    status: '/system/status'
  },
  legal: {
    root: '/legal',
    privacy: '/legal/privacy',
    terms: '/legal/terms',
    disclaimer: '/legal/disclaimer',
    license: '/legal/license'
  },
  machine: {
    sitemap: '/sitemap.xml',
    sitemapIndex: '/sitemap-index.xml',
    rss: '/rss.xml',
    robots: '/robots.txt'
  }
} as const;

export const routeRegistry = {
  home: { enabled: true, path: routes.root },
  article: { enabled: true, pattern: '/:slug', canonicalPattern: '/publications/:slug' },
  publications: { enabled: true, index: routes.publications.index, detail: '/publications/:slug' },
  latest: { enabled: true, path: routes.discovery.latest },
  saved: { enabled: true, path: routes.discovery.saved },
  landing: { enabled: true, path: '/landing' },
  sections: { enabled: true, index: routes.sections.index, detail: '/sections/:slug' },
  topics: { enabled: true, index: routes.topics.index, detail: '/topics/:slug' },
  tags: { enabled: true, index: '/tags', detail: '/tags/:slug', knowledgeIndex: routes.knowledge.tags },
  authors: { enabled: true, index: '/authors', detail: '/authors/:slug', aboutAuthor: routes.about.author },
  search: { enabled: true, path: '/search' },
  contact: { enabled: true, path: '/contact', aboutContact: routes.about.contact },
  sitemap: { enabled: true, path: '/sitemap', systemPath: routes.system.sitemap, machine: '/sitemap-index.xml', canonicalMachine: routes.machine.sitemap },
  rss: { enabled: true, path: routes.machine.rss, systemPath: routes.system.rss },
  status: { enabled: true, path: routes.system.status },
  archive: { enabled: true, path: routes.archive.index, year: '/archive/:year', month: '/archive/:year/:month' },
  library: { enabled: true, path: '/library', savedPath: routes.discovery.saved },
  collections: { enabled: true, index: '/collections', detail: '/collections/:slug' },
  series: { enabled: true, index: '/series', detail: '/series/:slug' },
  media: { enabled: true, path: '/media' },
  newsletter: { enabled: false, path: '/newsletter' },
  graph: { enabled: true, path: '/graphs', knowledgePath: routes.knowledge.graph },
  knowledge: {
    enabled: true,
    root: routes.knowledge.root,
    graph: routes.knowledge.graph,
    index: routes.knowledge.index,
    tags: routes.knowledge.tags,
    references: routes.knowledge.references
  },
  about: {
    enabled: true,
    root: routes.about.root,
    author: routes.about.author,
    support: routes.about.support,
    contact: routes.about.contact
  },
  system: {
    enabled: true,
    root: routes.system.root,
    sitemap: routes.system.sitemap,
    rss: routes.system.rss,
    status: routes.system.status
  },
  legal: {
    enabled: true,
    root: routes.legal.root,
    privacy: routes.legal.privacy,
    terms: routes.legal.terms,
    disclaimer: routes.legal.disclaimer,
    license: routes.legal.license
  }
} as const;

export const reservedRouteNamespaces = Object.values(routeRegistry).flatMap((route) =>
  Object.values(route).flatMap((value) =>
    typeof value === 'string' && value.startsWith('/') && !value.includes(':') ? [value] : []
  )
);
