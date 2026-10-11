export type GagaSurfaceInteraction =
  | 'open'
  | 'close'
  | 'toggle'
  | 'navigate'
  | 'dismiss';

export interface GagaSurfaceInteractionEvent {
  surface: string;
  action: GagaSurfaceInteraction;
  source?: string;
}

export function createSurfaceEvent(
  surface: string,
  action: GagaSurfaceInteraction,
  source?: string,
): GagaSurfaceInteractionEvent {
  return { surface, action, source };
}
