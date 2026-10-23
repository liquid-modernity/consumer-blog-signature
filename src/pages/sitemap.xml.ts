import type { APIRoute } from 'astro';
import { getAuthors, getTagGroups, getTopicGroups } from '../lib/content';
import { getArchiveYears, toCanonicalPublications } from '../lib/pakrpp-content';
import { referenceRegistry } from '../config/pakrpp-architecture';
import { routes } from '../config/routes';

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.toString().replace(/\/$/, '') ?? 'https://example.com';
  const [publications, authors, topics, tags, archiveYears] = await Promise.all([
    toCanonicalPublications(),
    getAuthors(),
    getTopicGroups(),
    getTagGroups(),
    getArchiveYears()
  ]);

  const fixedRoutes = [
    routes.root,
    routes.publications.index,
    routes.discovery.latest,
    routes.discovery.saved,
    routes.topics.index,
    routes.archive.index,
    routes.knowledge.root,
    routes.knowledge.graph,
    routes.knowledge.index,
    routes.knowledge.tags,
    routes.knowledge.references,
    routes.about.root,
    routes.about.author,
    routes.about.support,
    routes.about.contact,
    routes.system.root,
    routes.system.sitemap,
    routes.system.rss,
    routes.system.status,
    routes.legal.root,
    routes.legal.privacy,
    routes.legal.terms,
    routes.legal.disclaimer,
    routes.legal.license
  ];

  const urls = new Set<string>([
    ...fixedRoutes,
    ...publications.map((pub) => pub.canonicalHref),
    ...publications.map((pub) => pub.href),
    ...topics.map((t) => t.href),
    ...archiveYears.map((y) => y.href),
    ...tags.map((t) => routes.knowledge.tagDetail(t.slug)),
    ...referenceRegistry.map((r) => routes.knowledge.referenceDetail(r.slug)),
    ...authors.map((a) => a.href)
  ]);

  const body = [...urls]
    .sort()
    .map((path) => `<url><loc>${escapeXml(origin + path)}</loc></url>`)
    .join('');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`,
    { headers: { 'content-type': 'application/xml; charset=utf-8' } }
  );
};
