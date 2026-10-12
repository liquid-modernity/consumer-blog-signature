export const freshnessVolatilityValues = ['low', 'medium', 'high'] as const;
export type FreshnessVolatility = typeof freshnessVolatilityValues[number] | 'unknown';
export type FreshnessStatus = 'unknown' | 'reviewed' | 'current' | 'review-due';

export interface FreshnessAuthority {
  status: FreshnessStatus;
  volatility: FreshnessVolatility;
  lastReviewed?: string;
  reviewAfter?: string;
}

function validDateString(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim().length === 0) return false;
  return !Number.isNaN(new Date(value).getTime());
}

export function normalizeFreshnessVolatility(value: unknown): FreshnessVolatility {
  return freshnessVolatilityValues.includes(value as typeof freshnessVolatilityValues[number])
    ? value as FreshnessVolatility
    : 'unknown';
}

export function resolveFreshnessAuthority(
  data: Record<string, unknown>,
  now: Date = new Date()
): FreshnessAuthority {
  const lastReviewed = validDateString(data.lastReviewed) ? data.lastReviewed : undefined;
  const reviewAfter = validDateString(data.reviewAfter) ? data.reviewAfter : undefined;
  const volatility = normalizeFreshnessVolatility(data.volatility);

  if (!lastReviewed && !reviewAfter) {
    return { status: 'unknown', volatility };
  }

  if (reviewAfter) {
    const reviewAt = new Date(reviewAfter).getTime();
    return {
      status: now.getTime() >= reviewAt ? 'review-due' : 'current',
      volatility,
      ...(lastReviewed ? { lastReviewed } : {}),
      reviewAfter
    };
  }

  return {
    status: 'reviewed',
    volatility,
    ...(lastReviewed ? { lastReviewed } : {})
  };
}

export function isContinuityEligibleContent(
  data: Record<string, unknown>,
  contentKind: string | undefined
) {
  return contentKind === 'article'
    && data.draft !== true
    && data.noindex !== true
    && data.status === 'published'
    && data.visibility === 'public';
}
