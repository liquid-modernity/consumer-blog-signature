import { i18nLabel, type GagaLocalizedLabel } from './i18n';
import type { LayoutMode } from '../lib/schema';

export type GagaActionId =
  | 'menu'
  | 'save'
  | 'share'
  | 'settings'
  | 'focusmode'
  | 'search'
  | 'outline'
  | 'info-rail'
  | 'context-info'
  | 'close-top'
  | 'smart-back'
  | 'highlight'
  | 'speak'
  | 'library'
  | 'graph-reset';

export type GagaActionKind = 'link' | 'toggle' | 'command';

export type GagaActionTier =
  | 'GLOBAL_NAVIGATION'
  | 'READING_ACTION'
  | 'CONTEXTUAL_ACTION'
  | 'COMMAND_ONLY';

export type GagaActionCommand =
  | 'toggle-left-rail'
  | 'toggle-save'
  | 'share-page'
  | 'smart-back'
  | 'highlight'
  | 'speak'
  | 'toggle-reader-preferences'
  | 'toggle-focus-mode'
  | 'toggle-outline'
  | 'toggle-right-rail'
  | 'toggle-context-surface'
  | 'reset-knowledge-graph'
  | 'open-search'
  | 'close-top-surface';

export type GagaActionProjection =
  | 'gaga-dock'
  | 'article-utility'
  | 'context-trigger'
  | 'reading-utility'
  | 'left-rail-toggle'
  | 'right-rail-toggle'
  | 'search-trigger'
  | 'keyboard'
  | 'reader-panel-close'
  | 'saved-inline';

export type GagaActionActiveSource =
  | 'route'
  | 'focus-mode'
  | 'saved-current-page'
  | 'reader-panel'
  | 'left-rail-drawer';

export type GagaActionLabel = GagaLocalizedLabel;

export type GagaShortcutModifier = 'meta' | 'ctrl' | 'alt' | 'shift';

export type GagaActionShortcut = {
  id: string;
  key: string;
  display: string;
  modifiers?: readonly GagaShortcutModifier[];
  allowEditable?: boolean;
};

export type GagaActionAvailability = {
  layouts?: readonly LayoutMode[];
  capabilities?: readonly ('gaga-dock' | 'right-rail' | 'table-of-contents' | 'share' | 'clipboard')[];
};

export type GagaActionAria = {
  label?: GagaActionLabel;
  controls?: string;
  expanded?: boolean;
  pressed?: boolean;
};

export type GagaActionProjectionMeta = {
  label?: GagaActionLabel;
  shortLabel?: GagaActionLabel;
  description?: GagaActionLabel;
  tooltip?: GagaActionLabel;
  icon?: string;
  aria?: GagaActionAria;
};

export type GagaActionFeedback = {
  label?: string;
  pending?: string;
  success?: string;
  fallbackSuccess?: string;
  failure?: string;
  cancelled?: string;
  sfx?: 'hover' | 'focus' | 'tap' | 'click' | 'confirm' | 'open';
};

export type GagaAction = {
  id: GagaActionId;
  kind: GagaActionKind;
  tier: GagaActionTier;
  label: GagaActionLabel;
  shortLabel?: GagaActionLabel;
  description: GagaActionLabel;
  icon?: string;
  href?: string;
  command?: GagaActionCommand;
  projections: readonly GagaActionProjection[];
  availability?: GagaActionAvailability;
  activeSource?: GagaActionActiveSource;
  shortcuts?: readonly GagaActionShortcut[];
  tooltip?: GagaActionLabel;
  aria?: GagaActionAria;
  projectionMeta?: Partial<Record<GagaActionProjection, GagaActionProjectionMeta>>;
  feedback?: GagaActionFeedback;
};

