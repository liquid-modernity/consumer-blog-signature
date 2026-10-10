import { gagaMediaRegistry } from '../config/gaga-media-registry';

export function resolveGagaMedia(type: keyof typeof gagaMediaRegistry) {
  return gagaMediaRegistry[type];
}
