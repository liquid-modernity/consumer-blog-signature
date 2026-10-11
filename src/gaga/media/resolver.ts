import type { GagaMedia } from './types';

export function resolveMedia(media: GagaMedia) {
  return {
    ...media,
    intent: media.intent ?? 'content'
  };
}
