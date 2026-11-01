import { actionById, type GagaActionId } from './actions';
import { navGroups, primaryNav, type NavItem } from './nav';

export type SearchCommandSource =
  | 'ACTION_REGISTRY'
  | 'CONTENT_METADATA'
  | 'SSR_DESTINATION'
  | 'SEARCH'
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

export type SearchCommand = {
  id: string;
  label: string;
  description: string;
  category: SearchCommandCategory;
  source: SearchCommandSource;
  href?: string;
  actionId?: GagaActionId;
  actionCommand?: string;
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
  ...navGroups.flatMap((group) => group.items.map((item) => destinationCommand(item, group.id === 'system' ? 'System' : 'Navigate')))
];
