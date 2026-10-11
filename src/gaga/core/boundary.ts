export type GagaBoundaryLayer =
  | 'core'
  | 'content'
  | 'media'
  | 'reader'
  | 'surface'
  | 'interaction'
  | 'share';

export type GagaConsumerLayer =
  | 'brand'
  | 'editorial'
  | 'experience';

export interface GagaKernelBoundary {
  engine: GagaBoundaryLayer;
  consumer?: GagaConsumerLayer;
}

export const gagaKernelBoundary: GagaKernelBoundary[] = [
  { engine: 'core' },
  { engine: 'content' },
  { engine: 'media' },
  { engine: 'reader' },
  { engine: 'surface' },
  { engine: 'interaction' },
  { engine: 'share' }
];
