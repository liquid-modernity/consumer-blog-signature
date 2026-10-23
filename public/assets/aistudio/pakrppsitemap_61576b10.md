# PAKRPP BLOG LAYOUT
## Canonical Architecture Recap

Gunakan dokumen ini sebagai acuan arsitektur untuk mengiterasi website bootstrap menjadi **scalable knowledge publication system**.

Prinsip utama:

- Human Navigation harus scalable, logis, koheren, dan komprehensif.
- Visual root website menggunakan pendekatan **sitemap-like index page**.
- Sistem harus **softcoded, configurable, adjustable, extensible, tokenisasi, dan provider-neutral**.
- Jangan hardcode taxonomy, publication type, navigation item, social link, visibility, ordering, atau label langsung ke komponen UI.
- Core contract tetap strict untuk menjaga integritas data.
- Configuration layer menangani pilihan produk dan presentasi.
- Astro web framework for content-driven websites.
- EmDash CMS dapat menjadi content infrastructure, tetapi arsitektur tidak boleh tergantung secara eksklusif pada EmDash.
- Bootstrap menentukan ontology, navigation, route contract, discovery model, dan experience.
- CMS hanya menyediakan storage, taxonomy, relations, menus, dan content operations.
- a11y
- i18n
- WCAG newest
- Menerapkan Dynamic Style Archetypes yang didukung oleh User-Customizable Design Tokens, memungkinkan pengguna beralih antara gaya Minimalism/Brutalism sekaligus melakukan Granular Appearance Adjustments pada UI.
- install package Gaga Engine 0.4.0 (https://app.cloudsmith.com/gaga/r/gaga)
- Gaga Dynamic Global Notch context-aware (for Navigation, Action, etc)
- Sidebar Left and Sidebar Right Context-aware
---

# 1. ROOT HUMAN NAVIGATION

Canonical root:

```text
/
│
├── #Terbaru
│   ├── [20 publikasi terbaru]
│   └── Semua Publikasi → /latest
│
├── #Tersimpan
│   ├── [Daftar artikel tersimpan]
│   └── Semua Tersimpan → /saved
│
├── #Topik
│   ├── Pelaporan → /topics/pelaporan
│   ├── Teknologi → /topics/teknologi
│   ├── Anomali → /topics/anomali
│   └── Semua Topik → /topics
│
├── #Arsip
│   ├── 2026 → /archive/2026
│   ├── 2025 → /archive/2025
│   ├── 2024 → /archive/2024
│   └── Semua Arsip → /archive
│
├── #Pengetahuan
│   ├── Graf → /knowledge/graph
│   ├── Indeks → /knowledge/index
│   ├── Tag → /knowledge/tags
│   └── Referensi → /knowledge/references
│
├── #Tentang
│   ├── Tentang → /about
│   ├── Penulis → /about/author
│   ├── Dukungan → /about/support
│   └── Kontak → /about/contact
│
├── #Sistem
│   ├── Peta Situs → /system/sitemap
│   ├── RSS → /system/rss
│   └── Status → /system/status
│
├── #Legal
│   ├── Kebijakan Privasi → /legal/privacy
│   ├── Ketentuan Penggunaan → /legal/terms
│   ├── Penafian → /legal/disclaimer
│   └── Lisensi → /legal/license
│
└── #Sosial
    ├── LinkedIn → external
    ├── YouTube → external
    └── Reddit → external
```

`#Terbaru`, `#Topik`, dan section lainnya adalah root page sections/anchors, bukan parent route.

Canonical anchors dapat berupa:

```text
/#latest
/#saved
/#topics
/#archive
/#knowledge
/#about
/#system
/#legal
/#social
```

---

# 2. ROOT VISUAL GROUPING

Homepage tetap sederhana dan editorial.

```text
01 TERBARU

02
TERSIMPAN · TOPIK · ARSIP · PENGETAHUAN

03
TENTANG · SISTEM · LEGAL

04
SOSIAL
```

Label `02`, `03`, atau nama grouping seperti "Jelajah" dan "Informasi" tidak wajib tampil di UI.

Mereka dapat menjadi grouping konseptual internal saja.

Visual root sebaiknya menyerupai index/sitemap editorial, bukan marketing landing page.

Hindari pola default seperti:

```text
Hero besar
CTA besar
Featured cards
Newsletter banner
Marketing blocks
```

Prioritaskan:

```text
judul
nomor
daftar
struktur
hierarki
whitespace
navigation clarity
```

---

# 3. LATEST PUBLICATIONS

Root menampilkan maksimal sekitar 20 publikasi terbaru.

Contoh:

```text
01 Judul Publikasi
02 Judul Publikasi
03 Judul Publikasi
...
20 Judul Publikasi
```

Setelah itu:

```text
Semua Publikasi →
```

yang menuju:

```text
/latest
```

`/latest` hanyalah discovery view.

Canonical publication object tetap berada di:

```text
/publications
/publications/:slug
```

---

# 4. PUBLICATION SEBAGAI ROOT CONTENT OBJECT

Semua bentuk tulisan tetap dianggap:

```text
Publication
```

Contoh publication types:

```text
essay
note
analysis
research
guide
report
experiment
insight
case-study
commentary
etc.
```

Jangan menjadikan masing-masing sebagai root entity terpisah kecuali benar-benar mempunyai lifecycle dan contract yang berbeda.

Canonical model:

```text
Content Object
├── Publication
├── Author
├── Series
├── Curation
├── Reference
└── Page
```

Classification:

```text
Topic
Tag
```

Publication subtype:

```text
Publication
├── Essay
├── Note
├── Analysis
├── Research
├── Guide
├── Report
├── Experiment
├── Insight
├── Case Study
└── extensible...
```

`Blog` sebaiknya tidak dijadikan publication type secara default.

Blog lebih tepat diperlakukan sebagai publishing surface/channel yang dapat berisi berbagai Publication.

---

# 5. CANONICAL PUBLICATION MODEL

Minimum invariant:

```text
Publication
├── id
├── type
├── slug
├── title
├── status
├── publishedAt
├── updatedAt
├── authors[]
├── topics[]
├── tags[]
├── references[]
├── relations[]
└── content
```

Contoh:

```json
{
  "id": "pub_001",
  "type": "analysis",
  "slug": "mengapa-ai-bukan-bukti",
  "title": "Kecerdasan Buatan Boleh Membantu Pelaporan, tetapi Keluarannya Bukan Bukti",
  "status": "published",
  "publishedAt": "2026-10-19T10:00:00+07:00",
  "authors": ["author_001"],
  "topics": ["pelaporan", "teknologi"],
  "tags": ["ai", "evidence", "reporting"],
  "references": [],
  "relations": []
}
```

---

# 6. PUBLICATION TYPE REGISTRY

Jangan hardcode publication types ke komponen.

Gunakan registry/configuration.

Contoh:

```json
{
  "publicationTypes": [
    {
      "id": "essay",
      "label": "Esai",
      "enabled": true
    },
    {
      "id": "note",
      "label": "Catatan",
      "enabled": true
    },
    {
      "id": "analysis",
      "label": "Analisis",
      "enabled": true
    },
    {
      "id": "research",
      "label": "Riset",
      "enabled": true
    },
    {
      "id": "guide",
      "label": "Panduan",
      "enabled": true
    },
    {
      "id": "report",
      "label": "Laporan",
      "enabled": true
    },
    {
      "id": "experiment",
      "label": "Eksperimen",
      "enabled": true
    },
    {
      "id": "insight",
      "label": "Insight",
      "enabled": true
    },
    {
      "id": "case-study",
      "label": "Studi Kasus",
      "enabled": true
    }
  ]
}
```

Machine IDs harus stabil.

UI labels boleh berubah atau dilokalkan.

---

# 7. TOPIC MODEL

Canonical initial topics:

```text
Pelaporan
Teknologi
Anomali
```

Machine IDs:

```text
pelaporan
teknologi
anomali
```

Makna:

```text
Pelaporan
→ tata kelola, regulasi, proses, pengadaan, data, kualitas, dan praktik pelaporan

Teknologi
→ sistem, perangkat lunak, web, AI, arsitektur, dan rekayasa

Anomali
→ tulisan dengan perspektif, analogi, gaya, struktur, atau tema yang sengaja berada di luar pola umum, termasuk lateral, absurd, kontraintuitif, spekulatif, atau tidak konvensional
```

`Anomali` adalah topic editorial yang sah, bukan publication status.

Canonical topic routes:

```text
/topics
/topics/:slug
```

Contoh:

```text
/topics/pelaporan
/topics/teknologi
/topics/anomali
```

---

# 8. TOPIC CONFIGURATION

Jangan:

```ts
const topics = ["Pelaporan", "Teknologi", "Anomali"];
```

Gunakan konfigurasi:

```json
{
  "topics": [
    {
      "id": "pelaporan",
      "label": "Pelaporan",
      "enabled": true,
      "order": 1
    },
    {
      "id": "teknologi",
      "label": "Teknologi",
      "enabled": true,
      "order": 2
    },
    {
      "id": "anomali",
      "label": "Anomali",
      "enabled": true,
      "order": 3
    }
  ]
}
```

---

# 9. KNOWLEDGE MODEL

Canonical knowledge navigation:

```text
Pengetahuan
├── Graf
├── Indeks
├── Tag
└── Referensi
```

Semantics:

```text
Graf
→ relational view antar knowledge objects

Indeks
→ systematic/alphabetical knowledge index

Tag
→ granular descriptors lintas topic

Referensi
→ source/reference objects yang dapat menjadi first-class knowledge objects
```

Jangan samakan:

```text
Topik ≠ Tag
Indeks ≠ Peta Situs
Referensi ≠ sekadar daftar pustaka artikel
Graf ≠ dekorasi visual
```

---

# 10. RELATIONAL MODEL

Expected conceptual relations:

```text
Publication
│
├── taxonomy → Topic
├── taxonomy → Tag
│
├── relation → Author
├── relation → Series
├── relation → Curation
├── relation → Reference
└── relation → Publication
                 ↑
              related
```

Possible graph relationships:

```text
belongsTo
taggedWith
writtenBy
partOfSeries
includedIn
references
relatedTo
supersedes
respondsTo
```

Graph harus berasal dari relationship data nyata, bukan relasi visual palsu.

---

# 11. SERIES DAN CURATION

`Series` jangan diperlakukan sebagai Topic atau Tag.

Series adalah editorial sequence.

Contoh:

```text
Series
├── title
├── slug
├── description
├── publications[]
└── ordering
```

`Curation` adalah kumpulan editorial berdasarkan tujuan tertentu.

Public-facing label dapat tetap:

```text
Koleksi
```

Gunakan internal machine name:

```text
curation
curations
```

untuk menghindari konflik dengan istilah CMS `collection`.

---

# 12. ARCHIVE

Archive adalah temporal view, bukan ontology.

Canonical:

```text
/archive
/archive/:year
/archive/:year/:month
```

Contoh:

```text
/archive/2026
/archive/2026/10
```

Root hanya perlu menampilkan beberapa tahun terbaru.

---

# 13. SAVED

`Saved` adalah user state, bukan editorial taxonomy.

Canonical:

```text
/saved
```

Dapat dimulai dari:

```text
localStorage
```

dan berkembang ke:

```text
authenticated user state
server synchronization
cross-device sync
```

Jangan menyimpan Saved sebagai Topic, Tag, atau Publication collection editorial.

---

# 14. SYSTEM VS MACHINE INTERFACES

Human-facing:

```text
/system/sitemap
/system/rss
/system/status
```

Machine-facing:

```text
/sitemap.xml
/rss.xml
/robots.txt
```

Pemisahan:

```text
/system/sitemap
→ sitemap untuk manusia

/sitemap.xml
→ sitemap untuk crawler

/system/rss
→ halaman informasi/subscription UI

/rss.xml
→ feed aktual
```

Jika sitemap besar:

```text
/sitemap.xml
├── /sitemap-0.xml
├── /sitemap-1.xml
└── ...
```

---

# 15. CANONICAL ROUTE CONTRACT

```text
PUBLICATION
/publications
/publications/:slug

DISCOVERY
/latest
/saved

TOPIC
/topics
/topics/:slug

ARCHIVE
/archive
/archive/:year
/archive/:year/:month

KNOWLEDGE
/knowledge
/knowledge/graph
/knowledge/index
/knowledge/tags
/knowledge/tags/:slug
/knowledge/references
/knowledge/references/:slug

ABOUT
/about
/about/author
/about/support
/about/contact

SYSTEM
/system
/system/sitemap
/system/rss
/system/status

LEGAL
/legal
/legal/privacy
/legal/terms
/legal/disclaimer
/legal/license

MACHINE
/sitemap.xml
/rss.xml
/robots.txt
```

External social links tidak perlu dipaksakan menjadi internal routes.

---

# 16. SOFTCODED ARCHITECTURE

Prinsip:

```text
CORE CONTRACT
= strict

PRODUCT CONFIGURATION
= softcoded
```

Hardcoded hanya untuk invariants dan minimum validation.

Contoh core invariants:

```text
Publication harus memiliki:
- id
- type
- slug
- title
- status

Topic harus memiliki:
- id
- slug
- label
```

Softcoded/configurable:

```text
publication types
topics
tags
navigation
section order
labels
visibility
feature flags
route mappings
social links
homepage item limit
status page availability
RSS availability
knowledge features
locale labels
presentation preferences
```

---

# 17. NAVIGATION CONFIG

Jangan membangun navigation langsung dari JSX/template statis.

Gunakan registry/configuration.

Contoh:

```json
{
  "navigation": {
    "rootSections": [
      "latest",
      "saved",
      "topics",
      "archive",
      "knowledge",
      "about",
      "system",
      "legal",
      "social"
    ]
  }
}
```

Section:

```json
{
  "id": "knowledge",
  "label": "Pengetahuan",
  "enabled": true,
  "order": 5,
  "items": [
    "graph",
    "index",
    "tags",
    "references"
  ]
}
```

Dengan demikian ordering, visibility, label, dan membership dapat berubah tanpa mengedit komponen UI.

---

# 18. FEATURE FLAGS

Capability opsional sebaiknya dapat dimatikan tanpa menghapus contract.

Contoh:

```json
{
  "features": {
    "saved": true,
    "graph": true,
    "knowledgeIndex": true,
    "references": true,
    "rss": true,
    "status": false,
    "social": true
  }
}
```

UI hanya merender fitur yang enabled.

---

# 19. ROUTE REGISTRY

Route jangan tersebar sebagai string hardcoded di banyak komponen.

Gunakan canonical route registry/helper.

Concept:

```text
routes.publications.index
routes.publications.detail(slug)

routes.topics.index
routes.topics.detail(slug)

routes.archive.index
routes.archive.year(year)

routes.knowledge.graph
routes.knowledge.tags

routes.about.root

routes.system.sitemap

routes.legal.privacy
```

Tujuannya:

- single source of truth
- refactor mudah
- mencegah route drift
- memudahkan adapter CMS
- memudahkan testing
- mudah dipahami manusia dan AI

---

# 20. CMS BOUNDARY

Architecture harus:

```text
CMS-agnostic
```

Contoh:

```text
Knowledge Publication System
            │
            ▼
      Content Contract
            │
     ┌──────┼───────┐
     │      │       │
 EmDash   Local   Future CMS
 Adapter  Adapter    Adapter
```

EmDash dapat digunakan untuk:

```text
content
taxonomies
relations
menus
authors
references
search dasar
editorial operations
```

Tetapi jangan membuat:

```text
Knowledge Publication System = EmDash theme
```

Bootstrap harus tetap dapat hidup tanpa EmDash.

---

# 21. PRINCIPLE OF OWNERSHIP

Gunakan boundary berikut:

```text
Bootstrap owns:
- ontology
- human navigation
- route contract
- discovery model
- page composition
- visual presentation
- knowledge graph presentation
- saved UX
- feature configuration

CMS owns:
- content persistence
- editorial CRUD
- taxonomy persistence
- relation persistence
- menu/config persistence jika tersedia
- revision/workflow sesuai capability CMS
```

---

# 22. DESIGN PRINCIPLE

North Star:

> Setiap knowledge object harus dapat ditemukan melalui lebih dari satu jalur yang bermakna, tetapi setiap jalur navigasi harus memiliki fungsi yang jelas dan tidak tumpang tindih.

Semantics:

```text
Topic       = classification
Tag         = descriptor
Series      = editorial sequence
Curation    = editorial grouping
Archive     = time
Search      = retrieval
Graph       = relationships
Index       = systematic enumeration
Saved       = personal retrieval
```

---

# 23. IMPLEMENTATION RULE

Saat mengiterasi repository:

1. Audit implementation saat ini.
2. Jangan langsung rewrite jika struktur existing dapat dipertahankan.
3. Pisahkan invariant dari configuration.
4. Buat canonical content model.
5. Buat publication type registry.
6. Buat topic registry.
7. Buat navigation registry.
8. Buat route registry.
9. Buat feature flags.
10. Pastikan komponen membaca config, bukan hardcoded values.
11. Pastikan route dan canonical ID stabil.
12. Pastikan optional feature dapat di-disable secara aman.
13. Jangan membuat abstraction tanpa kebutuhan nyata.
14. Jangan membuat CMS-specific logic masuk ke presentation layer.
15. Pertahankan progressive enhancement dan Web Platform-first behavior jika memungkinkan.
16. Pastikan schema, type definitions, runtime validation, dan UI configuration tidak saling drift.
17. Tambahkan test untuk invariant penting dan route generation.
18. Dokumentasikan keputusan arsitektur yang tidak jelas dari kode.

---

# 24. TARGET END STATE

Target akhirnya:

```text
STRICT CORE
+
SOFTCODED PRODUCT CONFIG
+
CMS ADAPTER
+
HUMAN NAVIGATION
+
KNOWLEDGE RELATIONS
+
STABLE ROUTES
+
EXTENSIBLE PUBLICATION TYPES
```

Dengan karakter:

```text
scalable
configurable
adjustable
extensible
softcoded
provider-neutral
CMS-agnostic
human-readable
AI-readable
machine-validatable
maintainable
predictable
```

Jangan optimalkan hanya untuk implementasi saat ini.

Bangun sebagai reusable **Knowledge Publication Website Bootstrap** yang dapat digunakan untuk situs kecil maupun berkembang menjadi ribuan publikasi tanpa memerlukan perubahan ontology dan navigation fundamental.