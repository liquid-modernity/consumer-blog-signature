import { createGagaRuntimeState, type GagaRuntimeState } from './runtime-context';

export interface GagaRuntimeOrchestrator {
  state: GagaRuntimeState;
  ready: boolean;
}

export function createGagaRuntimeOrchestrator(): GagaRuntimeOrchestrator {
  return {
    state: createGagaRuntimeState(),
    ready: true,
  };
}
