/**
 * PAKRPP Scalable Knowledge Publication System — Canonical Architecture & Registries
 *
 * Principle:
 * - CORE CONTRACT = strict (invariants & minimum validation)
 * - PRODUCT CONFIGURATION = softcoded, configurable, adjustable, extensible, provider-neutral
 * - CMS BOUNDARY = CMS-agnostic (Bootstrap owns ontology, navigation, routes, discovery, presentation;
 *   CMS adapter only supplies storage, taxonomy, relations, menus, and content operations).
 */

export type ContentObjectKind =
  | 'publication'
  | 'author'
  | 'series'
  | 'curation'
  | 'reference'
  | 'page';

export type ClassificationKind = 'topic' | 'tag';

export type PublicationStatus = 'draft' | 'published' | 'archived';

export type KnowledgeRelationType =
  | 'belongsTo'
  | 'taggedWith'
  | 'writtenBy'
  | 'partOfSeries'
  | 'includedIn'
  | 'references'
  | 'relatedTo'
  | 'supersedes'
  | 'respondsTo';

export interface KnowledgeRelation {
  type: KnowledgeRelationType;
  targetId: string;
  targetKind: ContentObjectKind | ClassificationKind;
  label?: string;
  href?: string;
}

export interface CanonicalPublication {
  id: string;
  type: string;
  slug: string;
  title: string;
  status: PublicationStatus;
  publishedAt?: string;
  updatedAt?: string;
  authors: string[];
  topics: string[];
  tags: string[];
  references: string[];
  relations: KnowledgeRelation[];
  summary?: string;
  readTime?: string;
  href: string;
  canonicalHref: string;
  year?: string;
  month?: string;
}

export interface PublicationTypeDefinition {
  id: string;
  label: string;
  labelEn: string;
  enabled: boolean;
  description?: string;
}

export interface TopicDefinition {
  id: string;
  slug: string;
  label: string;
  labelEn: string;
  enabled: boolean;
  order: number;
  description: string;
  descriptionEn: string;
}

export interface SeriesDefinition {
  id: string;
  title: string;
  slug: string;
  description: string;
  publications: string[];
  ordering: number;
}

export interface CurationDefinition {
  id: string;
  title: string;
  slug: string;
  publicLabel: string;
  description: string;
  publications: string[];
  order: number;
}

export interface ReferenceObject {
  id: string;
  slug: string;
  title: string;
  authors: string[];
  year: string;
  sourceType: 'regulation' | 'book' | 'paper' | 'standard' | 'monograph';
  summary: string;
  externalUrl?: string;
  citedByPublications: string[];
  topics: string[];
}

export interface SocialLinkDefinition {
  id: string;
  label: string;
  href: string;
  external: true;
  enabled: boolean;
  order: number;
  handle?: string;
}

export interface RootSectionItemConfig {
  id: string;
  label: string;
  labelEn: string;
  href: string;
  external?: boolean;
  featureFlag?: keyof PakrppFeatureFlags;
  meta?: string;
}

export type RootSectionId =
  | 'latest'
  | 'saved'
  | 'topics'
  | 'archive'
  | 'knowledge'
  | 'about'
  | 'system'
  | 'legal'
  | 'social';

export interface RootSectionConfig {
  id: RootSectionId;
  anchor: string;
  numberLabel: string;
  visualGroup: 1 | 2 | 3 | 4;
  label: string;
  labelEn: string;
  enabled: boolean;
  order: number;
  featureFlag?: keyof PakrppFeatureFlags;
  description?: string;
  moreLink?: {
    label: string;
    labelEn: string;
    href: string;
  };
  items?: RootSectionItemConfig[];
}

export interface PakrppFeatureFlags {
  saved: boolean;
  graph: boolean;
  knowledgeIndex: boolean;
  references: boolean;
  rss: boolean;
  status: boolean;
  social: boolean;
  styleArchetypeSwitcher: boolean;
}

