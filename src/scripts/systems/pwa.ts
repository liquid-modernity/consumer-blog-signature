import { createServiceWorkerCapability } from '@gaga/engine-web/runtime/service-worker';

export function initPwa() {
  void createServiceWorkerCapability({
    scriptUrl: '/sw.js',
    deferUntilLoad: true,
    unregisterExisting: import.meta.env.DEV
  }).init();
}
