import { slugify } from '@gaga/engine-capabilities/content';

type EntryLike = { id: string; data: Record<string, unknown> };

function normalizePath(path: string) {
  if (!path || path === '/') return '/';
  return `/${path.replace(/^\//, '').replace(/\/$/, '')}`;
}

export function entryToHref(entry: EntryLike): string {
  const slug = typeof entry.data.slug === 'string' ? entry.data.slug : undefined;
  if (slug) return normalizePath(slug);
  const raw = entry.id.replace(/(^|\/)index$/, '').replace(/\.mdx?$/, '');
  return normalizePath(raw);
}

export function screenSlug(value: string) {
  return slugify(value);
}