export interface StyleArchetypeDefinition {
  id: 'editorial' | 'brutalism' | 'blueprintism' | 'enterprise';
  label: string;
  labelEn: string;
  archetypeClass: string;
  summary: string;
}

/**
 * 18. FEATURE FLAGS
 * Optional capabilities can be toggled off without breaking contracts.
 */
export const featureFlags: Readonly<PakrppFeatureFlags> = Object.freeze({
  saved: true,
  graph: true,
  knowledgeIndex: true,
  references: true,
  rss: true,
  status: true,
  social: true,
  styleArchetypeSwitcher: true
});

export function isFeatureEnabled(flag?: keyof PakrppFeatureFlags): boolean {
  if (!flag) return true;
  return featureFlags[flag] === true;
}

/**
 * 6. PUBLICATION TYPE REGISTRY
 * Never hardcode publication types directly into UI components.
 */
export const publicationTypeRegistry: readonly PublicationTypeDefinition[] = Object.freeze([
  { id: 'essay', label: 'Esai', labelEn: 'Essay', enabled: true, description: 'Refleksi mendalam dan argumen konseptual terstruktur.' },
  { id: 'note', label: 'Catatan', labelEn: 'Note', enabled: true, description: 'Observasi ringkas, temuan lapangan, atau sintesis cepat.' },
  { id: 'analysis', label: 'Analisis', labelEn: 'Analysis', enabled: true, description: 'Bedah sistemik atas kebijakan, struktur pasar, atau teknologi.' },
  { id: 'research', label: 'Riset', labelEn: 'Research', enabled: true, description: 'Kajian berbasis bukti, metodologi, dan telaah literatur.' },
  { id: 'guide', label: 'Panduan', labelEn: 'Guide', enabled: true, description: 'Pedoman praktis dan tata kerja operasional.' },
  { id: 'report', label: 'Laporan', labelEn: 'Report', enabled: true, description: 'Dokumentasi terstruktur atas evaluasi, audit, atau pelaporan.' },
  { id: 'experiment', label: 'Eksperimen', labelEn: 'Experiment', enabled: true, description: 'Uji coba prototipe, simulasi model, atau eksplorasi teknis.' },
  { id: 'insight', label: 'Insight', labelEn: 'Insight', enabled: true, description: 'Sintesis tajam atas pola yang jarang diperhatikan.' },
  { id: 'case-study', label: 'Studi Kasus', labelEn: 'Case Study', enabled: true, description: 'Pembelajaran empiris dari implementasi nyata.' },
  { id: 'commentary', label: 'Komentar', labelEn: 'Commentary', enabled: true, description: 'Tanggapan kritis atas wacana atau regulasi terkini.' }
]);

export function getEnabledPublicationTypes(): PublicationTypeDefinition[] {
  return publicationTypeRegistry.filter((item) => item.enabled);
}

export function resolvePublicationType(rawType?: string): PublicationTypeDefinition {
  const normalized = (rawType || 'essay').trim().toLowerCase();
  const found = publicationTypeRegistry.find(
    (item) => item.enabled && (item.id === normalized || item.label.toLowerCase() === normalized)
  );
  return found ?? publicationTypeRegistry[0];
}

/**
 * 7 & 8. TOPIC MODEL & TOPIC CONFIGURATION
 * Canonical initial topics: Pelaporan, Teknologi, Anomali.
 */
