export const supportedLocales = ['id', 'en'] as const;
export type GagaLocale = typeof supportedLocales[number];

/**
 * Consumer Signature-owned locale dictionary.
 *
 * Keys are stable semantic identifiers. Copy is site policy and stays in the
 * consumer. Generic language persistence/projection remains an Engine concern.
 */
export const localeDictionary = {
  id: {
    'navigation.home': 'Home',
    'navigation.blog': 'Blog',
    'navigation.menu': 'Menu',
    'navigation.primary': 'Navigasi utama',
    'navigation.publication': 'Navigasi publikasi',
    'navigation.gagaDock': 'Gaga Dock',
    'actionIsland.label': 'Gaga Dynamic Notch Island',
    'actionIsland.toolbar': 'Aksi membaca dan halaman',
    'actionIsland.progress': 'Progres membaca',
    'actionIsland.toggle': 'Buka atau tutup aksi halaman',
    'actionIsland.actions': 'Aksi',
    'navigation.toggleRail': 'Buka atau tutup navigasi',
    'navigation.saveCurrentPage': 'Simpan halaman ini',
    'navigation.save': 'Simpan',
    'navigation.saveReading': 'Simpan bacaan',
    'navigation.share': 'Bagikan',
    'navigation.copyLink': 'Salin tautan',
    'navigation.reader': 'Pembaca',
    'navigation.readerPreferences': 'Preferensi pembaca',
    'navigation.closeReaderPreferences': 'Tutup preferensi pembaca',
    'navigation.focusMode': 'Mode fokus',
    'navigation.search': 'Cari',
    'navigation.searchPublication': 'Cari publikasi',
    'navigation.informationRail': 'Panel informasi',
    'navigation.toggleInformationRail': 'Buka atau tutup panel informasi',
    'navigation.closeTopSurface': 'Tutup panel teratas',
    'navigation.externalLink': 'tautan eksternal',
    'navigation.latest': 'Terbaru',
    'navigation.topics': 'Topik',
    'navigation.sections': 'Rubrik',
    'navigation.archive': 'Arsip',
    'navigation.saved': 'Tersimpan',
    'navigation.pages': 'Halaman',
    'navigation.about': 'Tentang',
    'navigation.authors': 'Penulis',
    'navigation.contact': 'Kontak',
    'navigation.support': 'Dukungan',
    'navigation.legal': 'Legal',
    'navigation.privacyPolicy': 'Kebijakan Privasi',
    'navigation.termsOfUse': 'Ketentuan Penggunaan',
    'navigation.disclaimer': 'Penafian',
    'navigation.system': 'Sistem',
    'navigation.graphs': 'Graf',
    'navigation.sitemap': 'Peta Situs',
    'navigation.rss': 'RSS',
    'navigation.social': 'Sosial',
    'navigation.youtube': 'YouTube',
    'navigation.linkedin': 'LinkedIn',

    'reader.title': 'Preferensi Pembaca',
    'reader.language': 'Bahasa',
    'reader.theme': 'Tema',
    'reader.density': 'Kepadatan',
    'reader.font': 'Ukuran Teks',
    'reader.sfx': 'SFX',
    'reader.advanced': 'Kontrol lanjutan',
    'reader.presetLegend': 'Preset membaca',
    'reader.presetCustom': 'Kustom',
    'reader.presetReset': 'Reset default',
    'reader.presetEveryday': 'Harian',
    'reader.presetPaper': 'Kertas',
    'reader.presetNight': 'Malam',
    'reader.themeBlueprint': 'Blueprint',
    'reader.themeDark': 'Gelap',
    'reader.themePaper': 'Kertas',
    'reader.themeSepia': 'Sepia',
    'reader.densityComfort': 'Nyaman',
    'reader.densityCompact': 'Ringkas',
    'reader.densityWide': 'Lega',
    'reader.sfxOn': 'Aktif',
    'reader.sfxOff': 'Nonaktif',

    'outline.title': 'Daftar Isi',
    'outline.fallback': 'Outline',
    'outline.openPrefix': 'Buka outline:',
    'outline.close': 'Tutup outline',
    'outline.opened': 'OUTLINE: TERBUKA',
    'outline.closed': 'OUTLINE: TERTUTUP',

    'article.author': 'Penulis',
    'article.published': 'Terbit',
    'article.updated': 'Diperbarui',
    'article.actions': 'Aksi artikel',
    'article.back': 'Kembali',
    'article.smartBack': 'Kembali ke tampilan sebelumnya',
    'article.highlight': 'Sorot teks kutipan',
    'article.speak': 'Dengarkan narasi artikel',
    'article.personalize': 'Personalisasi preferensi baca',
    'article.resetGraph': 'Reset tampilan graf',
    'article.information': 'Informasi',
    'article.closeInformation': 'Tutup informasi',
    'context.explore': 'Jelajahi',
    'article.snippet': 'Ringkasan',
    'article.readTime': 'Waktu baca',
    'article.topics': 'Topik',
    'article.tags': 'Tag',
    'article.breadcrumb': 'Jejak navigasi',
    'article.blog': 'Blog',

    'entity.profile': 'Profil',
    'entity.topicAbout': 'Penjelasan Topik',
    'entity.writings': 'Tulisan',
    'entity.authorNavigation': 'Navigasi penulis',
    'entity.topicNavigation': 'Navigasi topik',
    'entity.authorEyebrow': 'PENULIS',
    'entity.topicEyebrow': 'TOPIK',
    'entity.tagEyebrow': 'TAG',

    'count.article.zero': '{count} artikel',
    'count.article.one': '{count} artikel',
    'count.article.other': '{count} artikel',
    'count.label.zero': '{count} label',
    'count.label.one': '{count} label',
    'count.label.other': '{count} label',

    'reading.status': 'Membaca',
    'reading.statusUnset': 'Belum dimulai',
    'reading.statusReadNext': 'Baca berikutnya',
    'reading.statusInProgress': 'Dalam proses',
    'reading.statusReference': 'Referensi',
    'reading.statusCompleted': 'Selesai',
    'reading.utilities': 'Utilitas membaca',

    'continuity.resumeTitle': 'Lanjutkan membaca',
    'continuity.resumeAt': 'Lanjutkan dari',
    'continuity.resumeAction': 'Lanjutkan',
    'continuity.dismiss': 'Tutup',
    'continuity.savedTitle': 'Tersimpan',
    'continuity.savedSubtitle': 'Markah dan progres membaca di browser ini',
    'continuity.noActiveState': 'Belum ada status bacaan aktif.',
    'continuity.bookmarksTitle': 'Markah',
    'continuity.bookmarksDescription': 'Artikel yang Anda simpan.',
    'continuity.bookmarksLoading': 'Memuat markah.',
    'continuity.progressTitle': 'Progres membaca',
    'continuity.progressDescription': 'Posisi dan status membaca diperbarui otomatis saat Anda membaca.',
    'continuity.statusLoading': 'Memuat progres membaca.',
    'continuity.removeBookmark': 'Hapus markah',
    'continuity.noBookmarks': 'Tidak ada markah.',
    'continuity.noBookmarksHint': 'Gunakan tombol Simpan pada artikel untuk menampilkannya di sini.',
    'continuity.noProgress': 'Belum ada progres membaca.',
    'continuity.noProgressHint': 'Buka artikel dan mulai membaca untuk menampilkannya di sini.',
    'continuity.kindBookmark': 'Markah',
    'continuity.savedBookmarkMeta': 'Disimpan di perangkat ini',
    'continuity.localBrowser': 'Perangkat ini',
    'continuity.readSuffix': 'dibaca',
    'continuity.clearHistory': 'Hapus riwayat baca',
    'continuity.historyCleared': 'Riwayat baca di perangkat ini telah dihapus'
  },
  en: {
    'navigation.home': 'Home',
    'navigation.blog': 'Blog',
    'navigation.menu': 'Menu',
    'navigation.primary': 'Primary navigation',
    'navigation.publication': 'Publication navigation',
    'navigation.gagaDock': 'Gaga Dock',
    'actionIsland.label': 'Gaga Dynamic Notch Island',
    'actionIsland.toolbar': 'Reading and page actions',
    'actionIsland.progress': 'Reading progress',
    'actionIsland.toggle': 'Open or close page actions',
    'actionIsland.actions': 'Actions',
    'navigation.toggleRail': 'Toggle navigation rail',
    'navigation.saveCurrentPage': 'Save current page',
    'navigation.save': 'Save',
    'navigation.saveReading': 'Save reading',
    'navigation.share': 'Share',
    'navigation.copyLink': 'Copy link',
    'navigation.reader': 'Reader',
    'navigation.readerPreferences': 'Reader preferences',
    'navigation.closeReaderPreferences': 'Close reader preferences',
    'navigation.focusMode': 'Focus mode',
    'navigation.search': 'Search',
    'navigation.searchPublication': 'Search publication',
    'navigation.informationRail': 'Information rail',
    'navigation.toggleInformationRail': 'Toggle information rail',
    'navigation.closeTopSurface': 'Close top surface',
    'navigation.externalLink': 'external link',
    'navigation.latest': 'Latest',
    'navigation.topics': 'Topics',
    'navigation.sections': 'Sections',
    'navigation.archive': 'Archive',
    'navigation.saved': 'Saved',
    'navigation.pages': 'Pages',
    'navigation.about': 'About',
    'navigation.authors': 'Authors',
    'navigation.contact': 'Contact',
    'navigation.support': 'Support',
    'navigation.legal': 'Legal',
    'navigation.privacyPolicy': 'Privacy Policy',
    'navigation.termsOfUse': 'Terms of Use',
    'navigation.disclaimer': 'Disclaimer',
    'navigation.system': 'System',
    'navigation.graphs': 'Graphs',
    'navigation.sitemap': 'Sitemap',
    'navigation.rss': 'RSS',
    'navigation.social': 'Social',
    'navigation.youtube': 'YouTube',
    'navigation.linkedin': 'LinkedIn',

    'reader.title': 'Reader Preferences',
    'reader.language': 'Language',
    'reader.theme': 'Theme',
    'reader.density': 'Density',
    'reader.font': 'Text Size',
    'reader.sfx': 'SFX',
    'reader.advanced': 'Advanced controls',
    'reader.presetLegend': 'Reading preset',
    'reader.presetCustom': 'Custom',
    'reader.presetReset': 'Reset default',
    'reader.presetEveryday': 'Everyday',
    'reader.presetPaper': 'Paper',
    'reader.presetNight': 'Night',
    'reader.themeBlueprint': 'Blueprint',
    'reader.themeDark': 'Dark',
    'reader.themePaper': 'Paper',
    'reader.themeSepia': 'Sepia',
    'reader.densityComfort': 'Comfort',
    'reader.densityCompact': 'Compact',
    'reader.densityWide': 'Wide',
    'reader.sfxOn': 'On',
    'reader.sfxOff': 'Off',

    'outline.title': 'Contents',
    'outline.fallback': 'Outline',
    'outline.openPrefix': 'Open outline:',
    'outline.close': 'Close outline',
    'outline.opened': 'OUTLINE: OPEN',
    'outline.closed': 'OUTLINE: CLOSED',

    'article.author': 'Author',
    'article.published': 'Published',
    'article.updated': 'Updated',
    'article.actions': 'Article actions',
    'article.back': 'Back',
    'article.smartBack': 'Return to previous view',
    'article.highlight': 'Highlight text excerpt',
    'article.speak': 'Listen to article narration',
    'article.personalize': 'Personalize reading preferences',
    'article.resetGraph': 'Reset graph view',
    'article.information': 'Information',
    'article.closeInformation': 'Close information',
    'context.explore': 'Explore',
    'article.snippet': 'Snippet',
    'article.readTime': 'Read time',
    'article.topics': 'Topics',
    'article.tags': 'Tags',
    'article.breadcrumb': 'Breadcrumb',
    'article.blog': 'Blog',

    'entity.profile': 'Profile',
    'entity.topicAbout': 'About Topic',
    'entity.writings': 'Writing',
    'entity.authorNavigation': 'Author navigation',
    'entity.topicNavigation': 'Topic navigation',
    'entity.authorEyebrow': 'AUTHOR',
    'entity.topicEyebrow': 'TOPIC',
    'entity.tagEyebrow': 'TAG',

    'count.article.zero': '{count} articles',
    'count.article.one': '{count} article',
    'count.article.other': '{count} articles',
    'count.label.zero': '{count} labels',
    'count.label.one': '{count} label',
    'count.label.other': '{count} labels',

    'reading.status': 'Reading',
    'reading.statusUnset': 'Not started',
    'reading.statusReadNext': 'Read next',
    'reading.statusInProgress': 'In progress',
    'reading.statusReference': 'Reference',
    'reading.statusCompleted': 'Completed',
    'reading.utilities': 'Reading utilities',

    'continuity.resumeTitle': 'Continue reading',
    'continuity.resumeAt': 'Resume at',
    'continuity.resumeAction': 'Resume',
    'continuity.dismiss': 'Dismiss',
    'continuity.savedTitle': 'Saved',
    'continuity.savedSubtitle': 'Bookmarks and reading progress in this browser',
    'continuity.noActiveState': 'No active reading state yet.',
    'continuity.bookmarksTitle': 'Bookmarks',
    'continuity.bookmarksDescription': 'Articles you saved.',
    'continuity.bookmarksLoading': 'Bookmarks loading.',
    'continuity.progressTitle': 'Reading progress',
    'continuity.progressDescription': 'Reading position and status update automatically as you read.',
    'continuity.statusLoading': 'Reading progress loading.',
    'continuity.removeBookmark': 'Remove bookmark',
    'continuity.noBookmarks': 'No bookmarks.',
    'continuity.noBookmarksHint': 'Use the Save action on an article to show it here.',
    'continuity.noProgress': 'No reading progress yet.',
    'continuity.noProgressHint': 'Open an article and start reading to show it here.',
    'continuity.kindBookmark': 'Bookmark',
    'continuity.savedBookmarkMeta': 'Saved on this device',
    'continuity.localBrowser': 'This device',
    'continuity.readSuffix': 'read',
    'continuity.clearHistory': 'Clear reading history',
    'continuity.historyCleared': 'Reading history on this device has been cleared'
  }
} as const;

