import { createReturnNavigationCapability, type ReturnNavigationCapability } from '@gaga/engine-runtime/runtime/return-navigation';
import { storageKeys } from '../../config/systems';

let capability: ReturnNavigationCapability | undefined;

export function initReturnNavigation() {
  try {
    capability?.cleanup();
    capability = createReturnNavigationCapability({
      storageKey: storageKeys.returnContext,
      maxAgeMs: 2 * 60 * 60 * 1000
    });
  } catch (err) {
    console.warn('[GAGA] Return navigation capability unavailable in current context:', err);
  }
}
