import {
  getArticles,
  getAuthors,
  getTagGroups,
  toArticlePreview,
  type ConsumerArticleRecord
} from './content';
import { contentDefaults } from '../config/content';
import { resolveContentDateLocale } from '@gaga/engine-capabilities/content';
import {
  curationRegistry,
  getEnabledTopics,
  referenceRegistry,
  resolveCanonicalTopic,
  resolvePublicationType,
  publicationTypeRegistry,
  seriesRegistry,
  validatePublicationInvariant,
  type CanonicalPublication,
  type ContentProviderAdapter,
  type KnowledgeRelation,
  type ReferenceObject,
  type TopicDefinition
} from '../config/pakrpp-architecture';
import { routes } from '../config/routes';

export interface ArchiveYearGroup {
  year: string;
  href: string;
  count: number;
  months: ArchiveMonthSummary[];
  publications: CanonicalPublication[];
}

export interface ArchiveMonthSummary {
  year: string;
  month: string;
  label: string;
  href: string;
  count: number;
  publications: CanonicalPublication[];
}

export interface KnowledgeIndexLetterGroup {
  letter: string;
  items: {
    id: string;
    title: string;
    kindLabel: string;
    href: string;
    meta: string;
  }[];
}

const MONTH_NAMES_ID: Record<string, string> = {
  '01': 'Januari',
  '02': 'Februari',
  '03': 'Maret',
  '04': 'April',
  '05': 'Mei',
  '06': 'Juni',
  '07': 'Juli',
  '08': 'Agustus',
  '09': 'September',
  '10': 'Oktober',
  '11': 'November',
  '12': 'Desember'
};

