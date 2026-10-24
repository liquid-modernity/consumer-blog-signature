export type { ReaderLanguage } from '../config/reader';
export type { LeftRailState } from '@gaga/engine-runtime/runtime/left-rail';
export type { RightRailState } from '@gaga/engine-runtime/runtime/right-rail';

// Concrete layout taxonomy remains consumer SITE policy.
export type LayoutMode = 'mobile' | 'tablet-mini' | 'tablet-large' | 'desktop';
export type RailState = import('@gaga/engine-runtime/runtime/left-rail').LeftRailState | import('@gaga/engine-runtime/runtime/right-rail').RightRailState;
export type InfoSurfaceMode = 'right-rail-expanded' | 'right-rail-collapsed' | 'outline-peek-sheet';
