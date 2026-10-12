import type { APIRoute } from 'astro';
import { discoveryConfig } from '../config/discovery';
import { buildLegacyArticleSearchItems, buildPublicDiscoveryRecords } from '../lib/discovery';

export const prerender = true;

export const GET: APIRoute = async () => {
  const [items, records] = await Promise.all([
    buildLegacyArticleSearchItems(),
    buildPublicDiscoveryRecords()
  ]);

  return new Response(JSON.stringify({
    schema: discoveryConfig.schemas.searchIndex,
    generatedFrom: 'public-indexable-content-and-gaga-workspaces',
    items,
    records
  }), {
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
};
