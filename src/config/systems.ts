import type { LayoutMode, LeftRailState, RightRailState } from '../lib/schema';

export type RailPreference = 'expanded' | 'collapsed';
export const defaultRailPreference: RailPreference = 'expanded';

// SITE composition: responsive shell inventory and surface availability.
export const responsiveShellConfig = {
  breakpoints: {
    mobileMax: 767,
    tabletMiniMin: 768,
    tabletMiniMax: 1023,
    tabletLargeMin: 1024,
    tabletLargeMax: 1279,
    desktopMin: 1280
  },
  behavior: {
    informationPreviewRestoreDelayMs: 900
  },
  surfaces: {
    gagaDock: {
      enabledModes: ['mobile', 'tablet-mini']
    },
    outlinePeek: {
      enabledModes: ['mobile', 'tablet-mini', 'tablet-large', 'desktop'],
      requiresTableOfContents: true,
      attachTo: 'bottom-dock'
    },
    leftRail: {
      modeState: {
        mobile: 'hidden',
        'tablet-mini': 'hidden',
        'tablet-large': 'expanded',
        desktop: 'expanded'
      }
    },
    rightRail: {
      modeState: {
        mobile: 'detached',
        'tablet-mini': 'detached',
        'tablet-large': 'expanded',
        desktop: 'expanded'
      }
    }
  }
} as const;

export const breakpoints = responsiveShellConfig.breakpoints;

export function getLayoutMode(width: number): LayoutMode {
  if (width >= breakpoints.desktopMin) return 'desktop';
  if (width >= breakpoints.tabletLargeMin) return 'tablet-large';
  if (width >= breakpoints.tabletMiniMin) return 'tablet-mini';
  return 'mobile';
}

function isMode(mode: string | undefined): mode is LayoutMode {
  return mode === 'mobile' || mode === 'tablet-mini' || mode === 'tablet-large' || mode === 'desktop';
}

function modeEnabled(modes: readonly LayoutMode[], mode: string | undefined) {
  return isMode(mode) && modes.includes(mode);
}


export function getInformationPreviewRestoreDelayMs() {
  return responsiveShellConfig.behavior.informationPreviewRestoreDelayMs;
}

export function supportsGagaDock(mode: string | undefined) {
  return modeEnabled(responsiveShellConfig.surfaces.gagaDock.enabledModes, mode);
}

export function supportsOutlinePeek(mode: string | undefined) {
  return modeEnabled(responsiveShellConfig.surfaces.outlinePeek.enabledModes, mode);
}

export function outlinePeekRequiresTableOfContents() {
  return responsiveShellConfig.surfaces.outlinePeek.requiresTableOfContents;
}

export function getOutlinePeekAttachment() {
  return responsiveShellConfig.surfaces.outlinePeek.attachTo;
}

export function supportsRightRail(mode: string | undefined) {
  return isMode(mode) && responsiveShellConfig.surfaces.rightRail.modeState[mode] !== 'detached';
}

export function getConfiguredLeftRailState(mode: string | undefined): LeftRailState {
  return isMode(mode) ? responsiveShellConfig.surfaces.leftRail.modeState[mode] : 'hidden';
}

export function getConfiguredRightRailState(mode: string | undefined): RightRailState {
  return isMode(mode) ? responsiveShellConfig.surfaces.rightRail.modeState[mode] : 'detached';
}

export function isRailPreference(value: unknown): value is RailPreference {
  return value === 'expanded' || value === 'collapsed';
}

// GAGA runtime contract vocabulary, located here transitionally for Gate 4.
export const storageKeys = {
  theme: 'gaga:theme:v1',
  reader: 'gaga:reader:v1',
  sfx: 'gaga:sfx:v1',
  continuity: 'gaga:continuity:v1',
  saved: 'gaga:saved:v1',
  leftRail: 'gaga:left-rail:v2',
  rightRail: 'gaga:right-rail:v2',
  language: 'gaga:language:v1',
  returnContext: 'gaga:return-context:v1'
} as const;
