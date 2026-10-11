import {
  actionById,
  ariaForProjection,
  iconForProjection,
  labelForProjection,
  shortLabelForProjection,
  tooltipForProjection,
  type GagaAction,
  type GagaActionId,
  type GagaActionProjection,
  type GagaProjectedAction
} from '../../config/actions';
import { mobileDockItems } from '../../config/dock';
import { i18nLabel, i18nText } from '../../config/i18n';
import { navGroups, primaryNav } from '../../config/nav';
import {
  defaultReaderLanguage,
  defaultReaderPreset,
  readerPresetById,
  readerPreferences,
  readerPresets,
  type ReaderFontScale
} from '../../config/reader';
import { themeOptions } from '../../config/theme';
import { sanitizeOutlineItems, type ScreenInfo } from '../../lib/screen-info';
import { normalizeSitePath } from '../../lib/url-semantics';
import type {
  AppShellInput,
  ArticleWorkspaceActionsInput,
  LeftRailInput,
  MobileDockInput,
  QuickActionInput,
  RailToggleInput,
  ReaderPreferencesInput,
  RightRailInput,
  SavedButtonInput,
  SearchBoxInput
} from './component-inputs';

const readerFontLabels = {
  sm: 'A−',
  md: 'A',
  lg: 'A+'
} satisfies Record<ReaderFontScale, string>;

const readerDensityLabelKeys = {
  comfort: 'reader.densityComfort',
  compact: 'reader.densityCompact',
  wide: 'reader.densityWide'
} as const;

const readerSfxLabelKeys = {
  on: 'reader.sfxOn',
  off: 'reader.sfxOff'
} as const;

export function normalizeCurrentPath(pathname: string) {
  return normalizeSitePath(pathname);
}

function projectActionInput(action: GagaAction, projection: GagaActionProjection): QuickActionInput {
  const label = labelForProjection(action, projection);
  const aria = ariaForProjection(action, projection);
  return {
    id: action.id,
    label: shortLabelForProjection(action, projection),
    href: action.href,
    command: action.command,
    icon: iconForProjection(action, projection),
    tooltip: tooltipForProjection(action, projection),
    ariaLabel: aria.label ?? label,
    ariaControls: aria.controls,
    ariaExpanded: aria.expanded,
    ariaPressed: aria.pressed
  };
}

function projectQuickAction(action: GagaProjectedAction): QuickActionInput {
  return projectActionInput(action, action.projection);
}

function projectAction(actionId: GagaActionId, projection: GagaActionProjection): QuickActionInput {
  return projectActionInput(actionById(actionId), projection);
}

export function createRailToggleInput(side: 'left' | 'right'): RailToggleInput {
  const projection = side === 'left' ? 'left-rail-toggle' : 'right-rail-toggle';
  const action = actionById(side === 'left' ? 'menu' : 'info-rail');
  const aria = ariaForProjection(action, projection);
  return {
    command: action.command,
    label: aria.label ?? action.description,
    controls: aria.controls,
    tooltip: tooltipForProjection(action, projection),
    icon: iconForProjection(action, projection)
  };
}

export function createSearchBoxInput(): SearchBoxInput {
  const action = actionById('search');
  const projection = 'search-trigger';
  const aria = ariaForProjection(action, projection);
  return {
    href: action.href ?? '/search',
    label: action.label,
    ariaLabel: aria.label ?? action.description,
    tooltip: tooltipForProjection(action, projection),
    icon: iconForProjection(action, projection),
    shortcutDisplay: action.shortcuts?.find((item) => item.id === 'command-search')?.display
  };
}

export function createSavedButtonInput(): SavedButtonInput {
  const action = actionById('save');
  const projection = 'saved-inline';
  const aria = ariaForProjection(action, projection);
  return {
    command: action.command,
    label: shortLabelForProjection(action, projection),
    ariaLabel: aria.label ?? action.description,
    icon: iconForProjection(action, projection)
  };
}

