export const capabilityRegistry = {
  shell: { globalNavigation: true, leftContextRail: true, rightContextRail: true, adaptiveLayout: true },
  reading: { focusMode: true, outlinePeek: true, readingContinuity: true, highlight: true, annotation: true, speak: true, immersiveMedia: true },
  navigation: { smartBack: true, breadcrumbs: true, contextualNavigation: true },
  sharing: { smartShare: true, copyLink: true, shareQuote: true },
  personalization: { preference: true, appearance: true, designLanguage: true, languageSwitching: true },
  interaction: { keyboard: true, mouse: true, touch: true, gesture: true, adaptiveLabels: true, motion: true, animation: true, sfx: true },
  intelligence: { search: true, semanticReady: true, aiReady: true, knowledgeGraph: true },
  accessibility: { keyboardNavigation: true, reducedMotion: true, contrastMode: true, screenReaderSupport: true },
  deployment: { staticGeneration: true, cloudflareReady: true, pwaReady: true }
} as const;
export type CapabilityRegistry = typeof capabilityRegistry;
