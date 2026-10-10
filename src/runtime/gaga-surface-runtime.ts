import { gagaSurfaceRegistry } from '../config/gaga-surface-registry';

export function resolveGagaSurface(surface: keyof typeof gagaSurfaceRegistry) {
  return gagaSurfaceRegistry[surface];
}
