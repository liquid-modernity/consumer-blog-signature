import type { GagaShareContext, GagaShareMetadata } from './types';
import { getShareChannels } from './registry';

export function resolveShareContext(metadata: GagaShareMetadata): GagaShareContext {
  return {
    metadata,
    channels: getShareChannels()
  };
}
