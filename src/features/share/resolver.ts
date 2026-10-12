import type { ShareContext, ShareIntent } from './contracts';

export function resolveShareIntent(
  context: ShareContext
): ShareIntent {
  return {
    mode: context.freshness === 'breaking'
      ? 'breaking'
      : 'article',
    context,
  };
}