export type I18nMessageKey = keyof typeof localeDictionary.id;

export type GagaLocalizedLabel = {
  key: I18nMessageKey;
  id: string;
  en: string;
};

export type GagaLocalizedPair = Partial<Record<GagaLocale, string>> & {
  id: string;
};

export function resolveLocale(value: unknown, fallback: GagaLocale = 'id'): GagaLocale {
  return supportedLocales.some((locale) => locale === value) ? value as GagaLocale : fallback;
}

export function localizedPairText(pair: GagaLocalizedPair, locale: unknown, fallback: GagaLocale = 'id') {
  const resolved = resolveLocale(locale, fallback);
  return pair[resolved] ?? pair[fallback] ?? pair.id;
}

export function isI18nMessageKey(value: unknown): value is I18nMessageKey {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(localeDictionary.id, value);
}

export function i18nText(key: I18nMessageKey, locale: GagaLocale = 'id') {
  return localeDictionary[locale][key];
}

export function i18nLabel(key: I18nMessageKey): GagaLocalizedLabel {
  return {
    key,
    id: localeDictionary.id[key],
    en: localeDictionary.en[key]
  };
}

type CountMessageFamily = 'article' | 'label';

export function i18nCount(family: CountMessageFamily, count: number, locale: GagaLocale = 'id') {
  const pluralKey = count === 0 ? 'zero' : count === 1 ? 'one' : 'other';
  const key = `count.${family}.${pluralKey}` as I18nMessageKey;
  return i18nText(key, locale).replace('{count}', String(count));
}