export const topicRegistry: readonly TopicDefinition[] = Object.freeze([
  {
    id: 'pelaporan',
    slug: 'pelaporan',
    label: 'Pelaporan',
    labelEn: 'Reporting & Governance',
    enabled: true,
    order: 1,
    description: 'Tata kelola, regulasi, proses, pengadaan, data, kualitas, dan praktik pelaporan.',
    descriptionEn: 'Governance, regulation, processes, procurement, data, quality, and reporting practices.'
  },
  {
    id: 'teknologi',
    slug: 'teknologi',
    label: 'Teknologi',
    labelEn: 'Technology & Systems',
    enabled: true,
    order: 2,
    description: 'Sistem, perangkat lunak, web, AI, arsitektur, dan rekayasa.',
    descriptionEn: 'Systems, software, web, AI, architecture, and engineering.'
  },
  {
    id: 'anomali',
    slug: 'anomali',
    label: 'Anomali',
    labelEn: 'Anomaly & Lateral Thought',
    enabled: true,
    order: 3,
    description: 'Tulisan dengan perspektif, analogi, gaya, struktur, atau tema yang sengaja berada di luar pola umum, termasuk lateral, absurd, kontraintuitif, spekulatif, atau tidak konvensional.',
    descriptionEn: 'Writings with perspectives, analogies, structures, or themes intentionally outside conventional patterns—lateral, counterintuitive, or speculative.'
  }
]);

export function getEnabledTopics(): TopicDefinition[] {
  return [...topicRegistry]
    .filter((topic) => topic.enabled)
    .sort((a, b) => a.order - b.order);
}

export function resolveCanonicalTopic(slugOrLabel: string): TopicDefinition | undefined {
  const clean = slugOrLabel.trim().toLowerCase();
  return topicRegistry.find(
    (topic) =>
      topic.enabled &&
      (topic.id === clean || topic.slug === clean || topic.label.toLowerCase() === clean)
  );
}

/**
 * 11. SERIES & CURATION REGISTRY
 * Internal machine name `curation` / `curations`, public label `Koleksi`.
 */
export const seriesRegistry: readonly SeriesDefinition[] = Object.freeze([
  {
    id: 'series.dialog-lizzie-magie',
    title: 'Dialog PakRPP x Lizzie Magie',
    slug: 'dialog-pakrpp-x-lizzie-magie',
    description: 'Sekuens editorial tentang permainan ekonomi, monopoli, akal imitasi, dan martabat manusia.',
    publications: [
      'mengapa-ai-bukan-bukti',
      'akal-imitasi-sebagai-pekerja-tanpa-dignity',
      'dialog-imajiner-pakrpp-lizzie-monopoly-akal-imitasi',
      'karsa-karya-kesejahteraan-antitesis-monopoly-dari-level-rw'
    ],
    ordering: 1
  },
  {
    id: 'series.arsitektur-pengetahuan',
    title: 'Arsitektur Publikasi Pengetahuan',
    slug: 'arsitektur-publikasi-pengetahuan',
    description: 'Seri rekayasa sistem publikasi softcoded, kontrak rute kanonik, dan permukaan baca adaptif.',
    publications: [
      'softcoded-systems-scale-better-than-theme-forks',
      'designing-context-aware-reading-surface'
    ],
    ordering: 2
  }
]);

export const curationRegistry: readonly CurationDefinition[] = Object.freeze([
  {
    id: 'curation.tata-kelola-dan-bukti',
    title: 'Tata Kelola, Bukti & Etika Pelaporan',
    slug: 'tata-kelola-dan-bukti',
    publicLabel: 'Koleksi',
    description: 'Kurasi lintas topik mengenai integritas bukti, akuntabilitas ESG, dan batas penggunaan AI dalam pelaporan.',
    publications: [
      'mengapa-ai-bukan-bukti',
      'esg-etika-pasar-atau-tambalan-reputasi'
    ],
    order: 1
  },
  {
    id: 'curation.ekonomi-dignity',
    title: 'Manusia, Modal & Kesejahteraan Lokal',
    slug: 'ekonomi-dignity',
    publicLabel: 'Koleksi',
    description: 'Kurasi esai dan anomali tentang kerja, martabat manusia, dan antitesis monopoli dari tingkat tapak.',
    publications: [
      'akal-imitasi-sebagai-pekerja-tanpa-dignity',
      'dialog-imajiner-pakrpp-lizzie-monopoly-akal-imitasi',
      'karsa-karya-kesejahteraan-antitesis-monopoly-dari-level-rw'
    ],
    order: 2
  }
]);

