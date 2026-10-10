import type { APIRoute } from 'astro';
import { siteConfig } from '../config/site';
export const GET: APIRoute = ({ site }) => {
  const origin = site?.toString().replace(/\/$/, '') || siteConfig.url.replace(/\/$/, '');
  return new Response(`User-agent: *
Allow: /

Sitemap: ${origin}/sitemap-index.xml
`, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
