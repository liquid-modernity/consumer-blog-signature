export const experienceConfig = {
  reading: { mode: 'immersive', density: 'comfortable', defaultContentWidth: 'reading' },
  navigation: { globalRail: 'vertical-icon-only', contextLeftRail: 'context-aware', contextRightRail: 'context-aware' },
  compact: { dock: true, outlinePeek: true, fullBleedMedia: true },
  motion: { intensity: 'subtle', respectReducedMotion: true },
  sfx: { default: 'off', preset: 'subtle' },
  labels: { mouse: 'hover', keyboard: 'focus', touch: 'contextual' }
} as const;
