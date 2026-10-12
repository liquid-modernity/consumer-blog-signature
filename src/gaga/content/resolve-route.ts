import { getCollection } from 'astro:content';
import { normalizeGagaRouteContext } from './runtime-route';

function normalizePathname(value: string) {
  const normalized = `/${String(value ?? '').replace(/^\/+/, '')}`
    .replace(/^\/docs\//, '/')
    .replace(/^\/site-owned\//, '/')
    .replace(/\.(md|mdx)$/i, '')
    .replace(/\/index$/, '')
    .replace(/\/+$/, '');

  return normalized || '/';
}

function canonicalPath(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null;

  try {
    return normalizePathname(new URL(value, 'https://gaga.invalid').pathname);
  } catch {
    return null;
  }
}

export async function resolveGagaRoute(pathname: string) {
  const cleanPath = normalizePathname(pathname);
  const entries = await getCollection('docs');

  const match = entries.find((entry) => {
    const data = entry.data as Record<string, unknown>;
    const entryPath = normalizePathname(entry.id);
    const slugPath =
      typeof data.slug === 'string'
        ? normalizePathname(data.slug)
        : null;
    const canonical = canonicalPath(data.canonical);

    return (
      cleanPath === entryPath ||
      cleanPath === slugPath ||
      cleanPath === canonical
    );
  });

  if (!match) {
    return normalizeGagaRouteContext({
      id: cleanPath,
      lang: 'id',
      entry: { data: {} },
      toc: { items: [] },
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