/**
 * 9 & 10. FIRST-CLASS KNOWLEDGE REFERENCES
 * References are first-class knowledge objects, not merely article bibliographies.
 */
export const referenceRegistry: readonly ReferenceObject[] = Object.freeze([
  {
    id: 'ref.landlords-game-1904',
    slug: 'the-landlords-game-lizzie-magie-1904',
    title: 'The Landlord’s Game (US Patent 748,626) — Elizabeth J. Magie',
    authors: ['Elizabeth J. Magie'],
    year: '1904',
    sourceType: 'monograph',
    summary: 'Permainan papan asli yang dirancang untuk mendemonstrasikan konsekuensi ekonomi dari monopoli tanah dan sewa.',
    citedByPublications: [
      'dialog-imajiner-pakrpp-lizzie-monopoly-akal-imitasi',
      'karsa-karya-kesejahteraan-antitesis-monopoly-dari-level-rw'
    ],
    topics: ['anomali', 'pelaporan']
  },
  {
    id: 'ref.epistemic-evidence-reporting',
    slug: 'standar-bukti-dan-verifikasi-pelaporan-publik',
    title: 'Prinsip Ketertelusuran Bukti dan Akuntabilitas Audit dalam Sistem Pelaporan Elektronik',
    authors: ['Komite Metodologi Pelaporan'],
    year: '2026',
    sourceType: 'standard',
    summary: 'Kerangka verifikasi sumber primer, rantai bukti (chain of custody), dan pemisahan antara sintesis algoritmik dengan bukti audit.',
    citedByPublications: [
      'mengapa-ai-bukan-bukti',
      'esg-etika-pasar-atau-tambalan-reputasi'
    ],
    topics: ['pelaporan', 'teknologi']
  },
  {
    id: 'ref.wcag-22-w3c',
    slug: 'wcag-2-2-accessibility-guidelines',
    title: 'Web Content Accessibility Guidelines (WCAG) 2.2 — W3C Recommendation',
    authors: ['W3C Accessibility Guidelines Working Group'],
    year: '2024',
    sourceType: 'standard',
    summary: 'Standar aksesibilitas web untuk navigasi keyboard, kontras terukur, target sentuh, dan permukaan baca inklusif.',
    externalUrl: 'https://www.w3.org/TR/WCAG22/',
    citedByPublications: [
      'designing-context-aware-reading-surface',
      'softcoded-systems-scale-better-than-theme-forks'
    ],
    topics: ['teknologi']
  },
  {
    id: 'ref.esg-disclosure-framework',
    slug: 'kerangka-evaluasi-pengungkapan-keberlanjutan-esg',
    title: 'Evaluasi Kritis Pengungkapan Keberlanjutan: Substansi Operasional vs Kosmetik Reputasi',
    authors: ['PakRPP Research Note'],
    year: '2025',
    sourceType: 'paper',
    summary: 'Analisis komparatif antara metrik pelaporan kepatuhan formal dengan dampak keputusan alokasi sumber daya.',
    citedByPublications: [
      'esg-etika-pasar-atau-tambalan-reputasi'
    ],
    topics: ['pelaporan']
  }
]);

export function getReferenceBySlug(slug: string): ReferenceObject | undefined {
  return referenceRegistry.find((ref) => ref.slug === slug || ref.id === slug);
}

/**
 * Dynamic Style Archetypes (Minimalism / Brutalism / Blueprintism / Enterprise)
 * backed by User-Customizable Design Tokens.
 */
