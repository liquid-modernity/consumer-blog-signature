import type { GagaShareMetadata } from './types';

export function createShareMetadata(input: GagaShareMetadata): GagaShareMetadata {
  return {
    ...input,
    url: input.url.replace(/#.*$/, '')
  };
}
