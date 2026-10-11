export type GagaRuntimeLayer =
  | 'context'
  | 'action'
  | 'surface'
  | 'reader'
  | 'interaction'
  | 'accessibility';

export interface GagaRuntimeState {
  activeLayers: GagaRuntimeLayer[];
  initializedAt: number;
}

export function createGagaRuntimeState(): GagaRuntimeState {
  return {
    activeLayers: [
      'context',
      'action',
      'surface',
      'reader',
      'interaction',
      'accessibility',
    ],
    initializedAt: Date.now(),
  };
}
