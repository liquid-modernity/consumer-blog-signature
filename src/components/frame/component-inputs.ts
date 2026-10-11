import type { I18nMessageKey } from '../../config/i18n';
import type { BreadcrumbItem, PageContextCard, PageContextFact } from '../../lib/page-context';

export type GagaComponentLabel = {
  key?: I18nMessageKey;
  id: string;
  en: string;
};

export type QuickActionInput = {
  id: string;
  label: GagaComponentLabel;
  href?: string;
  command?: string;
  icon?: string;
  tooltip: GagaComponentLabel;
  ariaLabel: GagaComponentLabel;
  ariaControls?: string;
  ariaExpanded?: boolean;
  ariaPressed?: boolean;
};

export type RailToggleInput = {
  command?: string;
  label: GagaComponentLabel;
  controls?: string;
  tooltip: GagaComponentLabel;
  icon?: string;
};

export type SearchBoxInput = {
  href: string;
  label: GagaComponentLabel;
  ariaLabel: GagaComponentLabel;
  tooltip: GagaComponentLabel;
  icon?: string;
  shortcutDisplay?: string;
};

export type SavedButtonInput = {
  command?: string;
  label: GagaComponentLabel;
  ariaLabel: GagaComponentLabel;
  icon?: string;
};

export type InformationDateInput = {
  datetime: string;
  text: string;
};

export type ArticleWorkspaceActionsInput = {
  back: GagaComponentLabel;
  actionsLabel: GagaComponentLabel;
  readingUtilitiesLabel: GagaComponentLabel;
  readingStatusLabel: GagaComponentLabel;
  readingStatusUnset: GagaComponentLabel;
  readingStatusReadNext: GagaComponentLabel;
  readingStatusInProgress: GagaComponentLabel;
  readingStatusReference: GagaComponentLabel;
  readingStatusCompleted: GagaComponentLabel;
  breadcrumbLabel: GagaComponentLabel;
  blogLabel: GagaComponentLabel;
  continuityResumeTitle: GagaComponentLabel;
  continuityResumeAt: GagaComponentLabel;
  continuityDismiss: GagaComponentLabel;
  share: QuickActionInput;
  context: QuickActionInput;
  reader: QuickActionInput;
  focus: QuickActionInput;
};

export type NavItemInput = {
  id: string;
  label: string;
  labelEn?: string;
  labelKey?: I18nMessageKey;
  href: string;
  icon: string;
  external?: boolean;
};

export type NavGroupInput = {
  id: string;
  label: string;
  labelEn?: string;
  labelKey?: I18nMessageKey;
  icon: string;
  items: NavItemInput[];
};

export type LeftRailInput = {
  ariaLabel: GagaComponentLabel;
  primaryNavLabel: GagaComponentLabel;
  brand: {
    href: string;
    label: string;
  };
  primaryNav: NavItemInput[];
  navGroups: NavGroupInput[];
  currentPath: string;
  railToggle: RailToggleInput;
  search: SearchBoxInput;
};

export type MobileDockInput = {
  label: GagaComponentLabel;
  currentPath: string;
  items: QuickActionInput[];
  actionCapacity: number;
};

export type ReaderOptionInput = {
  value: string;
  label: string;
  labelKey?: I18nMessageKey;
  labelEn?: string;
  icon?: string;
  checked?: boolean;
};

export type ReaderOptionGroupInput = {
  legend: GagaComponentLabel;
  options: ReaderOptionInput[];
};

export type ReaderPresetOptionInput = ReaderOptionInput & {
  theme: string;
  density: string;
  font: string;
  sfx: string;
};

export type ReaderPresetGroupInput = {
  legend: GagaComponentLabel;
  custom: GagaComponentLabel;
  reset: GagaComponentLabel;
  resetPreset: string;
  resetTheme: string;
  resetDensity: string;
  resetFont: string;
  resetSfx: string;
  options: ReaderPresetOptionInput[];
};

export type ReaderPreferencesInput = {
  title: GagaComponentLabel;
  titleIcon: string;
  closeAction: {
    command?: string;
    label: GagaComponentLabel;
  };
  advanced: {
    summary: GagaComponentLabel;
  };
  presets: ReaderPresetGroupInput;
  language: ReaderOptionGroupInput;
  theme: ReaderOptionGroupInput;
  density: ReaderOptionGroupInput;
  font: ReaderOptionGroupInput;
  fontFamily?: ReaderOptionGroupInput;
  lineHeight?: ReaderOptionGroupInput;
  letterSpacing?: ReaderOptionGroupInput;
  measure?: ReaderOptionGroupInput;
  contrast?: ReaderOptionGroupInput;
  motion?: ReaderOptionGroupInput;
  links?: ReaderOptionGroupInput;
  sfx: ReaderOptionGroupInput;
};

export type AppShellInput = {
  mobileDock: MobileDockInput;
  readerPreferences: ReaderPreferencesInput;
  contextTrigger: QuickActionInput;
};

export type RightRailOutlineItemInput = {
  slug: string;
  text: string;
  children?: RightRailOutlineItemInput[];
};

export type RightRailMode = 'outline' | 'summary';

export type RightRailInput = {
  mode: RightRailMode;
  kind: string;
  outlineItems: RightRailOutlineItemInput[];
  snippet?: string;
  topics?: string[];
  tags?: string[];
  publishedDate?: InformationDateInput;
  updatedAtDisplay?: InformationDateInput;
  readTime?: string;
  author?: string;
  cta?: {
    label: string;
    href: string;
  };
  facts?: PageContextFact[];
  discovery?: PageContextCard[];
  breadcrumbs?: BreadcrumbItem[];
  railToggle: RailToggleInput;
  labels: {
    railLabel: GagaComponentLabel;
    closeInformation: GagaComponentLabel;
    explore: GagaComponentLabel;
    articleSnippet: GagaComponentLabel;
    articlePublished: GagaComponentLabel;
    articleUpdated: GagaComponentLabel;
    articleAuthor: GagaComponentLabel;
    articleReadTime: GagaComponentLabel;
    articleTopics: GagaComponentLabel;
    articleTags: GagaComponentLabel;
    outlineTitle: GagaComponentLabel;
    outlineFallback: string;
    outlineOpenPrefix: GagaComponentLabel;
    outlineClose: GagaComponentLabel;
  };
  footer: string[];
};
