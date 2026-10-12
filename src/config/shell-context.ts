import type { GagaWorkspaceDefinition, GagaWorkspaceId } from './workspaces';

export type GagaContextIntent = 'discovery' | 'reading' | 'reference' | 'system';
export type GagaLeftContextRole = 'navigation' | 'reading-navigation' | 'system-navigation';
export type GagaRightContextRole = 'discovery' | 'reading' | 'reference' | 'system';
export type GagaMobileContextMode = 'navigation-and-context' | 'context-first' | 'navigation-only';
export type GagaRightContextPriority = 'discovery' | 'metadata' | 'system';

export interface GagaShellContextContract {
  intent: GagaContextIntent;
  left: GagaLeftContextRole;
  right: GagaRightContextRole;
  mobile: GagaMobileContextMode;
  rightPriority: GagaRightContextPriority;
}

const byWorkspace: Partial<Record<GagaWorkspaceId, GagaShellContextContract>> = {
  latest: {
    intent: 'discovery',
    left: 'navigation',
    right: 'discovery',
    mobile: 'navigation-and-context',
    rightPriority: 'discovery'
  },
  topics: {
    intent: 'discovery',
    left: 'navigation',
    right: 'discovery',
    mobile: 'navigation-and-context',
    rightPriority: 'discovery'
  },
  sections: {
    intent: 'discovery',
    left: 'navigation',
    right: 'discovery',
    mobile: 'navigation-and-context',
    rightPriority: 'discovery'
  },
  tags: {
    intent: 'discovery',
    left: 'navigation',
    right: 'discovery',
    mobile: 'navigation-and-context',
    rightPriority: 'discovery'
  },
  search: {
    intent: 'discovery',
    left: 'navigation',
    right: 'discovery',
    mobile: 'navigation-and-context',
    rightPriority: 'discovery'
  },
  series: {
    intent: 'discovery',
    left: 'navigation',
    right: 'discovery',
    mobile: 'navigation-and-context',
    rightPriority: 'discovery'
  },
  archive: {
    intent: 'discovery',
    left: 'navigation',
    right: 'reference',
    mobile: 'navigation-and-context',
    rightPriority: 'metadata'
  },
  library: {
    intent: 'reference',
    left: 'navigation',
    right: 'reference',
    mobile: 'navigation-and-context',
    rightPriority: 'metadata'
  },
  authors: {
    intent: 'reference',
    left: 'navigation',
    right: 'reference',
    mobile: 'navigation-and-context',
    rightPriority: 'metadata'
  },
  article: {
    intent: 'reading',
    left: 'reading-navigation',
    right: 'reading',
    mobile: 'context-first',
    rightPriority: 'metadata'
  },
  system: {
    intent: 'system',
    left: 'system-navigation',
    right: 'system',
    mobile: 'navigation-only',
    rightPriority: 'system'
  }
};

const fallback: GagaShellContextContract = {
  intent: 'reference',
  left: 'navigation',
  right: 'reference',
  mobile: 'navigation-and-context',
  rightPriority: 'metadata'
};

export function resolveGagaShellContext(
  workspace: GagaWorkspaceDefinition
): GagaShellContextContract {
  return byWorkspace[workspace.id] ?? fallback;
}
