import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

const dateField = z.union([z.string(), z.date()]).optional().transform((value) => (
  value instanceof Date ? value.toISOString().slice(0, 10) : value
));

const consumerFrontmatter = z.object({
  /** Screen/content routing. Keep this small so non-coders can author from Obsidian. */
  contentKind: z.enum(['index', 'page', 'article', 'topic', 'system', 'legal', 'author']).default('page'),
  contentClass: z.string().optional(),
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
  noindex: z.boolean().default(false),

  /** Canonical publishing metadata. */
  schemaVersion: z.union([z.string(), z.number()]).optional(),
  contentId: z.string().optional(),
  subtitle: z.string().nullable().optional(),
  author: z.string().default('Editorial Team'),
  authorRefs: z.array(z.string()).default([]),
  contributorRefs: z.array(z.string()).default([]),
  language: z.enum(['id', 'en']).default('id'),
  slug: z.string().optional(),
  canonical: z.string().optional(),
  date: dateField,
  updatedDate: dateField,
  pubDate: dateField,
  updated: dateField,
  publishedAt: dateField,
  updatedAt: dateField,
  visibility: z.string().optional(),
  lastReviewed: dateField,
  reviewAfter: dateField,
  volatility: z.string().optional(),
  readTime: z.string().optional(),

  /** Discovery metadata: Search, GEO/GEA/SEA, Google, and AI readability. */
  seoTitle: z.string().optional(),
  seo_title: z.string().optional(),
  metaDescription: z.string().optional(),
  meta_description: z.string().optional(),
  summary: z.string().optional(),
  aiSummary: z.string().optional(),
  keyQuestions: z.array(z.string()).default([]),
  targetIntent: z.array(z.string()).default([]),
  target_intent: z.array(z.string()).default([]),
  topics: z.array(z.string()).default([]),
  topicRefs: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
  series: z.string().optional(),
  image: z.string().optional(),
  imageAlt: z.string().optional(),

  /** Obsidian/source fields retained for vault round-tripping. */
  type: z.string().optional(),
  status: z.string().optional(),
  aliases: z.array(z.string()).default([]),
  primary_question: z.string().optional(),
  unique_insight: z.string().optional(),
  main_entities: z.array(z.string()).default([]),
  related_concepts: z.array(z.string()).default([]),
  related_sources: z.array(z.string()).nullable().optional(),
  relatedRefs: z.array(z.string()).default([]),
  sourceRefs: z.array(z.string()).default([]),
  entityRefs: z.array(z.string()).default([]),
  mainEntityRefs: z.array(z.string()).default([]),
  publish_readiness: z.string().optional(),
  source_pass: z.string().optional(),
  faq_pass: z.string().optional(),
  link_pass: z.string().optional(),
  order: z.number().optional()
});

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({ extend: consumerFrontmatter })
  })
};
