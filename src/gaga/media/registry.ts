import type { GagaMediaType } from './types';

const mediaRegistry = new Map<GagaMediaType, string>();

export function registerGagaMedia(type: GagaMediaType, renderer: string) {
  mediaRegistry.set(type, renderer);
}

export function resolveGagaMedia(type: GagaMediaType) {
  return mediaRegistry.get(type);
}