export const gagaActions: readonly GagaAction[] = [
  {
    id: 'library',
    kind: 'link',
    tier: 'GLOBAL_NAVIGATION',
    label: i18nLabel('navigation.saved'),
    description: i18nLabel('navigation.saved'),
    icon: 'bookmark',
    href: '/library',
    projections: ['gaga-dock'],
    activeSource: 'route',
    tooltip: i18nLabel('navigation.saved'),
    feedback: { label: 'Library', sfx: 'click' }
  },
  {
    id: 'menu',
    kind: 'toggle',
    tier: 'GLOBAL_NAVIGATION',
    label: i18nLabel('navigation.menu'),
    description: i18nLabel('navigation.toggleRail'),
    icon: 'menu',
    command: 'toggle-left-rail',
    projections: ['gaga-dock', 'left-rail-toggle'],
    availability: { layouts: ['mobile', 'tablet-mini', 'tablet-large', 'desktop'] },
    activeSource: 'left-rail-drawer',
    tooltip: i18nLabel('navigation.toggleRail'),
    aria: { controls: 'gaga-left-rail' },
    projectionMeta: {
      'gaga-dock': { aria: { pressed: true } },
      'left-rail-toggle': {
        aria: {
          label: i18nLabel('navigation.toggleRail'),
          controls: 'gaga-left-rail',
          expanded: true
        }
      }
    },
    feedback: { label: 'Menu', success: 'Menu opened', sfx: 'open' }
  },
  {
    id: 'save',
    kind: 'toggle',
    tier: 'READING_ACTION',
    label: i18nLabel('navigation.saveCurrentPage'),
    shortLabel: i18nLabel('navigation.save'),
    description: i18nLabel('navigation.saveReading'),
    icon: 'bookmark_add',
    command: 'toggle-save',
    projections: ['saved-inline'],
    activeSource: 'saved-current-page',
    tooltip: i18nLabel('navigation.saveCurrentPage'),
    projectionMeta: {
      'saved-inline': {
        label: i18nLabel('navigation.save'),
        icon: 'bookmark',
        aria: { label: i18nLabel('navigation.saveReading') }
      }
    },
    feedback: { label: 'Save current page', success: 'Saved current page', cancelled: 'Removed from saved', sfx: 'confirm' }
  },
  {
    id: 'share',
    kind: 'command',
    tier: 'CONTEXTUAL_ACTION',
    label: i18nLabel('navigation.share'),
    description: i18nLabel('navigation.share'),
    icon: 'ios_share',
    command: 'share-page',
    projections: ['article-utility'],
    availability: { capabilities: ['share', 'clipboard'] },
    tooltip: i18nLabel('navigation.share'),
    projectionMeta: {
      'article-utility': {
        label: i18nLabel('navigation.share'),
        aria: { label: i18nLabel('navigation.share') }
      }
    },
    feedback: {
      label: 'Share',
      success: 'Share panel opened',
      fallbackSuccess: 'Link copied',
      failure: 'Could not share link',
      cancelled: 'Share cancelled',
      sfx: 'click'
    }
  },
  {
    id: 'context-info',
    kind: 'toggle',
    tier: 'CONTEXTUAL_ACTION',
    label: i18nLabel('article.information'),
    description: i18nLabel('article.information'),
    icon: 'info',
    command: 'toggle-context-surface',
    projections: ['article-utility', 'context-trigger'],
    availability: { layouts: ['mobile', 'tablet-mini'] },
    tooltip: i18nLabel('article.information'),
    aria: { controls: 'gaga-right-rail' },
    projectionMeta: {
      'article-utility': {
        aria: {
          label: i18nLabel('article.information'),
          controls: 'gaga-right-rail',
          expanded: true
        }
      },
      'context-trigger': {
        aria: {
          label: i18nLabel('article.information'),
          controls: 'gaga-right-rail',
          expanded: true
        }
      }
    },
    feedback: { label: 'Information', sfx: 'open' }
  },
  {
    id: 'settings',
    kind: 'toggle',
    tier: 'READING_ACTION',
    label: i18nLabel('navigation.reader'),
    description: i18nLabel('navigation.readerPreferences'),
    icon: 'settings',
    command: 'toggle-reader-preferences',
    projections: ['gaga-dock', 'reading-utility', 'reader-panel-close'],
    activeSource: 'reader-panel',
    tooltip: i18nLabel('navigation.reader'),
    projectionMeta: {
      'gaga-dock': { aria: { pressed: true } },
      'reading-utility': {
        label: i18nLabel('navigation.reader'),
        aria: { label: i18nLabel('navigation.reader'), pressed: true }
      },
      'reader-panel-close': {
        aria: { label: i18nLabel('navigation.closeReaderPreferences') }
      }
    },
    feedback: { label: 'Reader', pending: 'Reader preferences', cancelled: 'Reader closed', sfx: 'open' }
  },
  {
    id: 'focusmode',
    kind: 'toggle',
    tier: 'CONTEXTUAL_ACTION',
    label: i18nLabel('navigation.focusMode'),
    description: i18nLabel('navigation.focusMode'),
    icon: 'width_full',
    command: 'toggle-focus-mode',
    projections: ['reading-utility'],
    availability: { layouts: ['tablet-large', 'desktop'] },
    activeSource: 'focus-mode',
    tooltip: i18nLabel('navigation.focusMode'),
    projectionMeta: {
      'reading-utility': {
        label: i18nLabel('navigation.focusMode'),
        aria: { label: i18nLabel('navigation.focusMode'), pressed: true }
      }
    },
    feedback: { label: 'Focus mode', success: 'Focus mode on', cancelled: 'Focus mode off', sfx: 'confirm' }
  },
  {
    id: 'search',
    kind: 'link',
    tier: 'GLOBAL_NAVIGATION',
    label: i18nLabel('navigation.search'),
    description: i18nLabel('navigation.searchPublication'),
    icon: 'search',
    href: '/search',
    command: 'open-search',
    projections: ['gaga-dock', 'search-trigger', 'keyboard'],
    shortcuts: [
      { id: 'command-search', key: 'k', display: '⌘K', modifiers: ['meta'], allowEditable: true },
      { id: 'control-search', key: 'k', display: 'Ctrl K', modifiers: ['ctrl'], allowEditable: true }
    ],
    tooltip: i18nLabel('navigation.searchPublication'),
    projectionMeta: {
      'search-trigger': {
        aria: { label: i18nLabel('navigation.searchPublication') }
      }
    },
    feedback: { label: 'Search publication', sfx: 'click' }
  },
  {
    id: 'outline',
    kind: 'toggle',
    tier: 'CONTEXTUAL_ACTION',
    label: i18nLabel('outline.fallback'),
    description: i18nLabel('outline.fallback'),
    icon: 'outline',
    command: 'toggle-outline',
    projections: [],
    availability: { layouts: ['mobile', 'tablet-mini', 'tablet-large', 'desktop'], capabilities: ['table-of-contents'] },
    feedback: { label: 'Outline', sfx: 'open' }
  },
  {
    id: 'info-rail',
    kind: 'toggle',
    tier: 'CONTEXTUAL_ACTION',
    label: i18nLabel('navigation.informationRail'),
    description: i18nLabel('navigation.toggleInformationRail'),
    icon: 'menu',
    command: 'toggle-right-rail',
    projections: ['right-rail-toggle'],
    availability: { layouts: ['tablet-large', 'desktop'], capabilities: ['right-rail'] },
    tooltip: i18nLabel('navigation.toggleInformationRail'),
    aria: { controls: 'gaga-right-rail' },
    projectionMeta: {
      'right-rail-toggle': {
        aria: {
          label: i18nLabel('navigation.toggleInformationRail'),
          controls: 'gaga-right-rail',
          expanded: true
        }
      }
    },
    feedback: { label: 'Information rail', sfx: 'open' }
  },
  {
    id: 'graph-reset',
    kind: 'command',
    tier: 'CONTEXTUAL_ACTION',
    label: i18nLabel('navigation.graphs'),
    description: i18nLabel('navigation.graphs'),
    icon: 'sync',
    command: 'reset-knowledge-graph',
    projections: [],
    feedback: { label: 'Reset graph', success: 'Graph reset', sfx: 'confirm' }
  },
  {
    id: 'close-top',
    kind: 'command',
    tier: 'COMMAND_ONLY',
    label: i18nLabel('navigation.closeTopSurface'),
    description: i18nLabel('navigation.closeTopSurface'),
    command: 'close-top-surface',
    projections: ['keyboard'],
    shortcuts: [{ id: 'escape-close-top', key: 'escape', display: 'Esc', allowEditable: true }],
    feedback: { label: 'Close top surface', sfx: 'click' }
  },
  {
    id: 'smart-back',
    kind: 'command',
    tier: 'READING_ACTION',
    label: i18nLabel('article.back'),
    description: i18nLabel('article.smartBack'),
    icon: 'arrow_back',
    command: 'smart-back',
    projections: ['article-utility'],
    shortcuts: [
      { id: 'alt-left-back', key: 'arrowleft', display: 'Alt+←', modifiers: ['alt'], allowEditable: false }
    ],
    feedback: { label: 'Back', success: 'Returning to previous screen', sfx: 'click' }
  },
  {
    id: 'highlight',
    kind: 'command',
    tier: 'READING_ACTION',
    label: i18nLabel('article.highlight'),
    description: i18nLabel('article.highlight'),
    icon: 'edit',
    command: 'highlight',
    projections: ['reading-utility'],
    shortcuts: [
      { id: 'h-highlight', key: 'h', display: 'H', allowEditable: false }
    ],
    feedback: { label: 'Highlight', success: 'Highlight saved', failure: 'Select text first', sfx: 'confirm' }
  },
  {
    id: 'speak',
    kind: 'command',
    tier: 'READING_ACTION',
    label: i18nLabel('article.speak'),
    description: i18nLabel('article.speak'),
    icon: 'volume_up',
    command: 'speak',
    projections: ['reading-utility'],
    shortcuts: [
      { id: 's-speak', key: 's', display: 'S', allowEditable: false }
    ],
    feedback: { label: 'Speak', success: 'Speech started', cancelled: 'Speech stopped', sfx: 'click' }
  }
];

