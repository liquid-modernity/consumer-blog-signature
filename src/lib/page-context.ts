import {
  formatContentDate,
  resolveContentDateLocale,
  sanitizeOutlineItems,
  type CanonicalContentMetadata,
  type ContentDateLocaleConfig
} from '@gaga/engine/content';
import {
  groupArticlesByMonth,
  type AuthorRecord,
  type ConsumerArticleRecord,
  type TagGroup,
  type TopicGroup
} from './content';
import {
  curationRegistry,
  referenceRegistry,
  resolveCanonicalTopic,
  resolvePublicationType,
  seriesRegistry
} from '../config/pakrpp-architecture';
import { routes } from '../config/routes';

export type PageContextKind = 'index' | 'archive' | 'saved' | 'article' | 'author' | 'topic' | 'tag' | 'system' | 'generic';

export type PageContextTocItem = {
  slug: string;
  text: string;
  children?: PageContextTocItem[];
};

export type PageContextValue = {
  text: string;
  href?: string;
  datetime?: string;
};

export type PageContextFact = {
  id: string;
  icon: string;
  label: { id: string; en: string };
  values: PageContextValue[];
};

export type PageContextCard = {
  title: string;
  href: string;
  meta?: string;
  image?: string;
  imageAlt?: string;
};

export type BreadcrumbItem = {
  label: string;
  href?: string;
  current?: boolean;
};

export type PageContext = {
  kind: PageContextKind;
  outlineItems: PageContextTocItem[];
  hasTableOfContents?: boolean;
  snippet?: string;
  facts?: PageContextFact[];
  discovery?: PageContextCard[];
  breadcrumbs?: BreadcrumbItem[];
  cta?: { label: string; href: string };

  // Transitional compatibility fields consumed by older standalone surfaces.
  topics?: string[];
  tags?: string[];
  publishedDate?: { datetime: string; text: string };
  updatedAtDisplay?: { datetime: string; text: string };
  readTime?: string;
  author?: string;
};

export type PageContextInput = {
  pathname: string;
  metadata: CanonicalContentMetadata;
  language?: string;
  dateLocale: ContentDateLocaleConfig;
  defaultAuthor: string;
  tocItems?: PageContextTocItem[];
  articles?: ConsumerArticleRecord[];
  authors?: AuthorRecord[];
  topicGroups?: TopicGroup[];
  tagGroups?: TagGroup[];
};

function cleanPath(pathname: string) {
  const path = pathname.replace(/\/+$/, '').trim() || '/';
  return path === '' ? '/' : path;
}

function articleBodyOutline(items: PageContextTocItem[] = []): PageContextTocItem[] {
  const outline: PageContextTocItem[] = [];
  for (const item of items) {
    const children = articleBodyOutline(item.children ?? []);
    if (item.slug === '_top') {
      outline.push(...children);
      continue;
    }
    outline.push({ ...item, children });
  }
  return outline;
}

function inferKind(pathname: string, metadata: CanonicalContentMetadata): PageContextKind {
  const path = cleanPath(pathname);
  if (metadata.contentKind === 'article') return 'article';
  if (metadata.contentKind === 'author' || path === '/authors' || path.startsWith('/authors/')) return 'author';
  if (metadata.contentKind === 'topic' || path === '/topics' || path.startsWith('/topics/')) return 'topic';
  if (path === '/tags' || path.startsWith('/tags/')) return 'tag';
  if (metadata.contentKind === 'system' || path === '/404' || path === '/graphs') return 'system';
  if (path === '/') return 'index';
  if (path === '/archive') return 'archive';
  if (path === '/library') return 'saved';
  return 'generic';
}

function archiveOutline(articles: ConsumerArticleRecord[] = [], locale: Intl.LocalesArgument): PageContextTocItem[] {
  return [
    { slug: 'archive-title', text: 'Archives' },
    ...groupArticlesByMonth(articles, locale).map((group) => ({ slug: `archive-${group.slug}`, text: group.month }))
  ];
}

