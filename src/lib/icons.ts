type IconDefinition = {
  viewBox: string;
  body: string;
};

const aliases: Record<string, string> = {
  home: 'home',
  blog: 'newsmode',
  latest: 'newsmode',
  newsmode: 'newsmode',
  search: 'search',
  terminal: 'terminal',
  topics: 'grid_view',
  grid_view: 'grid_view',
  archive: 'inventory_2',
  inventory_2: 'inventory_2',
  bookmark: 'bookmark',
  bookmarks: 'bookmark',
  saved: 'bookmark',
  add_bookmark: 'bookmark_add',
  bookmark_add: 'bookmark_add',
  folder: 'folder_open',
  pages: 'folder_open',
  folder_open: 'folder_open',
  page: 'article',
  article: 'article',
  description: 'description',
  author: 'person',
  person: 'person',
  mail: 'mail',
  support: 'help',
  help: 'help',
  experiment: 'science',
  lab: 'science',
  science: 'science',
  projects: 'dashboard',
  dashboard: 'dashboard',
  store: 'storefront',
  storefront: 'storefront',
  forum: 'forum',
  legal: 'policy',
  policy: 'policy',
  shield: 'shield',
  terms: 'contract',
  contract: 'contract',
  warning: 'warning',
  disclaimer: 'info',
  info: 'info',
  system: 'settings_applications',
  settings_applications: 'settings_applications',
  graphs: 'account_tree',
  graph: 'account_tree',
  account_tree: 'account_tree',
  sitemap: 'lan',
  lan: 'lan',
  rss: 'rss_feed',
  rss_feed: 'rss_feed',
  network_node: 'network_node',
  social: 'ios_share',
  share: 'ios_share',
  ios_share: 'ios_share',
  youtube: 'smart_display',
  smart_display: 'smart_display',
  linkedin: 'work',
  work: 'work',
  chat: 'forum',
  back: 'arrow_back',
  arrow_back: 'arrow_back',
  menu: 'menu',
  close: 'close',
  outline: 'format_list_bulleted',
  toc: 'toc',
  settings: 'settings',
  setting: 'settings',
  calendar: 'calendar_month',
  calendar_month: 'calendar_month',
  timer: 'schedule',
  clock: 'schedule',
  schedule: 'schedule',
  tag: 'sell',
  sell: 'sell',
  edit: 'edit',
  chevron: 'chevron_right',
  chevron_right: 'chevron_right',
  text: 'text_fields',
  text_fields: 'text_fields',
  text_snippet: 'text_snippet',
  volume: 'volume_up',
  volume_up: 'volume_up',
  focusmode: 'width_full',
  fullwidth: 'width_full',
  width_full: 'width_full',
  update: 'sync',
  sync: 'sync'
};

