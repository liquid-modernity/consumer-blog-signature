import type { APIRoute } from 'astro';
import { getArticles } from '../lib/content';
import { siteConfig } from '../config/site';

function escapeXml(value = '') {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

export const GET: APIRoute = async ({ site }) => {
  const articles = await getArticles();
  const origin = site?.toString().replace(/\/$/, '') ?? 'https://example.com';
  const items = articles.map((article) => `
    <item>
      <title>${escapeXml(article.metadata.title)}</title>
      <description>${escapeXml(article.metadata.summary ?? article.metadata.description ?? '')}</description>
      <link>${origin}${article.href}</link>
      <guid>${origin}${article.href}</guid>
      ${article.metadata.publishedAt ? `<pubDate>${new Date(article.metadata.publishedAt).toUTCString()}</pubDate>` : ''}
    </item>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0">
    <channel>
      <title>${escapeXml(siteConfig.name)}</title>
      <description>${escapeXml(siteConfig.description)}</description>
      <link>${origin}</link>
      ${items}
    </channel>
  </rss>`, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
