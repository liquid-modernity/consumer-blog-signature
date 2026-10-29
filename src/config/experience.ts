import { notchPresentation } from './contextual-ux.mjs';
import type { GagaActionId } from './actions';

export type ExperienceContext = 'article' | 'archive' | 'graph' | 'topic' | 'library' | 'default';
export type DockMode = 'hidden' | 'workspace';

export type ExperienceSurfaceProfile = {
  notchActionIds: readonly GagaActionId[];
  dockActionIds: readonly GagaActionId[];
  dockMode: DockMode;
};

export type ExperienceContextInput = {
  pathname: string;
  pageId?: string;
  contentKind?: string;
  contentClass?: string;
};

export const experienceConfig = {
  notch: notchPresentation,
  reading: { mode: 'immersive', density: 'comfortable', defaultContentWidth: 'reading' },
  navigation: { globalRail: 'vertical-icon-only', contextLeftRail: 'context-aware', contextRightRail: 'context-aware' },
  compact: { dock: 'contextual', articleDock: 'hidden', outlinePeek: 'semantic', fullBleedMedia: true },
  motion: { intensity: 'subtle', respectReducedMotion: true },
  sfx: { default: 'off', preset: 'subtle' },
  labels: { mouse: 'hover', keyboard: 'focus', touch: 'contextual' },
  surfaces: {
    article: {
      notchActionIds: ['smart-back', 'search', 'copy-link', 'share', 'save', 'focusmode', 'speak', 'context-info', 'settings'],
      dockActionIds: [],
      dockMode: 'hidden'
    },
    archive: {
      notchActionIds: ['smart-back', 'search', 'context-info', 'settings'],
      dockActionIds: ['search', 'library', 'settings', 'menu'],
      dockMode: 'workspace'
    },
    graph: {
      notchActionIds: ['smart-back', 'graph-reset', 'context-info', 'settings'],
      dockActionIds: ['search', 'library', 'settings', 'menu'],
      dockMode: 'workspace'
    },
    topic: {
      notchActionIds: ['smart-back', 'search', 'context-info', 'settings'],
      dockActionIds: ['search', 'library', 'settings', 'menu'],
      dockMode: 'workspace'
    },
    library: {
      notchActionIds: ['smart-back', 'search', 'context-info', 'settings'],
      dockActionIds: ['search', 'settings', 'menu'],
      dockMode: 'workspace'
    },
    default: {
      notchActionIds: ['smart-back', 'search', 'context-info', 'settings'],
      dockActionIds: ['search', 'library', 'settings', 'menu'],
      dockMode: 'workspace'
    }
  } satisfies Record<ExperienceContext, ExperienceSurfaceProfile>
} as const;

export function resolveExperienceContext({ pathname, pageId = '', contentKind = '', contentClass = '' }: ExperienceContextInput): ExperienceContext {
  if (contentKind === 'article' || contentClass === 'article-flagship' || pathname === '/article' || pathname.startsWith('/article/') || /^\/publications\/[^/]+$/.test(pathname.replace(/\/+$/, ''))) return 'article';
  if (pageId === 'archive' || pathname === '/archive' || pathname.startsWith('/archive/')) return 'archive';
  if (pageId === 'graph' || pathname === '/graphs' || pathname.startsWith('/graphs/')) return 'graph';
  if (contentKind === 'topic' || pageId.includes('topic') || pathname === '/topics' || pathname.startsWith('/topics/')) return 'topic';
  if (pageId === 'library' || pathname === '/saved' || pathname === '/library' || pathname.startsWith('/library/')) return 'library';
  return 'default';
}

export function experienceSurfaceProfile(context: ExperienceContext): ExperienceSurfaceProfile {
  return experienceConfig.surfaces[context];
}