export function createArticleWorkspaceActionsInput(): ArticleWorkspaceActionsInput {
  return {
    back: i18nLabel('article.back'),
    actionsLabel: i18nLabel('article.actions'),
    readingUtilitiesLabel: i18nLabel('reading.utilities'),
    readingStatusLabel: i18nLabel('reading.status'),
    readingStatusUnset: i18nLabel('reading.statusUnset'),
    readingStatusReadNext: i18nLabel('reading.statusReadNext'),
    readingStatusInProgress: i18nLabel('reading.statusInProgress'),
    readingStatusReference: i18nLabel('reading.statusReference'),
    readingStatusCompleted: i18nLabel('reading.statusCompleted'),
    breadcrumbLabel: i18nLabel('article.breadcrumb'),
    blogLabel: i18nLabel('article.blog'),
    continuityResumeTitle: i18nLabel('continuity.resumeTitle'),
    continuityResumeAt: i18nLabel('continuity.resumeAt'),
    continuityDismiss: i18nLabel('continuity.dismiss'),
    share: projectAction('share', 'article-utility'),
    context: projectAction('context-info', 'article-utility'),
    reader: projectAction('settings', 'reading-utility'),
    focus: projectAction('focusmode', 'reading-utility')
  };
}

export function createLeftRailInput(currentPath: string): LeftRailInput {
  return {
    ariaLabel: i18nLabel('navigation.publication'),
    primaryNavLabel: i18nLabel('navigation.primary'),
    brand: {
      href: '/landing',
      label: 'Signature'
    },
    primaryNav,
    navGroups,
    currentPath,
    railToggle: createRailToggleInput('left'),
    search: createSearchBoxInput()
  };
}

export function createMobileDockInput(currentPath: string): MobileDockInput {
  const items = mobileDockItems.map(projectQuickAction);
  return {
    label: i18nLabel('navigation.mobileDock'),
    currentPath,
    items,
    actionCapacity: items.length
  };
}

