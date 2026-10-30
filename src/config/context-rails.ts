import { actionById } from './actions';
import { documentExperience, documentNavigation } from './document-experience';
import type { GagaWorkspaceDefinition } from './workspaces';
import type { NavGroup, NavItem } from './nav';
import { navGroups, primaryNav } from './nav';
import type { ScreenInfo } from '../lib/screen-info';
import type {
  AuthorRecord,
  ConsumerArticleRecord,
  TagGroup,
  TopicGroup
} from '../lib/content';
import type { EditorialSectionSummary } from '../lib/editorial';
import { screenSlug } from '../lib/slug';

export interface ContextRailProjection {
  title: string;
  subtitle: string;
  icon: string;
  groups: NavGroup[];
  globalItems: NavItem[];
  globalGroups: NavGroup[];
}

export interface ContextRailProjectionInput {
  currentPath: string;
  workspace: GagaWorkspaceDefinition;
  info: ScreenInfo;
  articles: ConsumerArticleRecord[];
  authors: AuthorRecord[];
  topicGroups: TopicGroup[];
  tagGroups: TagGroup[];
  sections: EditorialSectionSummary[];
}

function item(id: string, label: string, href: string, icon: string): NavItem {
  return { id, label, labelEn: label, href, icon };
}

function group(id: string, label: string, icon: string, items: NavItem[]): NavGroup | undefined {
  const compact = items.filter((candidate, index, collection) => (
    candidate.href
    && collection.findIndex((entry) => entry.href === candidate.href) === index
  ));
  return compact.length ? { id, label, labelEn: label, icon, items: compact } : undefined;
}

function valuesFromFacts(info: ScreenInfo, ids: string[], icon: string): NavItem[] {
  const allowed = new Set(ids);
  return (info.facts ?? [])
    .filter((fact) => allowed.has(fact.id))
    .flatMap((fact) => fact.values)
    .filter((value) => Boolean(value.href))
    .map((value, index) => item(
      `${ids.join('-')}-${index + 1}`,
      value.text,
      value.href!,
      icon
    ));
}

function breadcrumbItems(info: ScreenInfo): NavItem[] {
  return (info.breadcrumbs ?? [])
    .filter((crumb) => Boolean(crumb.href) && crumb.label !== 'Home' && crumb.label !== 'Blog')
    .map((crumb, index) => item(`breadcrumb-${index + 1}`, crumb.label, crumb.href!, 'arrow_back'));
}

function relatedItems(info: ScreenInfo): NavItem[] {
  return (info.discovery ?? []).map((entry, index) => (
    item(`related-${index + 1}`, entry.title, entry.href, 'article')
  ));
}

function sectionItems(sections: EditorialSectionSummary[]): NavItem[] {
  return sections.map((section) => item(
    `section-${section.slug}`,
    section.name,
    section.href,
    'view_quilt'
  ));
}

function topicItems(groups: TopicGroup[]): NavItem[] {
  return groups.map((topic) => item(
    `topic-${topic.slug}`,
    topic.topic,
    topic.href,
    'grid_view'
  ));
}

function tagItems(groups: TagGroup[]): NavItem[] {
  return groups.map((tag) => item(
    `tag-${tag.slug}`,
    tag.tag,
    tag.href,
    'sell'
  ));
}

function authorItems(authors: AuthorRecord[]): NavItem[] {
  return authors.map((author) => item(
    `author-${screenSlug(author.title)}`,
    author.title,
    author.href,
    'person'
  ));
}

function archiveItems(info: ScreenInfo): NavItem[] {
  return (info.outlineItems ?? []).slice(0, 12).map((entry) => (
    item(`archive-${entry.slug}`, entry.text, `#${entry.slug}`, 'calendar_today')
  ));
}

function systemItems(): NavItem[] {
  return [
    item('system-graphs', 'Knowledge Graph', '/graphs', 'account_tree'),
    item('system-console', 'System Console', '/console', 'terminal'),
    item('system-sitemap', 'Sitemap', '/sitemap', 'lan'),
    item('system-rss', 'RSS', '/rss', 'rss_feed')
  ];
}

function referenceItems(currentPath: string): NavItem[] {
  if (
    currentPath.startsWith('/privacy')
    || currentPath.startsWith('/terms')
    || currentPath.startsWith('/disclaimer')
  ) {
    return [
      item('privacy', 'Privacy', '/privacy', 'shield'),
      item('terms', 'Terms', '/terms', 'contract'),
      item('disclaimer', 'Disclaimer', '/disclaimer', 'info')
    ];
  }

  return [
    item('about', 'About', '/about', 'article'),
    item('authors', 'Authors', '/authors', 'person'),
    item('contact', 'Contact', '/contact', 'mail'),
    item('support', 'Support', '/support', 'help')
  ];
}