export const styleArchetypeRegistry: readonly StyleArchetypeDefinition[] = Object.freeze([
  {
    id: 'editorial',
    label: 'Minimalism (Editorial)',
    labelEn: 'Minimalism (Editorial)',
    archetypeClass: 'editorial',
    summary: 'Tipografi indeks bersih, ruang kosong terukur, dan garis pemisah setipis rambut.'
  },
  {
    id: 'brutalism',
    label: 'Brutalism (Raw Structural)',
    labelEn: 'Brutalism (Raw Structural)',
    archetypeClass: 'brutalism',
    summary: 'Kontras struktural tegas, garis batas tajam, dan eksposur grid arsitektural.'
  },
  {
    id: 'blueprintism',
    label: 'Blueprint (Technical)',
    labelEn: 'Blueprint (Technical)',
    archetypeClass: 'blueprintism',
    summary: 'Presisi diagram teknis dengan aksen koordinat dan keterbacaan sistemik.'
  },
  {
    id: 'enterprise',
    label: 'Institutional',
    labelEn: 'Institutional',
    archetypeClass: 'enterprise',
    summary: 'Kepadatan dokumen institusional untuk telaah kebijakan dan pelaporan panjang.'
  }
]);

/**
 * External Social Links Configuration
 */
export const socialLinksRegistry: readonly SocialLinkDefinition[] = Object.freeze([
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: 'https://www.linkedin.com',
    external: true,
    enabled: true,
    order: 1,
    handle: 'in/pakrpp'
  },
  {
    id: 'youtube',
    label: 'YouTube',
    href: 'https://www.youtube.com',
    external: true,
    enabled: true,
    order: 2,
    handle: '@pakrpp'
  },
  {
    id: 'reddit',
    label: 'Reddit',
    href: 'https://www.reddit.com',
    external: true,
    enabled: true,
    order: 3,
    handle: 'u/pakrpp'
  }
]);

export function getEnabledSocialLinks(): SocialLinkDefinition[] {
  if (!isFeatureEnabled('social')) return [];
  return [...socialLinksRegistry]
    .filter((item) => item.enabled)
    .sort((a, b) => a.order - b.order);
}

/**
 * 1, 2, 17. ROOT HUMAN NAVIGATION & VISUAL GROUPING CONFIGURATION
 *
 * Canonical root sections:
 * #latest (#Terbaru)
 * #saved (#Tersimpan)
 * #topics (#Topik)
 * #archive (#Arsip)
 * #knowledge (#Pengetahuan)
 * #about (#Tentang)
 * #system (#Sistem)
 * #legal (#Legal)
 * #social (#Sosial)
 */