function cleanSlug(hrefOrId: string): string {
  return String(hrefOrId)
    .replace(/\.(md|mdx)$/i, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/^publications\//i, '');
}

export function canonicalPublicationHref(article: Pick<ConsumerArticleRecord, 'href' | 'id'>): string {
  return routes.publications.detail(cleanSlug(article.href || article.id));
}

function extractYearMonth(isoOrDate?: string): { year: string; month: string } {
  if (!isoOrDate) return { year: '2026', month: '10' };
  const match = String(isoOrDate).match(/^(\d{4})-(\d{2})/);
  if (match) {
    return { year: match[1], month: match[2] };
  }
  const parsed = new Date(isoOrDate);
  if (!Number.isNaN(parsed.getTime())) {
    return {
      year: String(parsed.getUTCFullYear()),
      month: String(parsed.getUTCMonth() + 1).padStart(2, '0')
    };
  }
  return { year: '2026', month: '10' };
}

export function inferPublicationType(article: ConsumerArticleRecord): string {
  if (article.publicationType && publicationTypeRegistry.some(type => type.id === article.publicationType)) return article.publicationType;
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

export function inferCanonicalTopics(article: ConsumerArticleRecord): string[] {
  const matched = new Set<string>();
  for (const raw of [...article.topics, ...article.topicRefs, ...article.tags]) {
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

function buildRelationsForPublication(
  slug: string,
  canonicalTopics: string[],
  tags: string[],
  authors: string[]
): { references: string[]; relations: KnowledgeRelation[] } {
  const relations: KnowledgeRelation[] = [];

  for (const topicId of canonicalTopics) {
    const topic = resolveCanonicalTopic(topicId);
    if (topic) {
      relations.push({
        type: 'belongsTo',
        targetId: `topic.${topic.id}`,
        targetKind: 'topic',
        label: topic.label,
        href: routes.topics.detail(topic.slug)
      });
    }
  }

  for (const tag of tags) {
    relations.push({
      type: 'taggedWith',
      targetId: `tag.${tag}`,
      targetKind: 'tag',
      label: `#${tag}`,
      href: routes.knowledge.tagDetail(tag)
    });
  }

  for (const author of authors) {
    relations.push({
      type: 'writtenBy',
      targetId: author,
      targetKind: 'author',
      label: author,
      href: routes.about.author
    });
  }

  for (const series of seriesRegistry) {
    if (series.publications.includes(slug)) {
      relations.push({
        type: 'partOfSeries',
        targetId: series.id,
        targetKind: 'series',
        label: series.title,
        href: `/series`
      });
    }
  }

  for (const curation of curationRegistry) {
    if (curation.publications.includes(slug)) {
      relations.push({
        type: 'includedIn',
        targetId: curation.id,
        targetKind: 'curation',
        label: `${curation.publicLabel}: ${curation.title}`,
        href: `/collections`
      });
    }
  }

  const citedReferences: string[] = [];
  for (const ref of referenceRegistry) {
    if (ref.citedByPublications.includes(slug)) {
      citedReferences.push(ref.id);
      relations.push({
        type: 'references',
        targetId: ref.id,
        targetKind: 'reference',
        label: ref.title,
        href: routes.knowledge.referenceDetail(ref.slug)
      });
    }
  }

  return { references: citedReferences, relations };
}

export async function toCanonicalPublications(): Promise<CanonicalPublication[]> {
  const articles = await getArticles();
  const locale = resolveContentDateLocale(
    contentDefaults.defaultLanguage,
    contentDefaults.dateLocale
  );

  return articles.map((article, index): CanonicalPublication => {
    const preview = toArticlePreview(article, locale, contentDefaults.preview);
    const slug = cleanSlug(article.href || article.id);
    const type = inferPublicationType(article);
    const topics = inferCanonicalTopics(article);
    const publishedRaw = article.metadata.publishedAt ?? preview.date ?? '2026-10-19';
    const { year, month } = extractYearMonth(publishedRaw);
    const authors = article.authorRefs.length
      ? article.authorRefs
      : [preview.author || contentDefaults.defaultAuthor];
    const { references, relations } = buildRelationsForPublication(slug, topics, article.tags, authors);

    const pub: CanonicalPublication = {
      id: article.contentId || `pub_${String(index + 1).padStart(3, '0')}`,
      type,
      slug,
      title: preview.title,
      status: 'published',
      publishedAt: publishedRaw,
      updatedAt: article.metadata.updatedAt ?? publishedRaw,
      authors,
      topics,
      tags: article.tags,
      references,
      relations,
      summary: preview.snippet,
      readTime: preview.readTime,
      href: preview.href,
      canonicalHref: canonicalPublicationHref(article),
      year,
      month
    };

    validatePublicationInvariant(pub);
    return pub;
  });
}

export async function getCanonicalPublicationBySlug(slug: string): Promise<{
  publication: CanonicalPublication;
  article: ConsumerArticleRecord;
} | undefined> {
  const clean = cleanSlug(slug);
  const [publications, articles] = await Promise.all([
    toCanonicalPublications(),
    getArticles()
  ]);

  const index = publications.findIndex((item) => item.slug === clean || cleanSlug(item.href) === clean);
  if (index === -1) return undefined;
  return {
    publication: publications[index],
    article: articles[index]
  };
}

export async function getCanonicalTopicsWithCounts(): Promise<
  (TopicDefinition & { count: number; href: string; publications: CanonicalPublication[] })[]
> {
  const [topics, publications] = await Promise.all([
    Promise.resolve(getEnabledTopics()),
    toCanonicalPublications()
  ]);

  return topics.map((topic) => {
    const matching = publications.filter((pub) => pub.topics.includes(topic.id));
    return {
      ...topic,
      href: routes.topics.detail(topic.slug),
      count: matching.length,
      publications: matching
    };
  });
}

export async function getArchiveYears(): Promise<ArchiveYearGroup[]> {
  const publications = await toCanonicalPublications();
  const yearMap = new Map<string, CanonicalPublication[]>();

  for (const year of ['2026', '2025', '2024']) {
    yearMap.set(year, []);
  }

  for (const pub of publications) {
    const year = pub.year || '2026';
    const list = yearMap.get(year) ?? [];
    list.push(pub);
    yearMap.set(year, list);
  }

  return [...yearMap.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([year, pubs]) => {
      const monthMap = new Map<string, CanonicalPublication[]>();
      for (const pub of pubs) {
        const m = pub.month || '01';
        const mList = monthMap.get(m) ?? [];
        mList.push(pub);
        monthMap.set(m, mList);
      }

      const months: ArchiveMonthSummary[] = [...monthMap.entries()]
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([month, monthPubs]) => ({
          year,
          month,
          label: `${MONTH_NAMES_ID[month] ?? month} ${year}`,
          href: routes.archive.month(year, month),
          count: monthPubs.length,
          publications: monthPubs
        }));

      return {
        year,
        href: routes.archive.year(year),
        count: pubs.length,
        months,
        publications: pubs
      };
    });
}

export async function getSystematicKnowledgeIndex(): Promise<KnowledgeIndexLetterGroup[]> {
  const [publications, topics, tags, authors] = await Promise.all([
    toCanonicalPublications(),
    getCanonicalTopicsWithCounts(),
    getTagGroups(),
    getAuthors()
  ]);

  const entries: {
    id: string;
    title: string;
    kindLabel: string;
    href: string;
    meta: string;
  }[] = [];

  for (const pub of publications) {
    const pubType = resolvePublicationType(pub.type);
    entries.push({
      id: pub.id,
      title: pub.title,
      kindLabel: `Publikasi · ${pubType.label}`,
      href: pub.canonicalHref,
      meta: `${pub.year ?? '2026'} · ${pub.topics.map((t) => resolveCanonicalTopic(t)?.label ?? t).join(', ')}`
    });
  }

  for (const topic of topics) {
    entries.push({
      id: `topic.${topic.id}`,
      title: topic.label,
      kindLabel: 'Topik',
      href: topic.href,
      meta: `${topic.count} publikasi · ${topic.description}`
    });
  }

  for (const ref of referenceRegistry) {
    entries.push({
      id: ref.id,
      title: ref.title,
      kindLabel: `Referensi · ${ref.sourceType.toUpperCase()}`,
      href: routes.knowledge.referenceDetail(ref.slug),
      meta: `${ref.year} · ${ref.authors.join(', ')}`
    });
  }

  for (const series of seriesRegistry) {
    entries.push({
      id: series.id,
      title: series.title,
      kindLabel: 'Seri Editorial',
      href: '/series',
      meta: `${series.publications.length} publikasi dalam sekuens`
    });
  }

  for (const curation of curationRegistry) {
    entries.push({
      id: curation.id,
      title: curation.title,
      kindLabel: curation.publicLabel,
      href: '/collections',
      meta: `${curation.publications.length} publikasi terkurasi`
    });
  }

  for (const tag of tags) {
    entries.push({
      id: `tag.${tag.slug}`,
      title: `#${tag.tag}`,
      kindLabel: 'Tag Pengetahuan',
      href: routes.knowledge.tagDetail(tag.slug),
      meta: `${tag.count} publikasi terkait`
    });
  }

  for (const author of authors) {
    entries.push({
      id: author.contentId,
      title: author.title,
      kindLabel: 'Penulis',
      href: routes.about.author,
      meta: author.summary ?? 'Kontributor Editorial'
    });
  }

  const byLetter = new Map<string, typeof entries>();
  for (const entry of entries.sort((a, b) => a.title.replace(/^#/, '').localeCompare(b.title.replace(/^#/, '')))) {
    const rawFirst = entry.title.replace(/^#/, '').trim().charAt(0).toUpperCase() || '#';
    const letter = /[A-Z]/.test(rawFirst) ? rawFirst : '#';
    const list = byLetter.get(letter) ?? [];
    list.push(entry);
    byLetter.set(letter, list);
  }

  return [...byLetter.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, items]) => ({ letter, items }));
}

export const localContentAdapter: ContentProviderAdapter = {
  providerId: 'emdash-cms',
  providerName: 'Read-only admitted EmDash published export',
  async getPublications() {
    return toCanonicalPublications();
  },
  async getPublicationBySlug(slug: string) {
    const match = await getCanonicalPublicationBySlug(slug);
    return match?.publication;
  },
  async getTopics() {
    return getEnabledTopics();
  },
  async getReferences(): Promise<readonly ReferenceObject[]> {
    return referenceRegistry;
  }
};
