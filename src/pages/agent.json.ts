import type { APIRoute } from 'astro';
import { discoveryConfig } from '../config/discovery';
import { siteConfig } from '../config/site';

export const prerender = true;

export const GET: APIRoute = () => new Response(JSON.stringify({
  schema: discoveryConfig.schemas.agentDescription,
  semantics: discoveryConfig.semantics.agentDescription,
  standard: false,
  site: {
    name: siteConfig.name,
    origin: siteConfig.url,
    purpose: siteConfig.description
  },
  machineSurfaces: discoveryConfig.endpoints,
  capabilities: [
    {
      id: 'public-search',
      mode: 'read-only',
      endpoint: discoveryConfig.endpoints.searchIndex,
      description: 'Search public publication records exposed by the static search index.'
    },
    {
      id: 'machine-index',
      mode: 'read-only',
      endpoint: discoveryConfig.endpoints.machineIndex,
      description: 'Enumerate public machine-readable publication records and workspaces.'
    },
    {
      id: 'rss',
      mode: 'read-only',
      endpoint: discoveryConfig.endpoints.rss,
      description: 'Read the publication RSS feed.'
    },
    {
      id: 'sitemap',
      mode: 'read-only',
      endpoint: discoveryConfig.endpoints.sitemap,
      description: 'Discover public crawlable publication URLs.'
    }
  ],
  boundaries: {
    autonomousPublishing: false,
    autonomousEditing: false,
    autonomousSubmission: false,
    consequentialActions: false,
    note: 'This endpoint describes public discovery capabilities only. It does not grant write or publishing authority.'
  }
}), {
  headers: { 'content-type': 'application/json; charset=utf-8' }
});
