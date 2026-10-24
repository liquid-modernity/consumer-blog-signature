import { createServiceWorkerCapability } from '@gaga/engine-runtime/runtime/service-worker';

export function initPwa() {
  void createServiceWorkerCapability({
    scriptUrl: '/sw.js',
    deferUntilLoad: true,
    unregisterExisting: import.meta.env.DEV
  }).init();
}
