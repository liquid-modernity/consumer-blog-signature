import { actionById, type GagaActionId } from './actions';
import { navGroups, primaryNav, type NavItem } from './nav';

export type SearchCommandSource =
  | 'ACTION_REGISTRY'
  | 'SSR_DESTINATION'
  | 'SEARCH'
  | 'CONTENT_METADATA'
  | 'READER'
  | 'SAVED'
  | 'SYSTEM_STATUS';

export type SearchCommandCategory =
  | 'Navigate'
  | 'Search'
  | 'Explore'
  | 'Read'
  | 'Save'
  | 'Cite'
  | 'System';

export type SearchCommandOperation =
  | 'copy-url'
  | 'copy-markdown-link'
  | 'copy-wikilink'
  | 'copy-quote'
  | 'copy-citation'
  | 'system-status';

export type SearchCommand = {
  id: string;
  label: string;
  description: string;
  category: SearchCommandCategory;
  source: SearchCommandSource;
  href?: string;
  actionId?: GagaActionId;
  actionCommand?: string;
  operation?: SearchCommandOperation;
  requiresArticle?: boolean;
  requiresSelection?: boolean;
};

const actionCommandSpecs: readonly {
  actionId: GagaActionId;
  category: SearchCommandCategory;
  source: SearchCommandSource;
}[] = [
  { actionId: 'search', category: 'Search', source: 'SEARCH' },
  { actionId: 'settings', category: 'Read', source: 'READER' },
  { actionId: 'focusmode', category: 'Read', source: 'READER' },
  { actionId: 'save', category: 'Save', source: 'SAVED' },
  { actionId: 'share', category: 'Cite', source: 'ACTION_REGISTRY' },
  { actionId: 'menu', category: 'Navigate', source: 'ACTION_REGISTRY' },
  { actionId: 'info-rail', category: 'Read', source: 'ACTION_REGISTRY' }
];

function actionCommand({ actionId, category, source }: typeof actionCommandSpecs[number]): SearchCommand {
  const action = actionById(actionId);
  return {
    id: `action-${action.id}`,
    label: action.label.id,
    description: action.description.id,
    category,
    source,
    href: action.href,
    actionId: action.id,
    actionCommand: action.command
  };
}

function destinationCommand(item: NavItem, category: SearchCommandCategory = 'Navigate'): SearchCommand {
  return {
    id: `destination-${item.id}`,
    label: item.label,
    description: item.external ? `Open external destination: ${item.label}` : `Open ${item.label}`,
    category,
    source: item.id === 'topics' ? 'CONTENT_METADATA' : 'SSR_DESTINATION',
    href: item.href
  };
}

const relationshipCommands: readonly SearchCommand[] = [
  {
    id: 'metadata-topics',
    label: 'Topic map',
    description: 'Open the canonical topics route',
    category: 'Explore',
    source: 'CONTENT_METADATA',
    href: '/topics'
  },
  {
    id: 'metadata-archive',
    label: 'Archive',
    description: 'Open the chronological archive',
    category: 'Explore',
    source: 'CONTENT_METADATA',
    href: '/archive'
  }
];

const citationCommands: readonly SearchCommand[] = [
  {
    id: 'copy-url',
    label: 'Copy URL',
    description: 'Copy the current canonical URL',
    category: 'Cite',
    source: 'ACTION_REGISTRY',
    operation: 'copy-url'
  },
  {
    id: 'copy-markdown-link',
    label: 'Copy Markdown link',
    description: 'Copy a Markdown link for the current page',
    category: 'Cite',
    source: 'CONTENT_METADATA',
    operation: 'copy-markdown-link'
  },
  {
    id: 'copy-wikilink',
    label: 'Copy wikilink',
    description: 'Copy a wikilink from the current content identity',
    category: 'Cite',
    source: 'CONTENT_METADATA',
    operation: 'copy-wikilink',
    requiresArticle: true
  },
  {
    id: 'copy-quote',
    label: 'Copy quote',
    description: 'Copy selected text as a quoted Markdown block',
    category: 'Cite',
    source: 'CONTENT_METADATA',
    operation: 'copy-quote',
    requiresArticle: true,
    requiresSelection: true
  },
  {
    id: 'copy-citation',
    label: 'Copy citation',
    description: 'Copy citation text only when title, author, and date are present',
    category: 'Cite',
    source: 'CONTENT_METADATA',
    operation: 'copy-citation',
    requiresArticle: true
  }
];

const systemCommands: readonly SearchCommand[] = [
  {
    id: 'system-status',
    label: 'System status',
    description: 'Report online, service-worker, and offline fallback facts',
    category: 'System',
    source: 'SYSTEM_STATUS',
    operation: 'system-status'
  }
];

export const searchCommandCategories: readonly SearchCommandCategory[] = [
  'Navigate',
  'Search',
  'Explore',
  'Read',
  'Save',
  'Cite',
  'System'
];

export const searchCommands: readonly SearchCommand[] = [
  ...actionCommandSpecs.map(actionCommand),
  ...primaryNav.map((item) => destinationCommand(item)),
  ...navGroups.flatMap((group) => group.items.map((item) => destinationCommand(item, group.id === 'system' ? 'System' : 'Navigate'))),
  ...relationshipCommands,
  ...citationCommands,
  ...systemCommands
];
