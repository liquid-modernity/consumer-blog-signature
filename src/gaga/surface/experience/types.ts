/**
 * GAGA Experience Surface Contract
 * Final experience layer: intent without coupling to UI implementation.
 */

export type GagaDeviceClass =
  | 'mobile'
  | 'tablet-mini'
  | 'tablet-large'
  | 'desktop';

export interface GagaExperienceSurface {
  surface: 'notch' | 'dock' | 'outline-peek' | 'rail';
  device: GagaDeviceClass;
  behavior: {
    collapsible: boolean;
    attached: boolean;
    immersive: boolean;
  };
}
