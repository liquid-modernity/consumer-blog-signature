import { gagaSignatureSurfaceContract } from '../../config/signature-surfaces';

export const gagaSignatureExtractionBoundary = {
  version: '0.0.41.0',
  stability: 'site-stabilization',
  engineCandidates: [
    'workspace-classification-contract',
    'shell-context-contract',
    'context-rail-projection-types',
    'signature-surface-ownership',
    'surface-priority-rules'
  ],
  siteOwned: [
    'publication-route-labels',
    'publication-taxonomy',
    'publication-icons',
    'publication-copy',
    'publication-specific-context-groups'
  ],
  extractionRule:
    'Extract contracts and pure projectors after the 0.0.41.x UI contract is stable; do not move publication-specific copy or route taxonomy into Gaga Engine.',
  surfaces: gagaSignatureSurfaceContract
} as const;
