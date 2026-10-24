import { getCollection } from 'astro:content';
import {
  groupArticlesByMonth as groupEngineArticlesByMonth,
  normalizeContentMetadata,
  toArticlePreview,
  type ArticleMonthGroup,
  type ArticlePreview,
  type ArticlePreviewOptions,
  type ArticleRecord
} from '@gaga/engine-capabilities/content';
import { entryToHref, screenSlug } from './slug';
import type { EditorialRole, StoryFormat } from '../config/editorial-schema';
import { resolveCoverageAuthority, type CoverageAuthority } from '../config/coverage';

export { toArticlePreview };
export type { ArticleMonthGroup, ArticlePreview, ArticlePreviewOptions, ArticleRecord };

export type ConsumerArticleRecord = ArticleRecord & {
  contentId?: string;
  authorRefs: string[];
  contributorRefs: string[];
  topics: string[];
  topicRefs: string[];
  tags: string[];
  relatedRefs: string[];
  image?: string;
  imageAlt?: string;
  lastReviewed?: string;
  reviewAfter?: string;
  volatility?: string;
  section?: string;
  sectionRefs: string[];
  kicker?: string;
  storyFormat: StoryFormat;
  editorialRole: EditorialRole;
  editorialPriority: number;
  featured: boolean;
  breaking: boolean;
  live: boolean;
  coverage: CoverageAuthority;
};

export type ContentRelationKind = 'article' | 'topic' | 'author';

export type ContentRelationRecord = {
  contentId: string;
  contentKind: ContentRelationKind;
  href: string;
  title: string;
  summary?: string;
  authorRefs: string[];
  contributorRefs: string[];
  relatedRefs: string[];
  topicRefs: string[];
  entityRefs: string[];
  mainEntityRefs: string[];
  sourceRefs: string[];
};

export type AuthorRecord = {
  id: string;
  contentId: string;
  slug: string;
  href: string;
  title: string;
  description?: string;
  summary?: string;
  aliases: string[];
  topics: string[];
  tags: string[];
  relatedRefs: string[];
  image?: string;
  imageAlt?: string;
};

export type TopicGroup = {
  contentId?: string;
  topic: string;
  slug: string;
  href: string;
  summary?: string;
  image?: string;
  imageAlt?: string;
  articles: ConsumerArticleRecord[];
  count: number;
};

export type TagGroup = {
  tag: string;
  slug: string;
  href: string;
  articles: ConsumerArticleRecord[];
  count: number;
};

function isPublicEntry(data: { draft?: boolean; noindex?: boolean; status?: string; visibility?: string }) {
  return !data.draft
    && data.noindex !== true
    && data.status === 'published'
    && data.visibility === 'public';
}

function isPublicArticle(data: { contentKind?: string; draft?: boolean; noindex?: boolean; status?: string; visibility?: string }) {
  return data.contentKind === 'article' && isPublicEntry(data);
}

function isPublicTopic(data: { contentKind?: string; draft?: boolean; noindex?: boolean; status?: string; visibility?: string }) {
  return data.contentKind === 'topic' && isPublicEntry(data);
}

function isPublicAuthor(data: { contentKind?: string; draft?: boolean; noindex?: boolean; status?: string; visibility?: string; contentId?: string }) {
  return data.contentKind === 'author'
    && typeof data.contentId === 'string'
    && data.contentId.length > 0
    && isPublicEntry(data);
}

function isPublicRelationEntry(data: { contentKind?: string; draft?: boolean; noindex?: boolean; status?: string; visibility?: string; contentId?: string }) {
  return (data.contentKind === 'article' || data.contentKind === 'topic' || data.contentKind === 'author')
    && typeof data.contentId === 'string'
    && data.contentId.length > 0
    && isPublicEntry(data);
}

function timestamp(value?: string) {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];
}

let articlesPromise: Promise<ConsumerArticleRecord[]> | undefined;
let authorsPromise: Promise<AuthorRecord[]> | undefined;
let topicGroupsPromise: Promise<TopicGroup[]> | undefined;
let tagGroupsPromise: Promise<TagGroup[]> | undefined;
let contentRelationRecordsPromise: Promise<ContentRelationRecord[]> | undefined;