function defaultOutline(kind: PageContextKind, metadata: CanonicalContentMetadata, articles: ConsumerArticleRecord[], locale: Intl.LocalesArgument, path: string) {
  if (kind === 'index') return [{ slug: 'latest-title', text: 'Latest' }];
  if (kind === 'archive') return archiveOutline(articles, locale);
  if (kind === 'saved') return [{ slug: 'saved-title', text: 'Local inventory' }];
  if (kind === 'topic' && path === '/topics') {
    return [{ slug: '_top', text: String(metadata.title ?? 'Topics') }];
  }
  if (kind === 'author' && path === '/authors') {
    return [{ slug: 'gaga-authors-title', text: 'Authors' }];
  }
  if (kind === 'author' || kind === 'topic') {
    return [
      { slug: 'profile', text: 'Profil & Ringkasan' },
      { slug: 'writings', text: 'Daftar Tulisan' }
    ];
  }
  return [{ slug: '_top', text: String(metadata.title ?? 'Ikhtisar Halaman') }];
}

function value(text: string | undefined, href?: string): PageContextValue[] {
  return text ? [{ text, ...(href ? { href } : {}) }] : [];
}

function linkedValues(records: Array<{ title: string; href: string }>): PageContextValue[] {
  return records.map((record) => ({ text: record.title, href: record.href }));
}

function dateValue(datetime: string | undefined, locale: Intl.LocalesArgument): PageContextValue[] {
  return datetime ? [{ datetime, text: formatContentDate(datetime, undefined, locale) }] : [];
}

function fact(id: string, icon: string, labelId: string, labelEn: string, values: PageContextValue[]): PageContextFact | undefined {
  return values.length ? { id, icon, label: { id: labelId, en: labelEn }, values } : undefined;
}

function compactCards(articles: ConsumerArticleRecord[], limit = 3): PageContextCard[] {
  return articles.slice(0, limit).map((article) => ({
    title: String(article.metadata.title ?? article.id),
    href: article.href,
    meta: article.metadata.publishedAt,
    image: article.image,
    imageAlt: article.imageAlt
  }));
}

function matchingTopicForArticle(contentId: string | undefined, groups: TopicGroup[]) {
  if (!contentId) return undefined;
  const matches = groups.filter((group) => group.articles.some((article) => article.contentId === contentId));
  return matches.length === 1 ? matches[0] : undefined;
}

function currentTopic(pathname: string, groups: TopicGroup[]) {
  const path = cleanPath(pathname);
  return groups.find((group) => group.href === path);
}

function currentArticle(pathname: string, articles: ConsumerArticleRecord[]) {
  const path = cleanPath(pathname);
  const strippedPubPath = path.replace(/^\/publications(?=\/)/, '') || path;
  return articles.find((article) => {
    const articlePath = cleanPath(article.href);
    return articlePath === path || articlePath === strippedPubPath;
  });
}

function inferArticlePublicationType(article: ConsumerArticleRecord | undefined, fallbackTitle = ''): string {
  if (!article) {
    return fallbackTitle.toLowerCase().includes('catatan') ? 'note' : 'essay';
  }
  const rawId = article.id.toLowerCase();
  const title = article.metadata.title.toLowerCase();
  if (article.storyFormat && article.storyFormat !== 'standard') {
    const resolved = resolvePublicationType(article.storyFormat);
    if (resolved) return resolved.id;
  }
  if (rawId.includes('mengapa-ai-bukan-bukti') || rawId.includes('esg')) return 'analysis';
  if (rawId.includes('dialog-imajiner')) return 'experiment';
  if (rawId.includes('karsa-karya')) return 'case-study';
  if (rawId.includes('softcoded-systems')) return 'guide';
  if (rawId.includes('designing-context-aware')) return 'research';
  if (title.includes('catatan')) return 'note';
  return 'essay';
}

