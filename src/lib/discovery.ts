import { documentDiscoveryEntries } from '../config/document-experience';
import { absoluteUrl } from '@gaga/engine-capabilities/seo';
import { contentDefaults } from '../config/content';
import { discoveryConfig } from '../config/discovery';
import { seoConfig } from '../config/seo';
import { siteConfig } from '../config/site';
import { GAGA_WORKSPACES } from '../config/workspaces';
import { getEditorialSections } from './editorial';
import { resolveFreshnessAuthority } from '../config/freshness';
import { getArticles, getAuthors, getTagGroups, getTopicGroups } from './content';

export type GagaDiscoveryKind = 'article' | 'author' | 'topic' | 'tag' | 'section' | 'workspace' | 'knowledge' | 'information' | 'legal' | 'system';

export interface GagaDiscoveryRecord {
  id: string;
  kind: GagaDiscoveryKind;
  title: string;
  description?: string;
  href: string;
  language: string;
  searchText: string;
  tags?: string[];
  topics?: string[];
  publishedAt?: string;
  updatedAt?: string;
  freshnessStatus?: string;
  volatility?: string;
  lastReviewed?: string;
  reviewAfter?: string;
  editorial?: {
    section?: string;
    role: string;
    priority: number;
    format: string;
    featured: boolean;
    breaking: boolean;
    live: boolean;
  };
  coverage?: {
    mode: string;
    status: string;
    active: boolean;
    label: string;
    updatedAt?: string;
    updateCount: number;
  };
}

export interface LegacyArticleSearchItem {
  title: string;
  description?: string;
  href: string;
  tags: string[];
  topics: string[];
  topicLinks: { label: string; href: string; image?: string; imageAlt?: string }[];
  tagLinks: { label: string; href: string }[];
  image?: string;
  imageAlt?: string;
  date?: string;
  updated?: string;
  language: string;
}

const searchable = (...values: Array<string | string[] | undefined>) => values
  .flatMap((value) => Array.isArray(value) ? value : value ? [value] : [])
  .join(' ')
  .toLowerCase();

export async function buildLegacyArticleSearchItems(): Promise<LegacyArticleSearchItem[]> {
  const [articles, topicGroups, tagGroups] = await Promise.all([
    getArticles(),
    getTopicGroups(),
    getTagGroups()
  ]);

  const topicsByArticle = new Map<string, { label: string; href: string; image?: string; imageAlt?: string }[]>();
  const tagsByArticle = new Map<string, { label: string; href: string }[]>();

  for (const group of topicGroups) {
    for (const article of group.articles) {
      if (!article.contentId) continue;
      const links = topicsByArticle.get(article.contentId) ?? [];
      links.push({
        label: group.topic,
        href: group.href,
        ...(group.image ? { image: absoluteUrl(group.image, seoConfig.canonical) } : {}),
        ...(group.imageAlt ? { imageAlt: group.imageAlt } : {})
      });
      topicsByArticle.set(article.contentId, links);
    }
  }

  for (const group of tagGroups) {
    for (const article of group.articles) {
      if (!article.contentId) continue;
      const links = tagsByArticle.get(article.contentId) ?? [];
      links.push({ label: group.tag, href: group.href });
      tagsByArticle.set(article.contentId, links);
    }
  }

  return articles.map((article) => ({
    title: article.metadata.title,
    description: article.metadata.summary ?? article.metadata.description,
    href: absoluteUrl(article.href, seoConfig.canonical),
    tags: article.metadata.tags,
    topics: article.metadata.topics,
    topicLinks: article.contentId ? topicsByArticle.get(article.contentId) ?? [] : [],
    tagLinks: article.contentId ? tagsByArticle.get(article.contentId) ?? [] : [],
    image: article.image ? absoluteUrl(article.image, seoConfig.canonical) : undefined,
    imageAlt: article.imageAlt,
    date: article.metadata.publishedAt,
    updated: article.metadata.updatedAt,
    language: article.metadata.language ?? contentDefaults.defaultLanguage
  }));
}