export async function getPublicRelationRecords(): Promise<ContentRelationRecord[]> {
  contentRelationRecordsPromise ??= (async () => {
    const entries = await getCollection('docs', ({ data }) => isPublicRelationEntry(data));
    return entries
      .map((entry): ContentRelationRecord => {
        const metadata = normalizeContentMetadata(entry.data);
        const raw = entry.data as typeof entry.data & {
          contributorRefs?: unknown;
          entityRefs?: unknown;
          mainEntityRefs?: unknown;
          sourceRefs?: unknown;
        };
        return {
          contentId: String(entry.data.contentId),
          contentKind: entry.data.contentKind as ContentRelationKind,
          href: entryToHref(entry),
          title: String(metadata.title ?? entry.id),
          summary: metadata.summary,
          authorRefs: stringArray(entry.data.authorRefs),
          contributorRefs: stringArray(raw.contributorRefs),
          relatedRefs: stringArray(entry.data.relatedRefs),
          topicRefs: stringArray((entry.data as { topicRefs?: unknown }).topicRefs),
          entityRefs: stringArray(raw.entityRefs),
          mainEntityRefs: stringArray(raw.mainEntityRefs),
          sourceRefs: stringArray(raw.sourceRefs)
        };
      })
      .sort((left, right) => left.contentKind.localeCompare(right.contentKind) || left.title.localeCompare(right.title));
  })();
  return contentRelationRecordsPromise;
}

export async function getArticles(): Promise<ConsumerArticleRecord[]> {
  articlesPromise ??= (async () => {
    const docs = await getCollection('docs', ({ data }) => isPublicArticle(data));
    return docs
      .map((doc): ConsumerArticleRecord => {
        const metadata = normalizeContentMetadata(doc.data);
        const coverage = resolveCoverageAuthority(doc.data);
        return {
          id: doc.id,
          href: entryToHref(doc),
          metadata: { ...metadata, title: metadata.title ?? doc.id, contentKind: 'article' },
          contentId: typeof doc.data.contentId === 'string' ? doc.data.contentId : undefined,
          authorRefs: stringArray(doc.data.authorRefs),
          contributorRefs: stringArray((doc.data as { contributorRefs?: unknown }).contributorRefs),
          topics: stringArray(doc.data.topics),
          topicRefs: stringArray((doc.data as { topicRefs?: unknown }).topicRefs),
          tags: stringArray(doc.data.tags),
          relatedRefs: stringArray(doc.data.relatedRefs),
          image: typeof doc.data.image === 'string' ? doc.data.image : undefined,
          imageAlt: typeof doc.data.imageAlt === 'string' ? doc.data.imageAlt : undefined,
          lastReviewed: typeof doc.data.lastReviewed === 'string' ? doc.data.lastReviewed : undefined,
          reviewAfter: typeof doc.data.reviewAfter === 'string' ? doc.data.reviewAfter : undefined,
          volatility: typeof doc.data.volatility === 'string' ? doc.data.volatility : undefined,
          section: typeof doc.data.section === 'string' ? doc.data.section : undefined,
          sectionRefs: stringArray((doc.data as { sectionRefs?: unknown }).sectionRefs),
          kicker: typeof doc.data.kicker === 'string' ? doc.data.kicker : undefined,
          storyFormat: doc.data.storyFormat,
          editorialRole: doc.data.editorialRole,
          editorialPriority: doc.data.editorialPriority,
          featured: doc.data.featured === true,
          breaking: coverage.mode === 'breaking',
          live: coverage.mode === 'live',
          coverage
        };
      })
      .sort((a, b) => timestamp(b.metadata.publishedAt) - timestamp(a.metadata.publishedAt));
  })();
  return articlesPromise;
}

export function groupArticlesByMonth(articles: ArticleRecord[], locale: Intl.LocalesArgument): ArticleMonthGroup[] {
  return groupEngineArticlesByMonth(articles, locale, { undatedLabel: 'Undated' });
}

function topicKey(topic: string) {
  return screenSlug(topic);
}

function routeLeaf(href: string) {
  return href.split('/').filter(Boolean).at(-1);
}

function normalizeRelationKey(value: string) {
  return value.trim().replace(/^\/+|\/+$/g, '');
}

function topicRelationKeys(topicDoc: { data: Record<string, unknown> }, href: string, title: string) {
  const keys = new Set<string>();
  const contentId = typeof topicDoc.data.contentId === 'string' ? topicDoc.data.contentId : undefined;
  const slug = typeof topicDoc.data.slug === 'string' ? topicDoc.data.slug : undefined;
  const leaf = routeLeaf(href);
  if (contentId) keys.add(contentId);
  if (slug) {
    keys.add(normalizeRelationKey(slug));
    const slugLeaf = routeLeaf(`/${slug}`);
    if (slugLeaf) keys.add(slugLeaf);
  }
  if (leaf) keys.add(leaf);
  keys.add(topicKey(title));
  return keys;
}

function articleTopicRelationValues(article: ConsumerArticleRecord) {
  return new Set(article.topicRefs.map(normalizeRelationKey).filter(Boolean));
}

