export const gagaProductExperienceRegistry = {
  desktop: {
    globalNavigation: 'icon-only',
    leftRail: 'collapsed',
    rightRail: 'collapsed'
  },
  mobile: {
    dock: true,
    outlinePeek: true,
    mediaMode: 'full-bleed'
  },
  reader: {
    focusMode: true,
    personalization: true,
    richMedia: true
  },
  quality: {
    accessibility: true,
    performance: true,
    responsive: true
  }
} as const;
