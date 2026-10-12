import type { ConsumerArticleRecord } from './content';
import { getArticles } from './content';
import type { EditorialRole, StoryFormat } from '../config/editorial-schema';

export interface EditorialStory {
  article: ConsumerArticleRecord;
  role: EditorialRole;
  format: StoryFormat;
  section?: string;
  kicker?: string;
  priority: number;
  featured: boolean;
  breaking: boolean;
  live: boolean;
}

export interface EditorialSection {
  name: string;
  stories: EditorialStory[];
}

export interface EditorialFrontProjection {
  lead?: EditorialStory;
  highlights: EditorialStory[];
  latest: EditorialStory[];
  sections: EditorialSection[];
  total: number;
}

const roleWeight: Record<EditorialRole, number> = {
  lead: 400,
  major: 300,
  standard: 200,
  brief: 100
};

function publishedTimestamp(article: ConsumerArticleRecord) {
  const value = article.metadata.publishedAt;
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function asStory(article: ConsumerArticleRecord): EditorialStory {
  return {
    article,
    role: article.editorialRole,
    format: article.storyFormat,
    section: article.section,
    kicker: article.kicker,
    priority: article.editorialPriority,
    featured: article.featured,
    breaking: article.breaking,
    live: article.live
  };
}

function editorialScore(story: EditorialStory) {
  return (
    roleWeight[story.role] * 1_000_000
    + story.priority * 10_000
    + (story.breaking ? 3_000 : 0)
    + (story.live ? 2_000 : 0)
    + (story.featured ? 1_000 : 0)
    + Math.floor(publishedTimestamp(story.article) / 86_400_000)
  );
}

function ranked(stories: EditorialStory[]) {
  return [...stories].sort((left, right) => (
    editorialScore(right) - editorialScore(left)
    || publishedTimestamp(right.article) - publishedTimestamp(left.article)
    || left.article.metadata.title.localeCompare(right.article.metadata.title)
  ));
}

export function projectEditorialFront(
  articles: ConsumerArticleRecord[],
  options: { highlightLimit?: number; latestLimit?: number; sectionStoryLimit?: number } = {}
): EditorialFrontProjection {
  const highlightLimit = options.highlightLimit ?? 4;
  const latestLimit = options.latestLimit ?? 12;
  const sectionStoryLimit = options.sectionStoryLimit ?? 6;
  const stories = ranked(articles.map(asStory));

  const explicitLead = stories.find((story) => story.role === 'lead');
  const fallbackLead = stories.find((story) => story.breaking)
    ?? stories.find((story) => story.featured)
    ?? stories[0];
  const lead = explicitLead ?? fallbackLead;

  const highlightCandidates = stories.filter((story) => (
    story !== lead
    && (story.role === 'major' || story.featured || story.breaking || story.live)
  ));
  const highlights = highlightCandidates.slice(0, highlightLimit);

  const reserved = new Set([
    lead?.article.contentId ?? lead?.article.id,
    ...highlights.map((story) => story.article.contentId ?? story.article.id)
  ].filter(Boolean));

  const latest = [...stories]
    .sort((left, right) => (
      publishedTimestamp(right.article) - publishedTimestamp(left.article)
      || editorialScore(right) - editorialScore(left)
    ))
    .filter((story) => !reserved.has(story.article.contentId ?? story.article.id))
    .slice(0, latestLimit);

  const bySection = new Map<string, EditorialStory[]>();
  for (const story of stories) {
    const section = story.section?.trim();
    if (!section) continue;
    const group = bySection.get(section) ?? [];
    group.push(story);
    bySection.set(section, group);
  }

  const sections = [...bySection.entries()]
    .map(([name, sectionStories]) => ({
      name,
      stories: ranked(sectionStories).slice(0, sectionStoryLimit)
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    lead,
    highlights,
    latest,
    sections,
    total: stories.length
  };
}

export async function getEditorialFront() {
  return projectEditorialFront(await getArticles());
}
