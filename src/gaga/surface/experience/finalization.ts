import type { GagaExperienceSurface } from './types';

export const gagaExperienceSurfaces: GagaExperienceSurface[] = [
  {
    surface: 'notch',
    device: 'mobile',
    behavior: {
      collapsible: true,
      attached: true,
      immersive: true,
    },
  },
  {
    surface: 'outline-peek',
    device: 'desktop',
    behavior: {
      collapsible: true,
      attached: true,
      immersive: true,
    },
  },
];

export function getExperienceSurface(
  surface: GagaExperienceSurface['surface'],
  device: GagaExperienceSurface['device'],
) {
  return gagaExperienceSurfaces.find(
    (item) => item.surface === surface && item.device === device,
  );
}
