export {};

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
  const [
    routeNormalize,
    layoutContext,
    theme,
    returnNavigation
  ] = await Promise.all([
    import('./systems/route-normalize'),
    import('./systems/layout-context'),
    import('./systems/theme'),
    import('./systems/return-navigation')
  ]);

  routeNormalize.initRouteNormalize();
  layoutContext.initLayoutContext();
  theme.initTheme();
  returnNavigation.initReturnNavigation();

  await Promise.all([
    hasCapability('[data-gaga-left-rail]')
      ? import('./systems/left-rail-state').then(({ initLeftRailState }) => initLeftRailState())
      : Promise.resolve(),
    hasCapability('[data-gaga-right-rail]')
      ? import('./systems/right-rail-state').then(({ initRightRailState }) => initRightRailState())
      : Promise.resolve()
  ]);

  await Promise.all([
    hasCapability('[data-gaga-right-rail]')
      ? import('./systems/context-surface').then(({ initContextSurface }) => initContextSurface())
      : Promise.resolve(),
    hasCapability('[data-gaga-outline-peek]')
      ? import('./systems/outline-peek').then(({ initOutlinePeek }) => initOutlinePeek())
      : Promise.resolve(),
    hasCapability('[data-gaga-nav-child-panel]')
      ? import('./systems/collapsed-nav').then(({ initCollapsedNav }) => initCollapsedNav())
      : Promise.resolve(),
    hasCapability('[data-gaga-toc-block] a[href^="#"]')
      ? import('./systems/toc-spy').then(({ initTocSpy }) => initTocSpy())
      : Promise.resolve()
  ]);

  const [
    inputMode,
    mobileDock,
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
    import('./systems/input-mode'),
    import('./systems/mobile-dock'),
    import('./systems/toast'),
    import('./systems/reader-preferences'),
    import('./systems/saved-reading'),
    hasCapability('[data-gaga-continuity-current], [data-gaga-saved-page]')
      ? import('./systems/reading-continuity')
      : Promise.resolve(null),
    import('./systems/quick-actions-state'),
    import('./systems/i18n'),
    import('./systems/surface-coordinator'),
    import('./systems/keyboard'),
    hasCapability('[data-gaga-action="toggle-focus-mode"]')
      ? import('./systems/focus-mode')
      : Promise.resolve(null),
    hasCapability('[data-gaga-entity-tabs]')
      ? import('./systems/entity-tabs')
      : Promise.resolve(null),
    hasCapability('[data-gaga-article-shell], .gaga-flagship-article, [data-gaga-reading-surface]')
      ? import('./systems/reader-enhancements')
      : Promise.resolve(null),
    import('./systems/reading-behaviour'),
    import('./systems/diagnostic-hud')
  ]);

  inputMode.initInputMode();
  mobileDock.initMobileDock();
  toast.initToast();
  readerPreferences.initReaderPreferences();
  savedReading.initSavedReading();
  readingContinuity?.initReadingContinuity();
  quickActionsState.initQuickActionsState();
  i18n.initI18n();
  focusMode?.initFocusMode();
  entityTabs?.initEntityTabs();
  readerEnhancements?.initReaderEnhancements();
  surfaceCoordinator.initSurfaceCoordinator();
  keyboard.initKeyboard();
  readingBehaviour.initReadingBehavior();
  diagnosticHud.initDiagnosticHud();
  document.documentElement.dataset.gagaRuntime = 'ready';

  onIdle(async () => {
    const [motion, sfx, informationSurface, pwa] = await Promise.all([
      import('./systems/motion'),
      import('./systems/sfx'),
      hasInformationSurfaceCapability()
        ? import('./systems/information-surface')
        : Promise.resolve(null),
      import('./systems/pwa')
    ]);

    motion.initMotion();
    sfx.initSfx();
    informationSurface?.initInformationSurface();
    pwa.initPwa();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void boot();
  }, { once: true });
} else {
  void boot();
}
