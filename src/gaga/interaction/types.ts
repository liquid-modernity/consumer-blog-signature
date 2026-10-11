export type GagaInteractionIntent =
  | 'activate'
  | 'navigate'
  | 'expand'
  | 'collapse'
  | 'dismiss';

export interface GagaInteractionEvent {
  intent: GagaInteractionIntent;
  source?: string;
}
