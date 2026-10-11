export type GagaSurfaceVisualMode = 'attached' | 'floating' | 'embedded';

export interface GagaSurfaceVisualSpec {
  mode: GagaSurfaceVisualMode;
  radius: 'none' | 'top' | 'full';
  motionToken: string;
  elevationToken: string;
}