function inferArticleCanonicalTopics(article: ConsumerArticleRecord | undefined, metadataTopics: readonly string[] = []): string[] {
  const matched = new Set<string>();
  const rawItems = article
    ? [...article.topics, ...article.topicRefs, ...article.tags]
    : [...metadataTopics];
  for (const raw of rawItems) {
    const resolved = resolveCanonicalTopic(raw);
    if (resolved) matched.add(resolved.id);
    const lower = raw.toLowerCase();
    if (lower.includes('esg') || lower.includes('evidence') || lower.includes('pelaporan') || lower.includes('audit') || lower.includes('governance')) {
      matched.add('pelaporan');
    }
    if (lower.includes('ai') || lower.includes('akal-imitasi') || lower.includes('teknologi') || lower.includes('system') || lower.includes('publishing') || lower.includes('experience') || lower.includes('arsitektur')) {
      matched.add('teknologi');
    }
    if (lower.includes('anomali') || lower.includes('monopoly') || lower.includes('lizzie') || lower.includes('dignity') || lower.includes('imajiner')) {
      matched.add('anomali');
    }
  }
  if (matched.size === 0) {
    matched.add('teknologi');
  }
  return [...matched];
}

function buildArticleRelationsValues(
  slug: string,
  canonicalTopics: string[],
  tags: readonly string[],
  authors: readonly string[]
): PageContextValue[] {
  const values: PageContextValue[] = [];

  for (const topicId of canonicalTopics) {
    const topic = resolveCanonicalTopic(topicId);
    if (topic) {
      values.push({
        text: `belongsTo: ${topic.label}`,
        href: routes.topics.detail(topic.slug)
      });
    }
  }

  for (const tag of tags) {
    values.push({
      text: `taggedWith: #${tag}`,
      href: routes.knowledge.tagDetail(tagSlug(tag))
    });
  }

  for (const author of authors) {
    values.push({
      text: `writtenBy: ${author}`,
      href: routes.about.author
    });
  }

  for (const series of seriesRegistry) {
    if (series.publications.includes(slug)) {
      values.push({
        text: `partOfSeries: ${series.title}`,
        href: '/series'
      });
    }
  }

  for (const curation of curationRegistry) {
    if (curation.publications.includes(slug)) {
      values.push({
        text: `includedIn: ${curation.publicLabel}: ${curation.title}`,
        href: '/collections'
      });
    }
  }

  for (const ref of referenceRegistry) {
    if (ref.citedByPublications.includes(slug)) {
      values.push({
        text: `references: ${ref.title}`,
        href: routes.knowledge.referenceDetail(ref.slug)
      });
    }
  }

  return values.slice(0, 6);
}

function currentAuthor(pathname: string, authors: AuthorRecord[]) {
  const path = cleanPath(pathname);
  return authors.find((author) => cleanPath(author.href) === path);
}

function currentTag(pathname: string, tagGroups: TagGroup[]) {
  const path = cleanPath(pathname);
  return tagGroups.find((group) => cleanPath(group.href) === path);
}

function tagSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function tagValues(tags: readonly string[], groups: TagGroup[]): PageContextValue[] {
  const groupsBySlug = new Map(groups.map((group) => [group.slug, group]));
  return tags.map((tag) => {
    const slug = tagSlug(tag);
    const group = groupsBySlug.get(slug);
    return {
      text: `#${tag}`,
      href: routes.knowledge.tagDetail(slug || group?.slug || tag)
    };
  });
}

function relatedArticlesFor(article: ConsumerArticleRecord | undefined, articles: ConsumerArticleRecord[]) {
  const refs = new Set(article?.relatedRefs ?? []);
  if (!refs.size) return [];
  return articles.filter((candidate) => candidate.contentId && refs.has(candidate.contentId));
}