export function globalNavigationProjection() {
  const search = actionById('search');
  const searchItem = item(
    'search',
    search.label.id,
    search.href ?? '/search',
    search.icon ?? 'search'
  );

  return {
    items: [primaryNav[0], searchItem, ...primaryNav.slice(1)],
    groups: navGroups
  };
}

export function projectContextRail(input: ContextRailProjectionInput): ContextRailProjection {
  const { workspace, info, topicGroups, tagGroups, authors, sections, currentPath } = input;
  const groups: NavGroup[] = [];
  const add = (candidate?: NavGroup) => { if (candidate) groups.push(candidate); };

  const document = documentExperience(currentPath);
  if (document && document.navigation === 'rail') {
    add(group('document-context', document.label, 'article', documentNavigation(document).map((entry, index) => ({ ...item('document-' + index, entry.title, entry.href, 'article'), exact: true }))));
  } else if (workspace.id === 'article') {
    add(group('article-path', 'Article context', 'article', [
      ...breadcrumbItems(info),
      ...valuesFromFacts(info, ['topic'], 'grid_view'),
      ...valuesFromFacts(info, ['author', 'contributors'], 'person')
    ]));
    add(group('article-related', 'Related', 'link', relatedItems(info)));
  } else if (workspace.id === 'sections') {
    add(group('sections', 'Sections', 'view_quilt', sectionItems(sections)));
  } else if (workspace.id === 'topics') {
    add(group('topics', 'Topics', 'grid_view', topicItems(topicGroups)));
  } else if (workspace.id === 'tags') {
    add(group('tags', 'Tags', 'sell', tagItems(tagGroups)));
  } else if (workspace.id === 'authors') {
    add(group('authors', 'Authors', 'person', authorItems(authors)));
  } else if (workspace.id === 'archive') {
    add(group('archive-periods', 'Archive', 'inventory_2', archiveItems(info)));
    add(group('archive-topics', 'Topics', 'grid_view', topicItems(topicGroups).slice(0, 8)));
  } else if (workspace.id === 'latest') {
    add(group('root-sections', 'Bagian Indeks', 'lan', [
      item('root-latest', '#Terbaru', '/#latest', 'article'),
      item('root-saved', '#Tersimpan', '/#saved', 'bookmark'),
      item('root-topics', '#Topik', '/#topics', 'grid_view'),
      item('root-archive', '#Arsip', '/#archive', 'inventory_2'),
      item('root-knowledge', '#Pengetahuan', '/#knowledge', 'account_tree'),
      item('root-about', '#Tentang', '/#about', 'person'),
      item('root-system', '#Sistem', '/#system', 'terminal'),
      item('root-legal', '#Legal', '/#legal', 'shield'),
      item('root-social', '#Sosial', '/#social', 'share')
    ]));
    add(group('latest-topics', 'Topik Kanonik', 'grid_view', topicItems(topicGroups).slice(0, 8)));
  } else if (workspace.id === 'search') {
    add(group('search-sections', 'Search by section', 'view_quilt', sectionItems(sections).slice(0, 8)));
    add(group('search-topics', 'Search by topic', 'grid_view', topicItems(topicGroups).slice(0, 8)));
  } else if (workspace.id === 'library') {
    add(group('library-context', 'Reading collection', 'bookmark', [
      item('collections', 'Collections', '/collections', 'folder_open'),
      item('series', 'Series', '/series', 'view_carousel'),
      item('archive', 'Archive', '/archive', 'inventory_2')
    ]));
  } else if (workspace.id === 'system') {
    add(group('system-context', 'System', 'settings_applications', systemItems()));
  } else {
    add(group('page-context', 'Related pages', 'folder_open', referenceItems(currentPath)));
  }

  if (!groups.length) {
    add(group('fallback-context', 'Context', workspace.icon, referenceItems(currentPath)));
  }

  const global = globalNavigationProjection();

  return {
    title: document?.label ?? workspace.label,
    subtitle: workspace.mode === 'reading'
      ? 'Reading context'
      : workspace.mode === 'discovery'
        ? 'Discovery context'
        : workspace.mode === 'system'
          ? 'System context'
          : 'Reference context',
    icon: workspace.icon,
    groups,
    globalItems: global.items,
    globalGroups: global.groups
  };
}
