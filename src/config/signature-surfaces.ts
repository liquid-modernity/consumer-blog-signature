export const gagaSignatureSurfaceContract = {
  dynamicGlobalNavigation: {
    owns: ['global-destination-projection', 'global-search-route'],
    mustNotOwn: ['route-local-navigation', 'article-outline', 'context-intelligence']
  },
  dynamicNotchIsland: {
    owns: ['workspace-actions', 'context-surface-trigger', 'nested-navigation-projection', 'reader-settings', 'reading-progress', 'transient-action-feedback'],
    mustNotOwn: ['global-destination-registry', 'article-outline-tree']
  },
  dynamicOutlinePeek: {
    owns: ['article-outline', 'current-heading', 'compact-outline-navigation'],
    mustNotOwn: ['article-metadata', 'related-content']
  },
  leftContextRail: {
    owns: ['route-local-navigation', 'workspace-neighborhood'],
    mustNotOwn: ['global-search', 'global-brand', 'reader-settings']
  },
  rightContextRail: {
    owns: ['context-intelligence', 'metadata', 'related-discovery'],
    mustNotOwn: ['article-outline']
  },
  gagaDock: {
    owns: ['compact-quick-actions'],
    mustNotOwn: ['full-global-navigation', 'article-outline']
  }
} as const;

export type GagaSignatureSurfaceId = keyof typeof gagaSignatureSurfaceContract;