export function getPageContext(input: PageContextInput): PageContext {
  const {
    pathname,
    metadata,
    language,
    dateLocale,
    defaultAuthor,
    tocItems = [],
    articles = [],
    authors = [],
    topicGroups = [],
    tagGroups = []
  } = input;

  const path = cleanPath(pathname);
  const kind = inferKind(pathname, metadata);
  const locale = resolveContentDateLocale(metadata.language ?? language, dateLocale);
  const articleRecord = kind === 'article' ? currentArticle(pathname, articles) : undefined;
  const contentId = articleRecord?.contentId;
  const authorRefs = articleRecord?.authorRefs ?? [];
  const contributorRefs = articleRecord?.contributorRefs ?? [];
  const resolvedAuthors = authorRefs.map((ref) => authors.find((author) => author.contentId === ref)).filter((author): author is AuthorRecord => Boolean(author));
  const resolvedContributors = contributorRefs.map((ref) => authors.find((author) => author.contentId === ref)).filter((author): author is AuthorRecord => Boolean(author));
  const primaryAuthor = resolvedAuthors[0];
  const canonicalTopic = kind === 'article' ? matchingTopicForArticle(contentId, topicGroups) : currentTopic(pathname, topicGroups);
  const authorRecord = kind === 'author' ? currentAuthor(pathname, authors) : undefined;
  const tagRecord = kind === 'tag' ? currentTag(pathname, tagGroups) : undefined;
  const authorArticles = authorRecord ? articles.filter((article) => article.authorRefs.includes(authorRecord.contentId) || article.contributorRefs.includes(authorRecord.contentId)) : [];
  const topicArticles = canonicalTopic?.articles ?? [];
  const tagArticles = tagRecord?.articles ?? [];
  const updatedAt = metadata.updatedAt && metadata.updatedAt !== metadata.publishedAt ? metadata.updatedAt : undefined;

  const screenOwnedOutline = kind === 'index' || kind === 'archive' || kind === 'saved' || path === '/topics' || path === '/authors';
  const routeOwnedOutline = kind === 'article' ? articleBodyOutline(tocItems) : tocItems;
  const rawOutline = screenOwnedOutline
    ? defaultOutline(kind, metadata, articles, locale, path)
    : (routeOwnedOutline.length > 0 ? routeOwnedOutline : defaultOutline(kind, metadata, articles, locale, path));
  const outlineItems = sanitizeOutlineItems(rawOutline);

  const fallbackSnippet: Partial<Record<PageContextKind, string | undefined>> = {
    index: 'Latest adalah indeks publikasi terbaru publication dan pintu masuk utama ke knowledge workspace.',
    archive: 'Log kronologis seluruh publikasi publication.',
    saved: 'Daftar bacaan yang tersimpan secara lokal di perangkat ini.',
    author: path === '/authors' ? 'Direktori identitas penulis dan kontributor publik publication.' : undefined,
    topic: path === '/topics' ? 'Peta topik publik publication.' : undefined,
    tag: path === '/tags' ? 'Indeks label ringan yang berasal dari metadata publik publication.' : undefined,
    system: path === '/404' ? 'Route tidak ditemukan. Gunakan navigasi publication untuk berpindah ke area lain.' : undefined
  };
  const snippet = metadata.summary ?? metadata.description ?? fallbackSnippet[kind];

  const facts: PageContextFact[] = [];
  const pushFact = (candidate: PageContextFact | undefined) => { if (candidate) facts.push(candidate); };

  if (kind === 'article') {
    const articleIndex = articleRecord ? articles.indexOf(articleRecord) : -1;
    const objectId = contentId ?? (articleIndex >= 0 ? `pub_${String(articleIndex + 1).padStart(3, '0')}` : undefined);
    const pubTypeId = inferArticlePublicationType(articleRecord, String(metadata.title ?? ''));
    const pubType = resolvePublicationType(pubTypeId);
    const canonicalTopicIds = inferArticleCanonicalTopics(articleRecord, metadata.topics ?? []);
    const canonicalTopicValues: PageContextValue[] = canonicalTopicIds.map((topicId) => {
      const t = resolveCanonicalTopic(topicId);
      return {
        text: t?.label ?? topicId,
        href: routes.topics.detail(t?.slug ?? topicId)
      };
    });
    const cleanArticleSlug = String(articleRecord?.href || articleRecord?.id || path)
      .replace(/\.(md|mdx)$/i, '')
      .replace(/^\/+|\/+$/g, '')
      .replace(/^publications\//i, '');
    const relationAuthorIds = authorRefs.length ? authorRefs : [metadata.author ?? defaultAuthor];
    const relationValues = buildArticleRelationsValues(
      cleanArticleSlug,
      canonicalTopicIds,
      metadata.tags ?? articleRecord?.tags ?? [],
      relationAuthorIds
    );

    const rawTopics = canonicalTopicValues.length
      ? canonicalTopicValues.map((item) => item.text).join(', ')
      : (metadata.topics ?? []).length
        ? (metadata.topics ?? []).join(', ')
        : canonicalTopic?.topic ?? '';
    const contextLabel = [pubType.label, rawTopics, metadata.readTime].filter(Boolean).join(' · ');

    pushFact(fact('objectId', 'fingerprint', 'OBJEK', 'OBJECT', value(objectId)));
    pushFact(fact('publicationType', 'category', 'TIPE', 'TYPE', value(`${pubType.label} (${pubType.id})`)));
    pushFact(fact('contextMeta', 'sell', 'LABEL ARTIKEL', 'ARTICLE LABEL', value(contextLabel)));
    pushFact(fact('publishedDate', 'calendar_month', 'DITERBITKAN', 'PUBLISHED', dateValue(metadata.publishedAt, locale)));
    pushFact(fact('updatedDate', 'sync', 'DIPERBARUI', 'UPDATED', dateValue(updatedAt, locale)));
    pushFact(fact('author', 'person', 'PENULIS', 'AUTHOR', resolvedAuthors.length ? linkedValues(resolvedAuthors) : value(metadata.author ?? defaultAuthor)));
    pushFact(fact('contributors', 'person', 'KONTRIBUTOR', 'CONTRIBUTORS', linkedValues(resolvedContributors)));
    pushFact(fact('readTime', 'schedule', 'WAKTU BACA', 'READ TIME', value(metadata.readTime)));
    pushFact(fact('topic', 'grid_view', 'TOPIK', 'TOPIC', canonicalTopicValues.length ? canonicalTopicValues : canonicalTopic ? [{ text: canonicalTopic.topic, href: canonicalTopic.href }] : (metadata.topics ?? []).map((t) => ({ text: t }))));
    pushFact(fact('tags', 'sell', 'TAG', 'TAGS', tagValues(metadata.tags ?? [], tagGroups)));
    pushFact(fact('knowledgeRelations', 'hub', 'RELASI PENGETAHUAN', 'KNOWLEDGE RELATIONS', relationValues));
    pushFact(fact('graph', 'account_tree', 'GRAPH', 'GRAPH', contentId ? [{ text: 'Local graph', href: `/graphs?focus=${encodeURIComponent(contentId)}` }] : []));
  } else if (kind === 'index') {
    const leadArticle = articles[0];
    const leadTopics = (leadArticle?.metadata.topics ?? []).join(', ') || 'Anomali, Teknologi';
    const leadReadTime = leadArticle?.metadata.readTime ?? '5 min';
    const leadContextLabel = ['Esai', leadTopics, leadReadTime].filter(Boolean).join(' · ');
    pushFact(fact('previewTitle', 'article', 'FOKUS KONTEKS', 'CONTEXT FOCUS', value(String(leadArticle?.metadata.title ?? 'Mengapa AI Bukan Bukti'), leadArticle?.href)));
    pushFact(fact('contextMeta', 'sell', 'LABEL ARTIKEL', 'ARTICLE LABEL', value(leadContextLabel)));
    pushFact(fact('topics', 'grid_view', 'TOPIK', 'TOPICS', value(leadTopics)));
    pushFact(fact('readTime', 'schedule', 'WAKTU BACA', 'READ TIME', value(leadReadTime)));
    pushFact(fact('publishedDate', 'calendar_month', 'DITERBITKAN', 'PUBLISHED', dateValue(leadArticle?.metadata.publishedAt, locale)));
    pushFact(fact('entries', 'inventory_2', 'TOTAL PUBLIKASI', 'TOTAL PUBLICATIONS', value(`${articles.length} publikasi`)));
  } else if (kind === 'archive') {
    pushFact(fact('contextMeta', 'sell', 'KLASIFIKASI', 'CLASSIFICATION', value('Arsip Kronologis Publikasi')));
    pushFact(fact('entries', 'inventory_2', 'ARTIKEL', 'ARTICLES', value(`${articles.length}`)));
    pushFact(fact('author', 'person', 'PENULIS', 'AUTHOR', value(metadata.author ?? defaultAuthor)));
    pushFact(fact('topics', 'grid_view', 'TOPIK', 'TOPICS', topicGroups.map((group) => ({ text: group.topic, href: group.href }))));
  } else if (kind === 'author') {
    pushFact(fact('contextMeta', 'sell', 'KLASIFIKASI', 'CLASSIFICATION', value(authorRecord ? 'Profil Penulis & Kontributor' : 'Direktori Penulis')));
    pushFact(authorRecord
      ? fact('articles', 'article', 'TULISAN', 'ARTICLES', value(`${authorArticles.length}`))
      : fact('authors', 'person', 'PENULIS', 'AUTHORS', value(`${authors.length}`)));
    if (authorRecord) {
      pushFact(fact('identity', 'person', 'IDENTITAS', 'IDENTITY', [{ text: authorRecord.title, href: authorRecord.href }]));
      const authorTopicLinks = topicGroups
        .filter((group) => group.articles.some((article) => article.authorRefs.includes(authorRecord.contentId) || article.contributorRefs.includes(authorRecord.contentId)))
        .map((group) => ({ text: group.topic, href: group.href }));
      pushFact(fact('topics', 'grid_view', 'TOPIK', 'TOPICS', authorTopicLinks));
      pushFact(fact('graph', 'account_tree', 'GRAPH', 'GRAPH', [{ text: 'Local graph', href: `/graphs?focus=${encodeURIComponent(authorRecord.contentId)}` }]));
    }
  } else if (kind === 'topic') {
    pushFact(fact('contextMeta', 'sell', 'KLASIFIKASI', 'CLASSIFICATION', value(canonicalTopic ? `Topik Kanonik · ${canonicalTopic.topic}` : 'Indeks Topik Publikasi')));
    pushFact(canonicalTopic
      ? fact('articles', 'article', 'ARTIKEL', 'ARTICLES', value(`${topicArticles.length}`))
      : fact('topics', 'grid_view', 'TOPIK', 'TOPICS', value(`${topicGroups.length}`)));
    pushFact(fact('author', 'person', 'PENULIS', 'AUTHOR', value(metadata.author ?? defaultAuthor)));
    if (canonicalTopic?.contentId) {
      pushFact(fact('graph', 'account_tree', 'GRAPH', 'GRAPH', [{ text: 'Local graph', href: `/graphs?focus=${encodeURIComponent(canonicalTopic.contentId)}` }]));
    }
  } else if (kind === 'tag') {
    pushFact(fact('contextMeta', 'sell', 'KLASIFIKASI', 'CLASSIFICATION', value(tagRecord ? `Indeks Tag · #${tagRecord.tag}` : 'Indeks Tag Publikasi')));
    pushFact(tagRecord
      ? fact('articles', 'article', 'ARTIKEL', 'ARTICLES', value(`${tagArticles.length}`))
      : fact('tags', 'sell', 'TAG', 'TAGS', value(`${tagGroups.length}`)));
  } else if (kind === 'saved') {
    pushFact(fact('contextMeta', 'sell', 'KLASIFIKASI', 'CLASSIFICATION', value('Pustaka & Memori Bacaan Lokal')));
    pushFact(fact('scope', 'bookmark', 'PENYIMPANAN', 'STORAGE', value('Perangkat ini')));
  } else {
    pushFact(fact('contextMeta', 'sell', 'KLASIFIKASI', 'CLASSIFICATION', value(kind === 'system' ? 'Dokumentasi & Infrastruktur Sistem' : 'Halaman Publikasi Kanonik')));
    pushFact(fact('publishedDate', 'calendar_month', 'DITERBITKAN', 'PUBLISHED', dateValue(metadata.publishedAt, locale)));
    pushFact(fact('updatedDate', 'sync', 'DIPERBARUI', 'UPDATED', dateValue(updatedAt, locale)));
    pushFact(fact('author', 'person', 'PENULIS', 'AUTHOR', resolvedAuthors.length ? linkedValues(resolvedAuthors) : value(metadata.author ?? defaultAuthor)));
    pushFact(fact('readTime', 'schedule', 'WAKTU BACA', 'READ TIME', value(metadata.readTime)));
    pushFact(fact('topics', 'grid_view', 'TOPIK', 'TOPICS', (metadata.topics ?? []).length ? (metadata.topics ?? []).map((topic) => ({ text: topic })) : topicGroups.map((group) => ({ text: group.topic, href: group.href }))));
    pushFact(fact('tags', 'sell', 'TAG', 'TAGS', tagValues(metadata.tags ?? [], tagGroups)));
  }

  const discovery = kind === 'index'
    ? compactCards(articles, 3)
    : kind === 'author'
      ? compactCards(authorArticles, 3)
      : kind === 'topic'
        ? compactCards(topicArticles, 3)
        : kind === 'tag'
          ? compactCards(tagArticles, 3)
          : kind === 'article'
            ? compactCards(relatedArticlesFor(articleRecord, articles), 3)
            : [];

  const breadcrumbs: BreadcrumbItem[] = kind === 'article'
    ? [
        { label: 'Home', href: '/landing' },
        { label: 'Blog', href: '/' },
        ...(canonicalTopic ? [{ label: canonicalTopic.topic, href: canonicalTopic.href }] : [])
      ]
    : kind === 'author' && authorRecord
      ? [{ label: 'Home', href: '/landing' }, { label: 'Authors', href: '/authors' }, { label: authorRecord.title, current: true }]
      : kind === 'topic' && canonicalTopic
        ? [{ label: 'Home', href: '/landing' }, { label: 'Topics', href: '/topics' }, { label: canonicalTopic.topic, current: true }]
        : kind === 'tag' && tagRecord
          ? [{ label: 'Home', href: '/landing' }, { label: 'Tags', href: '/tags' }, { label: tagRecord.tag, current: true }]
        : [];

  return {
    kind,
    outlineItems,
    hasTableOfContents: outlineItems.length > 0,
    snippet,
    facts,
    discovery,
    breadcrumbs,
    topics: metadata.topics,
    tags: metadata.tags,
    publishedDate: kind === 'article' && metadata.publishedAt ? { datetime: metadata.publishedAt, text: formatContentDate(metadata.publishedAt, undefined, locale) } : undefined,
    updatedAtDisplay: kind === 'article' && updatedAt ? { datetime: updatedAt, text: formatContentDate(updatedAt, undefined, locale) } : undefined,
    readTime: metadata.readTime,
    author: primaryAuthor?.title ?? metadata.author ?? defaultAuthor,
    cta: kind === 'index' && articles[0] ? { label: 'Read Article', href: articles[0].href } : undefined
  };
}
