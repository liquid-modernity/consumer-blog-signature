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
  item('archive', 'navigation.archive', '/archive', 'inventory_2'),
  item('library', 'navigation.saved', '/library', 'bookmark')
];

export const navGroups: NavGroup[] = [
  group('pages', 'navigation.pages', 'folder_open', [
    item('about', 'navigation.about', '/about', 'article'),
    item('authors', 'navigation.authors', '/authors', 'person'),
    item('contact', 'navigation.contact', '/contact', 'mail'),
    item('support', 'navigation.support', '/support', 'help')
  ]),
  group('legal', 'navigation.legal', 'policy', [
    item('privacy-policy', 'navigation.privacyPolicy', '/privacy', 'shield'),
    item('terms-of-use', 'navigation.termsOfUse', '/terms', 'contract'),
    item('disclaimer', 'navigation.disclaimer', '/disclaimer', 'info')
  ]),
  group('system', 'navigation.system', 'settings_applications', [
    item('graphs', 'navigation.graphs', '/graphs', 'account_tree'),
    item('sitemap', 'navigation.sitemap', '/sitemap-index.xml', 'lan'),
    item('rss', 'navigation.rss', '/rss.xml', 'rss_feed')
  ]),
];

export function toStarlightSidebar() {
  return [
    ...primaryNav.map((navItem) => ({ label: navItem.label, link: navItem.href })),
    ...navGroups.map((navGroup) => ({
      label: navGroup.label,
      items: navGroup.items.map((navItem) => ({ label: navItem.label, link: navItem.href }))
    }))
  ];
}
