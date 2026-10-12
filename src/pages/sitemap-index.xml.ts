import type { APIRoute } from 'astro';
import { getArticles, getAuthors, getTagGroups, getTopicGroups } from '../lib/content';
import { getEditorialSections } from '../lib/editorial';
const escapeXml = (value: string) => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export const GET: APIRoute = async ({ site }) => {
  const origin = site?.toString().replace(/\/$/, '') ?? 'https://example.com';
  const [articles, authors, topics, tags, sections] = await Promise.all([getArticles(), getAuthors(), getTopicGroups(), getTagGroups(), getEditorialSections()]);
  const fixed = ['/', '/landing', '/topics', '/sections', '/tags', '/authors', '/search', '/contact', '/sitemap', '/archive', '/library', '/collections', '/series', '/media'];
  const urls = new Set([...fixed, ...articles.map(x=>x.href), ...authors.map(x=>x.href), ...topics.map(x=>x.href), ...tags.map(x=>x.href), ...sections.map(x=>x.href)]);
  const body = [...urls].sort().map(path => `<url><loc>${escapeXml(origin + path)}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