export const navigationConfig = Object.freeze({
  homepagePublicationLimit: 20,
  archivePreviewYears: ['2026', '2025', '2024'],
  rootSections: [
    'latest',
    'saved',
    'topics',
    'archive',
    'knowledge',
    'about',
    'system',
    'legal',
    'social'
  ] as const satisfies readonly RootSectionId[],
  visualGroups: [
    {
      id: 'group-01',
      code: '01',
      label: 'TERBARU',
      labelEn: 'LATEST',
      sections: ['latest'] as const
    },
    {
      id: 'group-02',
      code: '02',
      label: 'TERSIMPAN · TOPIK · ARSIP · PENGETAHUAN',
      labelEn: 'SAVED · TOPICS · ARCHIVE · KNOWLEDGE',
      sections: ['saved', 'topics', 'archive', 'knowledge'] as const
    },
    {
      id: 'group-03',
      code: '03',
      label: 'TENTANG · SISTEM · LEGAL',
      labelEn: 'ABOUT · SYSTEM · LEGAL',
      sections: ['about', 'system', 'legal'] as const
    },
    {
      id: 'group-04',
      code: '04',
      label: 'SOSIAL',
      labelEn: 'SOCIAL',
      sections: ['social'] as const
    }
  ] as const,
  sections: [
    {
      id: 'latest',
      anchor: 'latest',
      numberLabel: '01',
      visualGroup: 1,
      label: 'Terbaru',
      labelEn: 'Latest',
      enabled: true,
      order: 1,
      description: '20 publikasi terbaru lintas tipe dan topik.',
      moreLink: {
        label: 'Semua Publikasi',
        labelEn: 'All Publications',
        href: '/latest'
      }
    },
    {
      id: 'saved',
      anchor: 'saved',
      numberLabel: '02.A',
      visualGroup: 2,
      label: 'Tersimpan',
      labelEn: 'Saved',
      enabled: true,
      order: 2,
      featureFlag: 'saved',
      description: 'Daftar artikel tersimpan pada state pembaca.',
      moreLink: {
        label: 'Semua Tersimpan',
        labelEn: 'All Saved',
        href: '/saved'
      }
    },
    {
      id: 'topics',
      anchor: 'topics',
      numberLabel: '02.B',
      visualGroup: 2,
      label: 'Topik',
      labelEn: 'Topics',
      enabled: true,
      order: 3,
      description: 'Klasifikasi utama publikasi pengetahuan.',
      moreLink: {
        label: 'Semua Topik',
        labelEn: 'All Topics',
        href: '/topics'
      }
    },
    {
      id: 'archive',
      anchor: 'archive',
      numberLabel: '02.C',
      visualGroup: 2,
      label: 'Arsip',
      labelEn: 'Archive',
      enabled: true,
      order: 4,
      description: 'Tampilan temporal berdasarkan tahun dan bulan terbit.',
      moreLink: {
        label: 'Semua Arsip',
        labelEn: 'All Archives',
        href: '/archive'
      }
    },
    {
      id: 'knowledge',
      anchor: 'knowledge',
      numberLabel: '02.D',
      visualGroup: 2,
      label: 'Pengetahuan',
      labelEn: 'Knowledge',
      enabled: true,
      order: 5,
      description: 'Jalur eksplorasi relasional, indeks sistematis, tag, dan objek referensi.',
      items: [
        { id: 'graph', label: 'Graf', labelEn: 'Graph', href: '/knowledge/graph', featureFlag: 'graph', meta: 'Relasi antar objek pengetahuan' },
        { id: 'index', label: 'Indeks', labelEn: 'Index', href: '/knowledge/index', featureFlag: 'knowledgeIndex', meta: 'Indeks alfabetis & sistematis' },
        { id: 'tags', label: 'Tag', labelEn: 'Tags', href: '/knowledge/tags', meta: 'Deskriptor granular lintas topik' },
        { id: 'references', label: 'Referensi', labelEn: 'References', href: '/knowledge/references', featureFlag: 'references', meta: 'Objek sumber & rujukan primer' }
      ]
    },
    {
      id: 'about',
      anchor: 'about',
      numberLabel: '03.A',
      visualGroup: 3,
      label: 'Tentang',
      labelEn: 'About',
      enabled: true,
      order: 6,
      items: [
        { id: 'about-root', label: 'Tentang', labelEn: 'About', href: '/about', meta: 'Prinsip dan mandat editorial' },
        { id: 'about-author', label: 'Penulis', labelEn: 'Author', href: '/about/author', meta: 'Profil penulis & kontributor' },
        { id: 'about-support', label: 'Dukungan', labelEn: 'Support', href: '/about/support', meta: 'Keberlanjutan publikasi independen' },
        { id: 'about-contact', label: 'Kontak', labelEn: 'Contact', href: '/about/contact', meta: 'Korespondensi & diskusi' }
      ]
    },
    {
      id: 'system',
      anchor: 'system',
      numberLabel: '03.B',
      visualGroup: 3,
      label: 'Sistem',
      labelEn: 'System',
      enabled: true,
      order: 7,
      items: [
        { id: 'system-sitemap', label: 'Peta Situs', labelEn: 'Sitemap', href: '/system/sitemap', meta: 'Hierarki lengkap untuk manusia' },
        { id: 'system-rss', label: 'RSS', labelEn: 'RSS', href: '/system/rss', featureFlag: 'rss', meta: 'Langganan sindikasi terbuka' },
        { id: 'system-status', label: 'Status', labelEn: 'Status', href: '/system/status', featureFlag: 'status', meta: 'Kesehatan kontrak & sistem' }
      ]
    },
    {
      id: 'legal',
      anchor: 'legal',
      numberLabel: '03.C',
      visualGroup: 3,
      label: 'Legal',
      labelEn: 'Legal',
      enabled: true,
      order: 8,
      items: [
        { id: 'legal-privacy', label: 'Kebijakan Privasi', labelEn: 'Privacy Policy', href: '/legal/privacy', meta: 'Batas data & penyimpanan lokal' },
        { id: 'legal-terms', label: 'Ketentuan Penggunaan', labelEn: 'Terms of Use', href: '/legal/terms', meta: 'Ketentuan akses & sitasi' },
        { id: 'legal-disclaimer', label: 'Penafian', labelEn: 'Disclaimer', href: '/legal/disclaimer', meta: 'Batas tanggung jawab editorial' },
        { id: 'legal-license', label: 'Lisensi', labelEn: 'License', href: '/legal/license', meta: 'Hak cipta & atribusi karya' }
      ]
    },
    {
      id: 'social',
      anchor: 'social',
      numberLabel: '04',
      visualGroup: 4,
      label: 'Sosial',
      labelEn: 'Social',
      enabled: true,
      order: 9,
      featureFlag: 'social',
      items: socialLinksRegistry.map((link) => ({
        id: link.id,
        label: link.label,
        labelEn: link.label,
        href: link.href,
        external: true,
        meta: link.handle
      }))
    }
  ] satisfies readonly RootSectionConfig[]
});