export async function buildPublicDiscoveryRecords(): Promise<GagaDiscoveryRecord[]> {
  const [articles, authors, topics, tags, sections] = await Promise.all([
    getArticles(),
    getAuthors(),
    getTopicGroups(),
    getTagGroups(),
    getEditorialSections()
  ]);

  const records: GagaDiscoveryRecord[] = [];

  for (const article of articles) {
    const title = article.metadata.title;
    const description = article.metadata.summary ?? article.metadata.description;
    const freshness = resolveFreshnessAuthority({
      lastReviewed: article.lastReviewed,
      reviewAfter: article.reviewAfter,
      volatility: article.volatility
    });
    records.push({
      id: article.contentId ?? `article:${article.id}`,
      kind: 'article',
      title,
      ...(description ? { description } : {}),
      href: absoluteUrl(article.href, seoConfig.canonical),
      language: article.metadata.language ?? contentDefaults.defaultLanguage,
      searchText: searchable(title, description, article.metadata.tags, article.metadata.topics, article.href),
      tags: article.metadata.tags,
      topics: article.metadata.topics,
      ...(article.metadata.publishedAt ? { publishedAt: article.metadata.publishedAt } : {}),
      ...(article.metadata.updatedAt ? { updatedAt: article.metadata.updatedAt } : {}),
      freshnessStatus: freshness.status,
      volatility: freshness.volatility,
      ...(freshness.lastReviewed ? { lastReviewed: freshness.lastReviewed } : {}),
      ...(freshness.reviewAfter ? { reviewAfter: freshness.reviewAfter } : {}),
      editorial: {
        ...(article.section ? { section: article.section } : {}),
        role: article.editorialRole,
        priority: article.editorialPriority,
        format: article.storyFormat,
        featured: article.featured,
        breaking: article.breaking,
        live: article.live
      },
      coverage: {
        mode: article.coverage.mode,
        status: article.coverage.status,
        active: article.coverage.active,
        label: article.coverage.label,
        ...(article.coverage.updatedAt ? { updatedAt: article.coverage.updatedAt } : {}),
        updateCount: article.coverage.updates.length
      }
    });
  }

  for (const author of authors) {
    const description = author.summary ?? author.description;
    records.push({
      id: author.contentId,
      kind: 'author',
      title: author.title,
      ...(description ? { description } : {}),
      href: absoluteUrl(author.href, seoConfig.canonical),
      language: contentDefaults.defaultLanguage,
      searchText: searchable(author.title, description, author.aliases, author.topics, author.tags, author.href),
      tags: author.tags,
      topics: author.topics
    });
  }

  for (const topic of topics) {
    records.push({
      id: topic.contentId ?? `topic:${topic.slug}`,
      kind: 'topic',
      title: topic.topic,
      ...(topic.summary ? { description: topic.summary } : {}),
      href: absoluteUrl(topic.href, seoConfig.canonical),
      language: contentDefaults.defaultLanguage,
      searchText: searchable(topic.topic, topic.summary, topic.href)
    });
  }

  for (const tag of tags) {
    records.push({
      id: `tag:${tag.slug}`,
      kind: 'tag',
      title: tag.tag,
      description: `${tag.count} published item${tag.count === 1 ? '' : 's'} tagged ${tag.tag}.`,
      href: absoluteUrl(tag.href, seoConfig.canonical),
      language: contentDefaults.defaultLanguage,
      searchText: searchable(tag.tag, tag.href)
    });
  }

  for (const section of sections) {
    records.push({
      id: `section:${section.slug}`,
      kind: 'section',
      title: section.name,
      description: `${section.count} published item${section.count === 1 ? '' : 's'} in this editorial section.`,
      href: absoluteUrl(section.href, seoConfig.canonical),
      language: contentDefaults.defaultLanguage,
      searchText: searchable(section.name, section.slug, section.href)
    });
  }

  const workspaceDescriptions: Record<string, string> = {
    latest: 'Latest published stories and editorial updates.',
    topics: 'Browse publication topics and editorial domains.',
    series: 'Browse recurring editorial series.',
    library: 'Reference and saved-reading workspace.',
    authors: 'Browse publication authors and contributors.',
    archive: 'Chronological publication archive.'
  };

  for (const workspace of GAGA_WORKSPACES) {
    records.push({
      id: `workspace:${workspace.id}`,
      kind: 'workspace',
      title: workspace.label,
      description: workspaceDescriptions[workspace.id] ?? `${workspace.label} workspace.`,
      href: absoluteUrl(workspace.href, seoConfig.canonical),
      language: contentDefaults.defaultLanguage,
      searchText: searchable(workspace.label, workspace.shortLabel, workspace.id, workspace.mode, workspace.href)
    });
  }

  for (const entry of documentDiscoveryEntries()) {
    records.push({ id: 'document:' + entry.href, kind: entry.kind, title: entry.title, description: entry.summary, href: absoluteUrl(entry.href, seoConfig.canonical), language: contentDefaults.defaultLanguage, searchText: searchable(entry.title, entry.summary, entry.href) });
  }

  const unique = new Map<string, GagaDiscoveryRecord>();
  for (const record of records) {
    const key = `${record.kind}:${record.href}`;
    if (!unique.has(key)) unique.set(key, record);
  }

  return [...unique.values()].sort((left, right) => (
    left.kind.localeCompare(right.kind) || left.title.localeCompare(right.title)
  ));
}

export async function buildMachineIndex() {
  const records = await buildPublicDiscoveryRecords();
  const counts = records.reduce<Record<string, number>>((result, record) => {
    result[record.kind] = (result[record.kind] ?? 0) + 1;
    return result;
  }, {});

  return {
    schema: discoveryConfig.schemas.machineIndex,
    semantics: discoveryConfig.semantics.machineIndex,
    site: {
      name: siteConfig.name,
      title: siteConfig.title,
      description: siteConfig.description,
      origin: siteConfig.url,
      defaultLanguage: siteConfig.defaultLanguage
    },
    discovery: discoveryConfig.endpoints,
    counts,
    items: records
  };
}