/**
 * Compatibility projection for existing Consumer Signature components. New composition
 * should prefer stable keys through i18nLabel().
 */
export const i18nConfig = {
  id: {
    reader: i18nText('reader.title', 'id'),
    language: i18nText('reader.language', 'id'),
    theme: i18nText('reader.theme', 'id'),
    density: i18nText('reader.density', 'id'),
    font: i18nText('reader.font', 'id'),
    sfx: i18nText('reader.sfx', 'id'),
    outlineTitle: i18nText('outline.title', 'id'),
    outlineFallback: i18nText('outline.fallback', 'id'),
    outlineOpenPrefix: i18nText('outline.openPrefix', 'id'),
    outlineClose: i18nText('outline.close', 'id'),
    outlineOpened: i18nText('outline.opened', 'id'),
    outlineClosed: i18nText('outline.closed', 'id'),
    articleAuthor: i18nText('article.author', 'id'),
    articlePublished: i18nText('article.published', 'id'),
    articleUpdated: i18nText('article.updated', 'id'),
    articleActions: i18nText('article.actions', 'id'),
    articleBack: i18nText('article.back', 'id'),
    articleInformation: i18nText('article.information', 'id'),
    articleSnippet: i18nText('article.snippet', 'id'),
    articleReadTime: i18nText('article.readTime', 'id'),
    articleTopics: i18nText('article.topics', 'id'),
    articleTags: i18nText('article.tags', 'id'),
    readingStatus: i18nText('reading.status', 'id'),
    readingStatusUnset: i18nText('reading.statusUnset', 'id'),
    readingStatusReadNext: i18nText('reading.statusReadNext', 'id'),
    readingStatusInProgress: i18nText('reading.statusInProgress', 'id'),
    readingStatusReference: i18nText('reading.statusReference', 'id'),
    readingStatusCompleted: i18nText('reading.statusCompleted', 'id'),
    readingUtilities: i18nText('reading.utilities', 'id')
  },
  en: {
    reader: i18nText('reader.title', 'en'),
    language: i18nText('reader.language', 'en'),
    theme: i18nText('reader.theme', 'en'),
    density: i18nText('reader.density', 'en'),
    font: i18nText('reader.font', 'en'),
    sfx: i18nText('reader.sfx', 'en'),
    outlineTitle: i18nText('outline.title', 'en'),
    outlineFallback: i18nText('outline.fallback', 'en'),
    outlineOpenPrefix: i18nText('outline.openPrefix', 'en'),
    outlineClose: i18nText('outline.close', 'en'),
    outlineOpened: i18nText('outline.opened', 'en'),
    outlineClosed: i18nText('outline.closed', 'en'),
    articleAuthor: i18nText('article.author', 'en'),
    articlePublished: i18nText('article.published', 'en'),
    articleUpdated: i18nText('article.updated', 'en'),
    articleActions: i18nText('article.actions', 'en'),
    articleBack: i18nText('article.back', 'en'),
    articleInformation: i18nText('article.information', 'en'),
    articleSnippet: i18nText('article.snippet', 'en'),
    articleReadTime: i18nText('article.readTime', 'en'),
    articleTopics: i18nText('article.topics', 'en'),
    articleTags: i18nText('article.tags', 'en'),
    readingStatus: i18nText('reading.status', 'en'),
    readingStatusUnset: i18nText('reading.statusUnset', 'en'),
    readingStatusReadNext: i18nText('reading.statusReadNext', 'en'),
    readingStatusInProgress: i18nText('reading.statusInProgress', 'en'),
    readingStatusReference: i18nText('reading.statusReference', 'en'),
    readingStatusCompleted: i18nText('reading.statusCompleted', 'en'),
    readingUtilities: i18nText('reading.utilities', 'en')
  }
} as const;
