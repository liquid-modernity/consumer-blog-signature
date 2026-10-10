export const routeRegistry = {
  home: { enabled: true, path: '/' },
  article: { enabled: true, pattern: '/:slug' },
  landing: { enabled: true, path: '/landing' },
  topics: { enabled: true, index: '/topics', detail: '/topics/:slug' },
  tags: { enabled: true, index: '/tags', detail: '/tags/:slug' },
  authors: { enabled: true, index: '/authors', detail: '/authors/:slug' },
  search: { enabled: true, path: '/search' },
  contact: { enabled: true, path: '/contact' },
  sitemap: { enabled: true, path: '/sitemap', machine: '/sitemap-index.xml' },
  rss: { enabled: true, path: '/rss.xml' },
  archive: { enabled: true, path: '/archive' },
  library: { enabled: true, path: '/library' },
  collections: { enabled: true, index: '/collections', detail: '/collections/:slug' },
  series: { enabled: true, index: '/series', detail: '/series/:slug' },
  media: { enabled: true, path: '/media' },
  newsletter: { enabled: false, path: '/newsletter' },
  graph: { enabled: true, path: '/graphs' }
} as const;

export const reservedRouteNamespaces = Object.values(routeRegistry).flatMap((route) =>
  Object.values(route).flatMap((value) =>
    typeof value === 'string' && value.startsWith('/') && !value.includes(':') ? [value] : []
  )
);
