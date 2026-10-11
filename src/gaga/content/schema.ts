import { z } from 'astro/zod';

export const gagaDocumentSchema = z.object({
  contentKind: z.enum([
    'index',
    'page',
    'article',
    'topic',
    'system',
    'legal',
    'author'
  ]).default('page'),

  title: z.string().optional(),
  subtitle: z.string().nullable().optional(),

  author: z.string().default('Editorial Team'),

  language: z.enum([
    'id',
    'en'
  ]).default('id'),

  date: z.union([
    z.string(),
    z.date()
  ]).optional(),

  updatedDate: z.union([
    z.string(),
    z.date()
  ]).optional(),

  draft: z.boolean().default(false),

  tags: z.array(z.string()).default([]),

  topics: z.array(z.string()).default([]),

  summary: z.string().optional()
});