const icons: Record<string, IconDefinition> = {
  home: {
    viewBox: '0 0 24 24',
    body: '<path d="M4 10.5 12 4l8 6.5"/><path d="M6.5 9.5V20h4.75v-5h1.5v5h4.75V9.5"/>'
  },
  newsmode: {
    viewBox: '0 0 24 24',
    body: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h4.5"/><path d="M8 12h8"/><path d="M8 15h8"/><path d="M15 9h1.5"/><path d="M17.5 9h.5"/>'
  },
  search: {
    viewBox: '0 0 24 24',
    body: '<circle cx="11" cy="11" r="5.5"/><path d="m15.25 15.25 4.25 4.25"/>'
  },
  terminal: {
    viewBox: '0 0 24 24',
    body: '<path d="M4 5h16v14H4z" /><path d="m7 9 3 3-3 3" /><path d="M12 15h5" />'
  },
  grid_view: {
    viewBox: '0 0 24 24',
    body: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.25"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.25"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.25"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.25"/>'
  },
  inventory_2: {
    viewBox: '0 0 24 24',
    body: '<path d="M4 8h16l-1.25 10.25A2 2 0 0 1 16.76 20H7.24a2 2 0 0 1-1.99-1.75z"/><path d="M8 8V5.75A1.75 1.75 0 0 1 9.75 4h4.5A1.75 1.75 0 0 1 16 5.75V8"/><path d="M9 12h6"/>'
  },
  bookmark: {
    viewBox: '0 0 24 24',
    body: '<path d="M7 4.75h10a1 1 0 0 1 1 1V20l-6-3.5L6 20V5.75a1 1 0 0 1 1-1Z"/>'
  },
  bookmark_add: {
    viewBox: '0 0 24 24',
    body: '<path d="M7 4.75h10a1 1 0 0 1 1 1V20l-6-3.5L6 20V5.75a1 1 0 0 1 1-1Z"/><path d="M12 7.75v5"/><path d="M9.5 10.25h5"/>'
  },
  folder_open: {
    viewBox: '0 0 24 24',
    body: '<path d="M3.5 9.5h17l-1.25 8.25A2 2 0 0 1 17.27 19.5H6.73a2 2 0 0 1-1.98-1.75z"/><path d="M3.5 9.5V7a2 2 0 0 1 2-2h4l1.75 2H18.5a2 2 0 0 1 2 2v.5"/>'
  },
  article: {
    viewBox: '0 0 24 24',
    body: '<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8 9h8"/><path d="M8 12h8"/><path d="M8 15h5"/>'
  },
  description: {
    viewBox: '0 0 24 24',
    body: '<path d="M7 4.5h8l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 19V6a1.5 1.5 0 0 1 1-1.42"/><path d="M15 4.5V9h4"/><path d="M9 12h6"/><path d="M9 15h6"/>'
  },
  person: {
    viewBox: '0 0 24 24',
    body: '<circle cx="12" cy="8.25" r="3.25"/><path d="M5.5 19a6.5 6.5 0 0 1 13 0"/>'
  },
  mail: {
    viewBox: '0 0 24 24',
    body: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="m5.5 7.5 6.5 5 6.5-5"/>'
  },
  help: {
    viewBox: '0 0 24 24',
    body: '<circle cx="12" cy="12" r="8"/><path d="M9.75 9.25a2.75 2.75 0 1 1 4.57 2.08c-.92.79-1.82 1.4-1.82 2.67"/><path d="M12 17h.01"/>'
  },
  science: {
    viewBox: '0 0 24 24',
    body: '<path d="M10 4.5h4"/><path d="M11 4.5v4l-4.75 8.25A2 2 0 0 0 8 19.75h8a2 2 0 0 0 1.75-3L13 8.5v-4"/><path d="M8.75 14.5h6.5"/><path d="M9.75 12.25h4.5"/>'
  },
  dashboard: {
    viewBox: '0 0 24 24',
    body: '<rect x="4" y="4" width="7" height="7" rx="1.25"/><rect x="13" y="4" width="7" height="4.5" rx="1.25"/><rect x="13" y="10.5" width="7" height="9.5" rx="1.25"/><rect x="4" y="13" width="7" height="7" rx="1.25"/>'
  },
  storefront: {
    viewBox: '0 0 24 24',
    body: '<path d="M5 8h14l-1 4.5a2 2 0 0 1-2 1.5H8a2 2 0 0 1-2-1.5z"/><path d="M6.5 8 8 4.75h8L17.5 8"/><path d="M7 14v4.5h10V14"/><path d="M10 18.5V15h4v3.5"/>'
  },
  forum: {
    viewBox: '0 0 24 24',
    body: '<path d="M6 6.5h12A2.5 2.5 0 0 1 20.5 9v5A2.5 2.5 0 0 1 18 16.5H11l-4 3v-3H6A2.5 2.5 0 0 1 3.5 14V9A2.5 2.5 0 0 1 6 6.5Z"/><path d="M8.5 11.5h7"/>'
  },
  policy: {
    viewBox: '0 0 24 24',
    body: '<path d="M7 4.5h8l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 19V6A1.5 1.5 0 0 1 7 4.5Z"/><path d="M15 4.5V9h4"/><path d="m9 14 2 2 4-4"/>'
  },
  shield: {
    viewBox: '0 0 24 24',
    body: '<path d="M12 4 18 6.5V11c0 4.06-2.53 7.19-6 9-3.47-1.81-6-4.94-6-9V6.5z"/><path d="m9.75 12 1.5 1.5 3-3"/>'
  },
  contract: {
    viewBox: '0 0 24 24',
    body: '<rect x="5" y="4.5" width="14" height="15" rx="2"/><path d="M8 9h8"/><path d="M8 12h5"/><path d="M8 15c1.5-1 3.5-1 5 0"/>'
  },
  warning: {
    viewBox: '0 0 24 24',
    body: '<path d="M12 4.5 20 19.5H4z"/><path d="M12 9v4.5"/><path d="M12 16.75h.01"/>'
  },
  info: {
    viewBox: '0 0 24 24',
    body: '<circle cx="12" cy="12" r="8"/><path d="M12 10v5"/><path d="M12 7.5h.01"/>'
  },
  settings_applications: {
    viewBox: '0 0 24 24',
    body: '<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M8 19.5h8"/><path d="M10 16v3.5"/><path d="M14 16v3.5"/><path d="M8 9.5h8"/><path d="M8 12.5h5"/>'
  },
  account_tree: {
    viewBox: '0 0 24 24',
    body: '<rect x="4" y="4" width="5" height="4" rx="1"/><rect x="15" y="4" width="5" height="4" rx="1"/><rect x="15" y="16" width="5" height="4" rx="1"/><path d="M9 6h3a2 2 0 0 1 2 2v3"/><path d="M14 11H9"/><path d="M9 11v7h6"/>'
  },
  lan: {
    viewBox: '0 0 24 24',
    body: '<circle cx="6" cy="7" r="2"/><circle cx="18" cy="7" r="2"/><circle cx="12" cy="17" r="2"/><path d="M8 7h8"/><path d="M7.25 8.5 10.75 15"/><path d="M16.75 8.5 13.25 15"/>'
  },
  rss_feed: {
    viewBox: '0 0 24 24',
    body: '<path d="M6 18h.01"/><path d="M5.5 12.5a6 6 0 0 1 6 6"/><path d="M5.5 7a11.5 11.5 0 0 1 11.5 11.5"/>'
  },
  network_node: {
    viewBox: '0 0 24 24',
    body: '<rect x="4" y="5" width="5" height="4" rx="1"/><rect x="15" y="5" width="5" height="4" rx="1"/><rect x="9.5" y="15" width="5" height="4" rx="1"/><path d="M9 7h6"/><path d="M12 9v6"/>'
  },
  ios_share: {
    viewBox: '0 0 24 24',
    body: '<path d="M12 15V5"/><path d="m8.5 8.5 3.5-3.5 3.5 3.5"/><path d="M6.5 11.5v6A1.5 1.5 0 0 0 8 19h8a1.5 1.5 0 0 0 1.5-1.5v-6"/>'
  },
  smart_display: {
    viewBox: '0 0 24 24',
    body: '<rect x="4" y="6" width="16" height="12" rx="2.5"/><path d="m10 9.5 5 2.5-5 2.5z"/>'
  },
  work: {
    viewBox: '0 0 24 24',
    body: '<rect x="4" y="7" width="16" height="11" rx="2"/><path d="M9 7V5.75A1.75 1.75 0 0 1 10.75 4h2.5A1.75 1.75 0 0 1 15 5.75V7"/><path d="M4 11.5h16"/>'
  },
  menu: {
    viewBox: '0 0 24 24',
    body: '<path d="M5 7h14"/><path d="M5 12h14"/><path d="M5 17h14"/>'
  },
  close: {
    viewBox: '0 0 24 24',
    body: '<path d="m6 6 12 12"/><path d="M18 6 6 18"/>'
  },
  format_list_bulleted: {
    viewBox: '0 0 24 24',
    body: '<circle cx="6.25" cy="7.5" r="1"/><circle cx="6.25" cy="12" r="1"/><circle cx="6.25" cy="16.5" r="1"/><path d="M10 7.5h8"/><path d="M10 12h8"/><path d="M10 16.5h8"/>'
  },
  toc: {
    viewBox: '0 0 24 24',
    body: '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M8.5 9h7"/><path d="M8.5 12h7"/><path d="M8.5 15h4.5"/>'
  },
  settings: {
    viewBox: '0 0 24 24',
    body: '<circle cx="12" cy="12" r="2.75"/><path d="M12 5.5v2"/><path d="M12 16.5v2"/><path d="M18.5 12h-2"/><path d="M7.5 12h-2"/><path d="m16.6 7.4-1.4 1.4"/><path d="m8.8 15.2-1.4 1.4"/><path d="m16.6 16.6-1.4-1.4"/><path d="m8.8 8.8-1.4-1.4"/>'
  },
  calendar_month: {
    viewBox: '0 0 24 24',
    body: '<rect x="4.5" y="6" width="15" height="13.5" rx="2"/><path d="M8 4.5v3"/><path d="M16 4.5v3"/><path d="M4.5 9.5h15"/><path d="M8 13h3"/><path d="M13 13h3"/><path d="M8 16h3"/>'
  },
  schedule: {
    viewBox: '0 0 24 24',
    body: '<circle cx="12" cy="12" r="7.5"/><path d="M12 8v4.5l3 1.75"/>'
  },
  sell: {
    viewBox: '0 0 24 24',
    body: '<path d="M4.5 12 12 4.5h6.5a1 1 0 0 1 1 1V12L12 19.5 4.5 12Z"/><circle cx="16.25" cy="7.75" r="1"/>'
  },
  edit: {
    viewBox: '0 0 24 24',
    body: '<path d="m6 18 2.5-.5 8-8a1.5 1.5 0 0 0-2.12-2.12l-8 8Z"/><path d="m13 6 3 3"/>'
  },
  chevron_right: {
    viewBox: '0 0 24 24',
    body: '<path d="m9 6 6 6-6 6"/>'
  },
  arrow_back: {
    viewBox: '0 0 24 24',
    body: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>'
  },
  text_fields: {
    viewBox: '0 0 24 24',
    body: '<path d="M5.5 6.5h13"/><path d="M12 6.5v11"/><path d="M8 17.5h8"/>'
  },
  text_snippet: {
    viewBox: '0 0 24 24',
    body: '<rect x="5" y="4.5" width="14" height="15" rx="2"/><path d="M8 9h8"/><path d="M8 12h8"/><path d="M8 15h5"/>'
  },
  volume_up: {
    viewBox: '0 0 24 24',
    body: '<path d="M5 14h3.5L13 18V6L8.5 10H5z"/><path d="M16 9.5a4.5 4.5 0 0 1 0 5"/><path d="M18 7a8 8 0 0 1 0 10"/>'
  },
  width_full: {
    viewBox: '0 0 24 24',
    body: '<path d="M4.5 8V5.5H9"/><path d="m4.5 5.5 4 4"/><path d="M19.5 8V5.5H15"/><path d="m19.5 5.5-4 4"/><path d="M4.5 16v2.5H9"/><path d="m4.5 18.5 4-4"/><path d="M19.5 16v2.5H15"/><path d="m19.5 18.5-4-4"/>'
  },
  sync: {
    viewBox: '0 0 24 24',
    body: '<path d="M6.5 9A6.5 6.5 0 0 1 18 7.5"/><path d="M18 4.5v3h-3"/><path d="M17.5 15A6.5 6.5 0 0 1 6 16.5"/><path d="M6 19.5v-3h3"/>'
  }
};

function escapeAttribute(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function getIconDefinition(name: string): IconDefinition {
  const key = aliases[name] ?? 'info';
  return icons[key] ?? icons.info;
}

export function renderIconSvg(
  name: string,
  options: { className?: string; label?: string } = {}
) {
  const icon = getIconDefinition(name);
  const className = ['gaga-icon', options.className].filter(Boolean).join(' ');
  const aria = options.label
    ? `role="img" aria-label="${escapeAttribute(options.label)}"`
    : 'aria-hidden="true"';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}" class="${escapeAttribute(className)}" ${aria} focusable="false" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><g>${icon.body}</g></svg>`;
}
