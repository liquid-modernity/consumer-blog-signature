import { initRouteNormalize } from './systems/route-normalize';
import { initLayoutContext } from './systems/layout-context';
import { initTheme } from './systems/theme';
import { initReturnNavigation } from './systems/return-navigation';

type IdleTask = () => Promise<void>;

/*
 * Gate 4 bootstrap contract:
 * one-document DOMContentLoaded lifecycle, capability-gated dynamic imports,
 * and data-gaga-runtime="ready" after the current ordered boot completes.
 */
const hasCapability = (selector: string) => document.querySelector(selector) !== null;
const hasInformationSurfaceCapability = () =>
  hasCapability('[data-gaga-right-rail]') &&
  (hasCapability('[data-gaga-preview]') || hasCapability('[data-gaga-toc-block] a'));

function onIdle(task: IdleTask, timeout = 1400) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      void task();
    }, { timeout });
    return;
  }
  globalThis.setTimeout(() => {
    void task();
  }, 180);
}

async function boot() {
  try {
    initRouteNormalize();
    initLayoutContext();
    initTheme();
    initReturnNavigation();
  } catch (err) {
    console.warn('[GAGA] Core systems boot warning:', err);
  }

  await Promise.all([
    hasCapability('[data-gaga-left-rail]')
      ? import('./systems/left-rail-state').then(({ initLeftRailState }) => initLeftRailState()).catch(err => console.warn('[GAGA] Left rail state init failed:', err))
      : Promise.resolve(),
    hasCapability('[data-gaga-right-rail]')
      ? import('./systems/right-rail-state').then(({ initRightRailState }) => initRightRailState()).catch(err => console.warn('[GAGA] Right rail state init failed:', err))
      : Promise.resolve()
  ]);

  await Promise.all([
    hasCapability('[data-gaga-right-rail]')
      ? import('./systems/context-surface').then(({ initContextSurface }) => initContextSurface()).catch(err => console.warn('[GAGA] Context surface init failed:', err))
      : Promise.resolve(),
    hasCapability('[data-gaga-outline-peek]')
      ? import('./systems/outline-peek').then(({ initOutlinePeek }) => initOutlinePeek()).catch(err => console.warn('[GAGA] Outline peek init failed:', err))
      : Promise.resolve(),
    hasCapability('[data-gaga-nav-child-panel]')
      ? import('./systems/collapsed-nav').then(({ initCollapsedNav }) => initCollapsedNav()).catch(err => console.warn('[GAGA] Collapsed nav init failed:', err))
      : Promise.resolve(),
    hasCapability('[data-gaga-toc-block] a[href^="#"]')
      ? import('./systems/toc-spy').then(({ initTocSpy }) => initTocSpy()).catch(err => console.warn('[GAGA] Toc spy init failed:', err))
      : Promise.resolve()
  ]);

  const [
    inputMode,
    gagaDock,
    toast,
    readerPreferences,
    savedReading,
    readingContinuity,
    quickActionsState,
    i18n,
    surfaceCoordinator,
    keyboard,
    focusMode,
    entityTabs,
    readerEnhancements,
    readingBehaviour,
    diagnosticHud
  ] = await Promise.all([
    import('./systems/input-mode').catch(() => null),
    import('./systems/gaga-dock').catch(() => null),
    import('./systems/toast').catch(() => null),
    import('./systems/reader-preferences').catch(() => null),
    import('./systems/saved-reading').catch(() => null),
    hasCapability('[data-gaga-continuity-current], [data-gaga-saved-page]')
      ? import('./systems/reading-continuity').catch(() => null)
      : Promise.resolve(null),
    import('./systems/quick-actions-state').catch(() => null),
    import('./systems/i18n').catch(() => null),
    import('./systems/surface-coordinator').catch(() => null),
    import('./systems/keyboard').catch(() => null),
    hasCapability('[data-gaga-action="toggle-focus-mode"]')
      ? import('./systems/focus-mode').catch(() => null)
      : Promise.resolve(null),
    hasCapability('[data-gaga-entity-tabs]')
      ? import('./systems/entity-tabs').catch(() => null)
      : Promise.resolve(null),
    hasCapability('[data-gaga-article-shell], .gaga-flagship-article, [data-gaga-reading-surface]')
      ? import('./systems/reader-enhancements').catch(() => null)
      : Promise.resolve(null),
    import('./systems/reading-behaviour').catch(() => null),
    import('./systems/diagnostic-hud').catch(() => null)
  ]);

  inputMode?.initInputMode();
  gagaDock?.initGagaDock();
  toast?.initToast();
  readerPreferences?.initReaderPreferences();
  savedReading?.initSavedReading();
  readingContinuity?.initReadingContinuity();
  quickActionsState?.initQuickActionsState();
  i18n?.initI18n();
  focusMode?.initFocusMode();
  entityTabs?.initEntityTabs();
  readerEnhancements?.initReaderEnhancements();
  surfaceCoordinator?.initSurfaceCoordinator();
  keyboard?.initKeyboard();
  readingBehaviour?.initReadingBehavior();
  diagnosticHud?.initDiagnosticHud();
  document.documentElement.dataset.gagaRuntime = 'ready';

  onIdle(async () => {
    const [motion, sfx, informationSurface, pwa] = await Promise.all([
      import('./systems/motion').catch(() => null),
      import('./systems/sfx').catch(() => null),
      hasInformationSurfaceCapability()
        ? import('./systems/information-surface').catch(() => null)
        : Promise.resolve(null),
      import('./systems/pwa').catch(() => null)
    ]);

    motion?.initMotion();
    sfx?.initSfx();
    informationSurface?.initInformationSurface();
    pwa?.initPwa();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void boot();
  }, { once: true });
} else {
  void boot();
}
