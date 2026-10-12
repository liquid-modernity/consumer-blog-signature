export type GagaWorkspaceId =
  | 'latest'
  | 'topics'
  | 'series'
  | 'library'
  | 'authors'
  | 'archive'
  | 'article'
  | 'page'
  | 'system';

export interface GagaWorkspaceDefinition {
  id: GagaWorkspaceId;
  href: string;
  label: string;
  shortLabel: string;
  icon: string;
  mode: 'discovery' | 'reading' | 'reference' | 'system';
}

export const GAGA_WORKSPACES: readonly GagaWorkspaceDefinition[] = Object.freeze([
  { id: 'latest', href: '/', label: 'Latest', shortLabel: 'Latest', icon: 'newsmode', mode: 'discovery' },
  { id: 'topics', href: '/topics', label: 'Topics', shortLabel: 'Topics', icon: 'grid_view', mode: 'discovery' },
  { id: 'series', href: '/series', label: 'Series', shortLabel: 'Series', icon: 'view_carousel', mode: 'discovery' },
  { id: 'library', href: '/library', label: 'Library', shortLabel: 'Library', icon: 'bookmark', mode: 'reference' },
  { id: 'authors', href: '/authors', label: 'Authors', shortLabel: 'Authors', icon: 'person', mode: 'reference' },
  { id: 'archive', href: '/archive', label: 'Archive', shortLabel: 'Archive', icon: 'inventory_2', mode: 'reference' }
]);

const normalized = (pathname: string) => {
  const path = `/${String(pathname ?? '').replace(/^\/+/, '')}`
    .replace(/\/{2,}/g, '/')
    .replace(/\/+$/, '');
  return path || '/';
};

export function resolveGagaWorkspace(
  pathname: string,
  contentKind?: string
): GagaWorkspaceDefinition {
  const path = normalized(pathname);

  if (contentKind === 'article') {
    return {
      id: 'article',
      href: path,
      label: 'Article',
      shortLabel: 'Article',
      icon: 'article',
      mode: 'reading'
    };
  }

  const direct = GAGA_WORKSPACES.find((workspace) => (
    workspace.href === '/'
      ? path === '/'
      : path === workspace.href || path.startsWith(`${workspace.href}/`)
  ));
  if (direct) return direct;

  if (
    path.startsWith('/graphs') ||
    path.startsWith('/console') ||
    path.startsWith('/search') ||
    path.startsWith('/sitemap') ||
    path.startsWith('/rss')
  ) {
    return {
      id: 'system',
      href: path,
      label: 'System',
      shortLabel: 'System',
      icon: 'settings_applications',
      mode: 'system'
    };
  }

  return {
    id: 'page',
    href: path,
    label: 'Page',
    shortLabel: 'Page',
    icon: 'article',
    mode: 'reference'
  };
}
