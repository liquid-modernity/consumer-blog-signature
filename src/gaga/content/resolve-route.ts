import { getCollection } from 'astro:content';
import { normalizeGagaRouteContext } from './runtime-route';

function normalizeEntryPath(id: string) {
  return `/${id}`
    .replace(/^\/docs\//, '/')
    .replace(/^\/site-owned\//, '/')
    .replace(/\.(md|mdx)$/, '')
    .replace(/\/index$/, '');
}

export async function resolveGagaRoute(pathname: string) {
  const cleanPath =
    pathname.replace(/\/+$/, '') || '/';

  const entries = await getCollection('docs');

  const match = entries.find((entry) => {
    const data = entry.data as Record<string, unknown>;

    const entryPath = normalizeEntryPath(entry.id);

    const slug =
      typeof data.slug === 'string'
        ? `/${data.slug.replace(/^\/+/, '')}`
        : null;

    const canonical =
      typeof data.canonical === 'string'
        ? new URL(data.canonical).pathname
        : null;

    return (
      cleanPath === entryPath ||
      cleanPath === slug ||
      cleanPath === canonical
    );
  });

  if (!match) {
    return normalizeGagaRouteContext({
      id: cleanPath,
      lang: 'id',
      entry: {
        data: {}
      },
      toc: {
        items: []
      },
      head: []
    });
  }

  return normalizeGagaRouteContext({
    id: match.id,
    lang:
      typeof match.data.language === 'string'
        ? match.data.language
        : 'id',

    entry: {
      data: match.data
    },

    toc: {
      items: []
    },

    head: []
  });
}
