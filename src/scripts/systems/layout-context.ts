import { createLayoutContextCapability } from '@gaga/engine-web/runtime/layout-context';
import { emitLayoutChanged } from '@gaga/engine-web/runtime/events';
import { getLayoutMode } from '../../config/systems';

let initialized = false;

export function initLayoutContext() {
  if (initialized) return;
  initialized = true;
  createLayoutContextCapability({
    resolveLayoutMode: getLayoutMode,
    emitLayoutChanged
  });
}
