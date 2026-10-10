import type { APIRoute } from 'astro';
import { contentDefaults } from '../config/content';
import { seoConfig } from '../config/seo';
import { getArticles, getTagGroups, getTopicGroups } from '../lib/content';
import { absoluteUrl } from '@gaga/engine/seo';

export const GET: APIRoute = async () => {
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
  return new Response(JSON.stringify({
    items: articles.map((article) => ({
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
    }))
  }), {
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
};
