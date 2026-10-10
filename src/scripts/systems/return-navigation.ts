import { createReturnNavigationCapability, type ReturnNavigationCapability } from '@gaga/engine-web/runtime/return-navigation';
import { storageKeys } from '../../config/systems';

let capability: ReturnNavigationCapability | undefined;

export function initReturnNavigation() {
  capability?.cleanup();
  capability = createReturnNavigationCapability({
    storageKey: storageKeys.returnContext,
    maxAgeMs: 2 * 60 * 60 * 1000
  });
}