export function createReaderPreferencesInput(): ReaderPreferencesInput {
  const closeReaderAction = actionById('settings');
  const closeReaderAria = ariaForProjection(closeReaderAction, 'reader-panel-close');
  const resetPreset = readerPresetById(defaultReaderPreset);
  return {
    title: i18nLabel('reader.title'),
    titleIcon: 'settings',
    closeAction: {
      command: closeReaderAction.command,
      label: closeReaderAria.label ?? closeReaderAction.description
    },
    advanced: {
      summary: i18nLabel('reader.advanced')
    },
    presets: {
      legend: i18nLabel('reader.presetLegend'),
      custom: i18nLabel('reader.presetCustom'),
      reset: i18nLabel('reader.presetReset'),
      resetPreset: resetPreset.id,
      resetTheme: resetPreset.theme,
      resetDensity: resetPreset.density,
      resetFont: resetPreset.font,
      resetSfx: resetPreset.sfx,
      options: readerPresets.map((preset) => {
        const label = i18nLabel(preset.labelKey);
        return {
          value: preset.id,
          label: label.id,
          labelEn: label.en,
          labelKey: label.key,
          checked: preset.id === defaultReaderPreset,
          theme: preset.theme,
          density: preset.density,
          font: preset.font,
          sfx: preset.sfx
        };
      })
    },
    language: {
      legend: i18nLabel('reader.language'),
      options: readerPreferences.language.map((value) => ({
        value,
        label: value.toUpperCase(),
        checked: value === defaultReaderLanguage
      }))
    },
    theme: {
      legend: i18nLabel('reader.theme'),
      options: themeOptions.map((theme) => {
        const label = i18nLabel(theme.labelKey);
        return { value: theme.id, label: label.id, labelEn: label.en, labelKey: label.key };
      })
    },
    density: {
      legend: i18nLabel('reader.density'),
      options: readerPreferences.density.map((value) => {
        const label = i18nLabel(readerDensityLabelKeys[value]);
        return { value, label: label.id, labelEn: label.en, labelKey: label.key };
      })
    },
    font: {
      legend: i18nLabel('reader.font'),
      options: readerPreferences.fontScale.map((value) => ({
        value,
        label: value === 'xl' ? 'A++' : readerFontLabels[value as keyof typeof readerFontLabels] ?? value
      }))
    },
    fontFamily: {
      legend: { id: 'Rupa Huruf', en: 'Typeface', key: 'reader.fontFamily' as any },
      options: [
        { value: 'sans', label: 'Modern Sans', labelEn: 'Modern Sans' },
        { value: 'serif', label: 'Editorial Serif', labelEn: 'Editorial Serif' },
        { value: 'mono', label: 'Blueprint Mono', labelEn: 'Blueprint Mono' }
      ]
    },
    lineHeight: {
      legend: { id: 'Jarak Baris', en: 'Line Height', key: 'reader.lineHeight' as any },
      options: [
        { value: 'normal', label: 'Padat', labelEn: 'Normal' },
        { value: 'relaxed', label: 'Renggang', labelEn: 'Relaxed' },
        { value: 'loose', label: 'Leluasa', labelEn: 'Loose' }
      ]
    },
    letterSpacing: {
      legend: { id: 'Spasi Karakter', en: 'Tracking', key: 'reader.letterSpacing' as any },
      options: [
        { value: 'normal', label: 'Normal', labelEn: 'Normal' },
        { value: 'wide', label: 'Lebar', labelEn: 'Wide' }
      ]
    },
    measure: {
      legend: { id: 'Lebar Baca', en: 'Reading Width', key: 'reader.measure' as any },
      options: [
        { value: 'standard', label: 'Fokus (38rem)', labelEn: 'Focus (38rem)' },
        { value: 'comfortable', label: 'Standar (44rem)', labelEn: 'Standard (44rem)' },
        { value: 'wide', label: 'Lega (50rem)', labelEn: 'Wide (50rem)' }
      ]
    },
    contrast: {
      legend: { id: 'Kontras Warna', en: 'Contrast Mode', key: 'reader.contrast' as any },
      options: [
        { value: 'normal', label: 'Alami', labelEn: 'Natural' },
        { value: 'high', label: 'Kontras Tinggi', labelEn: 'High Contrast' }
      ]
    },
    motion: {
      legend: { id: 'Animasi & Gerak', en: 'Motion', key: 'reader.motion' as any },
      options: [
        { value: 'system', label: 'Sistem', labelEn: 'System' },
        { value: 'reduced', label: 'Reduksi Gerak', labelEn: 'Reduced' }
      ]
    },
    links: {
      legend: { id: 'Garis Bawah Tautan', en: 'Link Decor', key: 'reader.links' as any },
      options: [
        { value: 'underlined', label: 'Garis Bawah', labelEn: 'Underlined' },
        { value: 'plain', label: 'Polos', labelEn: 'Plain' }
      ]
    },
    sfx: {
      legend: i18nLabel('reader.sfx'),
      options: readerPreferences.sfx.map((value) => {
        const label = i18nLabel(readerSfxLabelKeys[value]);
        return { value, label: label.id, labelEn: label.en, labelKey: label.key, icon: value === 'on' ? 'volume' : undefined };
      })
    }
  };
}

export function createAppShellInput(currentPath: string): AppShellInput {
  return {
    mobileDock: createMobileDockInput(currentPath),
    readerPreferences: createReaderPreferencesInput(),
    contextTrigger: projectAction('context-info', 'context-trigger')
  };
}

export function createRightRailInput(info: ScreenInfo): RightRailInput {
  const outlineItems = sanitizeOutlineItems(info.outlineItems);
  return {
    ...info,
    mode: outlineItems.length > 0 ? 'outline' : 'summary',
    outlineItems,
    railToggle: createRailToggleInput('right'),
    labels: {
      railLabel: i18nLabel('article.information'),
      closeInformation: i18nLabel('article.closeInformation'),
      explore: i18nLabel('context.explore'),
      articleSnippet: i18nLabel('article.snippet'),
      articlePublished: i18nLabel('article.published'),
      articleUpdated: i18nLabel('article.updated'),
      articleAuthor: i18nLabel('article.author'),
      articleReadTime: i18nLabel('article.readTime'),
      articleTopics: i18nLabel('article.topics'),
      articleTags: i18nLabel('article.tags'),
      outlineTitle: i18nLabel('outline.title'),
      outlineFallback: i18nText('outline.fallback', 'id'),
      outlineOpenPrefix: i18nLabel('outline.openPrefix'),
      outlineClose: i18nLabel('outline.close')
    },
    footer: ['Consumer Blog Signature.', 'Configurable by design.']
  };
}