export async function getAuthors(): Promise<AuthorRecord[]> {
  authorsPromise ??= (async () => {
    const docs = await getCollection('docs', ({ data }) => isPublicAuthor(data));
    return docs
      .map((doc): AuthorRecord => {
        const metadata = normalizeContentMetadata(doc.data);
        const title = String(metadata.title ?? doc.data.title ?? doc.id).replace(/\s+•\s+Consumer Signature$/, '');
        const href = entryToHref(doc);
        return {
          id: doc.id,
          contentId: String(doc.data.contentId),
          slug: href.split('/').filter(Boolean).at(-1) ?? screenSlug(title),
          href,
          title,
          description: metadata.description,
          summary: metadata.summary,
          aliases: stringArray(doc.data.aliases),
          topics: stringArray(doc.data.topics),
          tags: stringArray(doc.data.tags),
          relatedRefs: stringArray(doc.data.relatedRefs),
          image: typeof doc.data.image === 'string' ? doc.data.image : undefined,
          imageAlt: typeof doc.data.imageAlt === 'string' ? doc.data.imageAlt : undefined
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  })();
  return authorsPromise;
}

export async function getAuthorByRef(contentId: string | undefined) {
  if (!contentId) return undefined;
  return (await getAuthors()).find((author) => author.contentId === contentId);
}

export async function getAuthorBySlug(slug: string) {
  return (await getAuthors()).find((author) => author.slug === slug);
}

export async function resolveAuthorRefs(refs: readonly string[] = []) {
  if (!refs.length) return [];
  const authors = await getAuthors();
  const authorMap = new Map(authors.map((author) => [author.contentId, author]));
  return refs.map((ref) => authorMap.get(ref)).filter((author): author is AuthorRecord => Boolean(author));
}

export async function getArticlesByAuthorRef(contentId: string) {
  return (await getArticles()).filter((article) => article.authorRefs.includes(contentId) || article.contributorRefs.includes(contentId));
}

export async function getTopicGroups(): Promise<TopicGroup[]> {
  topicGroupsPromise ??= (async () => {
    const [articles, topicDocs] = await Promise.all([
      getArticles(),
      getCollection('docs', ({ data }) => isPublicTopic(data))
    ]);
    return topicDocs
      .map((doc): TopicGroup => {
        const metadata = normalizeContentMetadata(doc.data);
        const title = String(metadata.title ?? doc.id).replace(/\s+•\s+Consumer Signature$/, '');
        const href = entryToHref(doc);
        const slug = routeLeaf(href) ?? topicKey(title);
        const canonicalKeys = topicRelationKeys(doc, href, title);
        const memberArticles = articles.filter((article) => {
          const values = articleTopicRelationValues(article);
          return [...canonicalKeys].some((key) => values.has(key));
        });
        return {
          contentId: typeof doc.data.contentId === 'string' ? doc.data.contentId : undefined,
          topic: title,
          slug,
          href,
          summary: metadata.summary ?? metadata.description,
          image: typeof doc.data.image === 'string' ? doc.data.image : undefined,
          imageAlt: typeof doc.data.imageAlt === 'string' ? doc.data.imageAlt : undefined,
          articles: memberArticles,
          count: memberArticles.length
        };
      })
      .sort((a, b) => a.topic.localeCompare(b.topic));
  })();
  return topicGroupsPromise;
}

export async function getTopics() {
  const groups = await getTopicGroups();
  return groups.map(({ topic, count, slug, href }) => [topic, count, slug, href] as const);
}

export async function getTopicGroup(slug: string) {
  const groups = await getTopicGroups();
  return groups.find((group) => group.slug === slug);
}

export async function getTopicGroupForArticle(contentId: string | undefined) {
  if (!contentId) return undefined;
  return (await getTopicGroups()).find((group) => group.articles.some((article) => article.contentId === contentId));
}

export async function getTagGroups(): Promise<TagGroup[]> {
  tagGroupsPromise ??= (async () => {
    const groups = new Map<string, { label: string; articles: ConsumerArticleRecord[] }>();
    const articles = await getArticles();
    for (const article of articles) {
      for (const tag of article.tags) {
        const slug = screenSlug(tag);
        if (!slug) continue;
        const group = groups.get(slug) ?? { label: tag, articles: [] };
        group.articles.push(article);
        groups.set(slug, group);
      }
    }
    return [...groups.entries()]
      .map(([slug, group]) => ({
        tag: group.label,
        slug,
        href: `/tags/${slug}`,
        articles: group.articles,
        count: group.articles.length
      }))
      .sort((left, right) => left.tag.localeCompare(right.tag));
  })();
  return tagGroupsPromise;
}

export async function getTagGroup(slug: string) {
  return (await getTagGroups()).find((group) => group.slug === slug);
}
