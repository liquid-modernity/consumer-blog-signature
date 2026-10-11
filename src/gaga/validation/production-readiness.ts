export interface GagaProductionCheck {
  name: string;
  status: 'ready' | 'review';
  note?: string;
}

export const gagaProductionReadiness: GagaProductionCheck[] = [
  { name: 'runtime-boundary', status: 'ready', note: 'Single orchestration boundary available.' },
  { name: 'surface-contracts', status: 'ready', note: 'Surface capability contracts available.' },
  { name: 'accessibility-layer', status: 'ready', note: 'Interaction accessibility primitives available.' },
  { name: 'package-extraction', status: 'review', note: 'Extraction requires repository-level package split.' },
];
