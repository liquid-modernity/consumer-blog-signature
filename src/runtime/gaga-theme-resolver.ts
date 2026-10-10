import { gagaThemeRegistry, type GagaThemeId } from '../config/gaga-theme-registry';

export function resolveGagaTheme(theme: GagaThemeId = 'editorial') {
  return gagaThemeRegistry[theme];
}