const actionMap = new Map<GagaActionId, GagaAction>(gagaActions.map((action) => [action.id, action]));
const commandMap = new Map<GagaActionCommand, GagaAction>(
  gagaActions.flatMap((action) => action.command ? [[action.command, action] as const] : [])
);

export function isGagaActionId(id: string): id is GagaActionId {
  return actionMap.has(id as GagaActionId);
}

export function actionById(id: GagaActionId) {
  const action = actionMap.get(id);
  if (!action) throw new Error(`Unknown Gaga action: ${id}`);
  return action;
}

export function actionForCommand(command: string | null | undefined) {
  return command ? commandMap.get(command as GagaActionCommand) : undefined;
}

export function actionsForTier(tier: GagaActionTier): GagaAction[] {
  return gagaActions.filter((action) => action.tier === tier);
}

export function projectionMeta(action: GagaAction, projection: GagaActionProjection): GagaActionProjectionMeta {
  return action.projectionMeta?.[projection] ?? {};
}

export function labelForProjection(action: GagaAction, projection: GagaActionProjection) {
  return projectionMeta(action, projection).label ?? action.label;
}

export function shortLabelForProjection(action: GagaAction, projection: GagaActionProjection) {
  return projectionMeta(action, projection).shortLabel ?? action.shortLabel ?? labelForProjection(action, projection);
}

export function descriptionForProjection(action: GagaAction, projection: GagaActionProjection) {
  return projectionMeta(action, projection).description ?? action.description;
}

export function tooltipForProjection(action: GagaAction, projection: GagaActionProjection) {
  return projectionMeta(action, projection).tooltip ?? action.tooltip ?? descriptionForProjection(action, projection);
}

export function iconForProjection(action: GagaAction, projection: GagaActionProjection) {
  return projectionMeta(action, projection).icon ?? action.icon;
}

export function ariaForProjection(action: GagaAction, projection: GagaActionProjection): GagaActionAria {
  return { ...(action.aria ?? {}), ...(projectionMeta(action, projection).aria ?? {}) };
}

export function keyboardActionBindings() {
  return gagaActions.flatMap((action) =>
    (action.shortcuts ?? []).map((shortcut) => ({ action, shortcut }))
  );
}

export function actionFeedbackLabel(action: GagaAction | undefined) {
  return action?.feedback?.label ?? action?.label.id ?? '';
}
