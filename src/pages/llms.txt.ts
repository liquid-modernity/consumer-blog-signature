import type { APIRoute } from 'astro';
import { discoveryConfig } from '../config/discovery';
import { siteConfig } from '../config/site';

export const prerender = true;

const origin = siteConfig.url.replace(/\/$/, '');

const body = `# ${siteConfig.name}

${siteConfig.description}

This file is an informational discovery surface generated from the public publication architecture. It is not a formal web standard and does not grant write, publishing, or autonomous action authority.

## Human-readable publication surfaces
- Home: ${origin}/
- Topics: ${origin}/topics
- Series: ${origin}/series
- Library: ${origin}/library
- Authors: ${origin}/authors
- Archive: ${origin}/archive

## Machine-readable discovery
- Public search index: ${origin}${discoveryConfig.endpoints.searchIndex}
- Machine-readable site index: ${origin}${discoveryConfig.endpoints.machineIndex}
- Agent capability description: ${origin}${discoveryConfig.endpoints.agentDescription}
- RSS: ${origin}${discoveryConfig.endpoints.rss}
- Sitemap: ${origin}${discoveryConfig.endpoints.sitemap}

## Content boundary
Use canonical public pages as the authority for publication claims. Machine-readable indexes are discovery projections of public content and must not be interpreted as hidden or additional editorial claims.
`;

export const GET: APIRoute = () => new Response(body, {
  headers: { 'content-type': 'text/plain; charset=utf-8' }
});
