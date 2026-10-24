import { createLayoutContextCapability } from '@gaga/engine-runtime/runtime/layout-context';
import { emitLayoutChanged } from '@gaga/engine-runtime/runtime/events';
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
