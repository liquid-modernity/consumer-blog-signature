import type { GagaSurfaceCapability } from './types';

export const gagaSurfaceRegistry: GagaSurfaceCapability[] = [
  { id: 'dynamic-notch', state: 'collapsed', capabilities: ['actions', 'progress', 'context'] },
  { id: 'dynamic-outline-peek', state: 'collapsed', capabilities: ['outline', 'navigation'] },
  { id: 'dock', state: 'collapsed', capabilities: ['actions', 'personalize', 'share'] },
  { id: 'context-rail', state: 'collapsed', capabilities: ['navigation', 'intelligence'] },
];
