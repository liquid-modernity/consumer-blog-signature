export {};

type IdleTask = () => Promise<void>;

const hasCapability = (selector: string) => document.querySelector(selector) !== null;

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
  const [routeNormalize, theme] = await Promise.all([
    import('./systems/route-normalize'),
    import('./systems/theme')
  ]);

  routeNormalize.initRouteNormalize();
  theme.initTheme();

  onIdle(async () => {
    const [motion, pwa] = await Promise.all([
      hasCapability('[data-gaga-motion]')
        ? import('./systems/motion')
        : Promise.resolve(null),
      import('./systems/pwa')
    ]);

    motion?.initMotion();
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
