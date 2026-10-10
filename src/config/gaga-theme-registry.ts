export const gagaThemeRegistry = {
  editorial: {
    id: 'editorial',
    surface: 'reading-first'
  },
  blueprintism: {
    id: 'blueprintism',
    surface: 'system-grid'
  },
  brutalism: {
    id: 'brutalism',
    surface: 'experimental'
  },
  corporate: {
    id: 'corporate',
    surface: 'enterprise'
  }
} as const;

export type GagaThemeId = keyof typeof gagaThemeRegistry;
