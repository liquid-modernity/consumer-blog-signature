import { i18nLabel, type I18nMessageKey } from './i18n';

export type NavItem = {
  id: string;
  label: string;
  labelEn?: string;
  labelKey?: I18nMessageKey;
  href: string;
  icon: string;
  external?: boolean;
};

export type NavGroup = {
  id: string;
  label: string;
  labelEn?: string;
  labelKey?: I18nMessageKey;
  icon: string;
  items: NavItem[];
};

function item(
  id: string,
  key: I18nMessageKey,
  href: string,
  icon: string,
  external = false
): NavItem {
  const label = i18nLabel(key);
  return {
    id,
    label: label.id,
    labelEn: label.en,
    labelKey: label.key,
    href,
    icon,
    ...(external ? { external: true } : {})
  };
}

function group(id: string, key: I18nMessageKey, icon: string, items: NavItem[]): NavGroup {
  const label = i18nLabel(key);
  return {
    id,
    label: label.id,
    labelEn: label.en,
    labelKey: label.key,
    icon,
    items
  };
}

export const primaryNav: NavItem[] = [
  item('latest', 'navigation.latest', '/', 'newsmode'),
  item('topics', 'navigation.topics', '/topics', 'grid_view'),
  item('sections', 'navigation.sections', '/sections', 'view_quilt'),
  item('archive', 'navigation.archive', '/archive', 'inventory_2'),
  item('library', 'navigation.saved', '/saved', 'bookmark')
];

export const navGroups: NavGroup[] = [
  {
    id: 'knowledge',
    label: 'Pengetahuan',
    labelEn: 'Knowledge',
    icon: 'account_tree',
    items: [
      { id: 'knowledge-graph', label: 'Graf', labelEn: 'Graph', href: '/knowledge/graph', icon: 'account_tree' },
      { id: 'knowledge-index', label: 'Indeks', labelEn: 'Index', href: '/knowledge/index', icon: 'view_quilt' },
      { id: 'knowledge-tags', label: 'Tag', labelEn: 'Tags', href: '/knowledge/tags', icon: 'sell' },
      { id: 'knowledge-references', label: 'Referensi', labelEn: 'References', href: '/knowledge/references', icon: 'article' }
    ]
  },
  group('pages', 'navigation.pages', 'folder_open', [
    item('about', 'navigation.about', '/about', 'article'),
    item('authors', 'navigation.authors', '/about/author', 'person'),
    item('support', 'navigation.support', '/about/support', 'help'),
    item('contact', 'navigation.contact', '/about/contact', 'mail')
  ]),
  group('legal', 'navigation.legal', 'policy', [
    item('privacy-policy', 'navigation.privacyPolicy', '/legal/privacy', 'shield'),
    item('terms-of-use', 'navigation.termsOfUse', '/legal/terms', 'contract'),
    item('disclaimer', 'navigation.disclaimer', '/legal/disclaimer', 'info'),
    { id: 'license', label: 'Lisensi', labelEn: 'License', href: '/legal/license', icon: 'contract' }
  ]),
  group('system', 'navigation.system', 'settings_applications', [
    item('sitemap', 'navigation.sitemap', '/system/sitemap', 'lan'),
    item('rss', 'navigation.rss', '/system/rss', 'rss_feed'),
    { id: 'status', label: 'Panduan sistem', labelEn: 'System guide', href: '/system/status', icon: 'terminal' }
  ]),
];
