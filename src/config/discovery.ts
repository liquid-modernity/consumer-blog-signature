export const discoveryConfig = {
  schemas: {
    searchIndex: 'gaga.search-index.v2',
    machineIndex: 'gaga.machine-index.v1',
    agentDescription: 'gaga.agent-discovery.v1'
  },
  endpoints: {
    searchIndex: '/search-index.json',
    machineIndex: '/machine.json',
    agentDescription: '/agent.json',
    llmsText: '/llms.txt',
    rss: '/rss.xml',
    sitemap: '/sitemap-index.xml'
  },
  semantics: {
    machineIndex: 'project-defined machine-readable public-content projection',
    agentDescription: 'project-defined descriptive capability document',
    llmsText: 'informational discovery guidance derived from public site surfaces'
  }
} as const;
