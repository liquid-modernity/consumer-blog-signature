import type { ConsumerArticleRecord } from './content';
import { coverageModeIsPromotable, type CoverageAuthority } from '../config/coverage';

export interface CoveragePromotion {
  article: ConsumerArticleRecord;
  coverage: CoverageAuthority;
}

function timestamp(value?: string) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function modeWeight(mode: CoverageAuthority['mode']) {
  if (mode === 'breaking') return 300;
  if (mode === 'live') return 200;
  return 0;
}

function promotionScore(item: CoveragePromotion) {
  return (
    modeWeight(item.coverage.mode) * 1_000_000
    + item.article.editorialPriority * 10_000
    + timestamp(item.coverage.updatedAt)
  );
}

export function selectCoveragePromotion(
  articles: ConsumerArticleRecord[]
): CoveragePromotion | undefined {
  return articles
    .filter((article) => coverageModeIsPromotable(article.coverage))
    .map((article) => ({ article, coverage: article.coverage }))
    .sort((left, right) => (
      promotionScore(right) - promotionScore(left)
      || timestamp(right.article.metadata.publishedAt) - timestamp(left.article.metadata.publishedAt)
      || left.article.metadata.title.localeCompare(right.article.metadata.title)
    ))[0];
}