export function getEnabledRootSections(): RootSectionConfig[] {
  return (navigationConfig.sections as readonly RootSectionConfig[])
    .filter((section) => section.enabled && isFeatureEnabled(section.featureFlag))
    .sort((a, b) => a.order - b.order)
    .map((section) => ({
      ...section,
      items: section.items?.filter((item: RootSectionItemConfig) => isFeatureEnabled(item.featureFlag))
    }));
}

/**
 * 5 & 16. CORE INVARIANT VALIDATORS
 */
export function validatePublicationInvariant(input: Partial<CanonicalPublication>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!input.id || typeof input.id !== 'string') errors.push('Publication invariant missing: id');
  if (!input.type || typeof input.type !== 'string') errors.push('Publication invariant missing: type');
  if (!input.slug || typeof input.slug !== 'string') errors.push('Publication invariant missing: slug');
  if (!input.title || typeof input.title !== 'string') errors.push('Publication invariant missing: title');
  if (!input.status || typeof input.status !== 'string') errors.push('Publication invariant missing: status');
  return { valid: errors.length === 0, errors };
}

export function validateTopicInvariant(input: Partial<TopicDefinition>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!input.id || typeof input.id !== 'string') errors.push('Topic invariant missing: id');
  if (!input.slug || typeof input.slug !== 'string') errors.push('Topic invariant missing: slug');
  if (!input.label || typeof input.label !== 'string') errors.push('Topic invariant missing: label');
  return { valid: errors.length === 0, errors };
}

/**
 * 20 & 21. CMS-AGNOSTIC CONTENT ADAPTER CONTRACT
 * Ensures EmDash CMS or any future headless CMS can plug in as a storage provider
 * while Bootstrap retains ownership of ontology, navigation, and route contracts.
 */
export interface ContentProviderAdapter {
  readonly providerId: 'local-astro' | 'emdash-cms' | string;
  readonly providerName: string;
  getPublications(): Promise<CanonicalPublication[]>;
  getPublicationBySlug(slug: string): Promise<CanonicalPublication | undefined>;
  getTopics(): Promise<TopicDefinition[]>;
  getReferences(): Promise<readonly ReferenceObject[]>;
}
