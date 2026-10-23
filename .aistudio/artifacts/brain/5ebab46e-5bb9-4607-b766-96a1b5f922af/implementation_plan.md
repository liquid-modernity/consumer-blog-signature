# Rencana Implementasi: Clean Minimalism & Rich Features pada Seluruh Section Beranda

## Tujuan & Arah Desain
Menyederhanakan tampilan antarmuka halaman beranda (`EditorialFront.astro`) agar selaras dengan filosofi **Clean Minimalism, Rich Features**:
- Bebas dari ornamen repetitif seperti pembatas grup bernomor (`02`, `03`, `04`), footer navigasi *stage cue* di bawah setiap *stage*, *badge* status sekunder, dan *path* URL dekoratif pada kartu.
- Tetap mempertahankan pembagian tinggi layar penuh (*full-viewport stage* `100dvh`) serta seluruh kapabilitas interaktif (sinkronisasi *stage* aktif dengan *Dynamic Notch Island* & *Left Rail*, *hover preview* ke panel kanan, penyimpanan *bookmark* lokal di `Tersimpan`, serta navigasi keyboard/scroll).

---

## Lingkup Perubahan (`src/components/reader/EditorialFront.astro`)

### 1. Penghapusan Header Divider Bernomor (`.pakrpp-group-divider`) di Semua Stage
Menghapus elemen `<div class="pakrpp-group-divider">` pada seluruh *stage* yang tersisa:
- **Stage 02 (`#stage-02`)**: Menghapus blok `02 · TERSIMPAN · TOPIK · ARSIP · PENGETAHUAN`.
- **Stage 03 (`#stage-03`)**: Menghapus blok `03 · PENULIS · PROYEK · METODOLOGI · KONTAK`.
- **Stage 04 (`#stage-04`)**: Menghapus blok `04 · KEBIJAKAN · LISENSI · PETA SITUS`.

### 2. Penghapusan Footer Navigasi Stage (`.pakrpp-stage-cue`) di Semua Stage
Menghapus elemen `<footer class="pakrpp-stage-cue">` di bagian bawah setiap *stage*:
- **Stage 02 (`#stage-02`)**: Menghapus footer `02 / 04 · EKSPLORASI` beserta tautan lompatan `↑ 01 Terbaru` dan `↓ 03 Konteks`.
- **Stage 03 (`#stage-03`)**: Menghapus footer `03 / 04 · KONTEKS` beserta tautan lompatan `↑ 02 Eksplorasi` dan `↓ 04 Sistem`.
- **Stage 04 (`#stage-04`)**: Menghapus footer `04 / 04 · SISTEM` beserta tautan lompatan `↑ 03 Konteks` dan `↑↑ 01 Ke Atas`.

### 3. Pembersihan Badge Status & Path URL Dekoratif
Menghilangkan elemen visual sekunder yang menambah beban visual tanpa mengurangi informasi inti maupun fungsi klik/hover:
- **Header Sub-Section (`.pakrpp-section-tag`)**:
  - Menghapus *badge* dekoratif di samping judul sub-section pada `#saved` (`0 tersimpan` di header tetap disinkronkan secara internal bila diperlukan atau disederhanakan tanpa *pill*), `#topics` (`3 klasifikasi`), `#archive` (`Temporal`), dan `#knowledge` (`Relasional`).
- **Kartu Arsip & Pengetahuan (`#archive` & `#knowledge`)**:
  - Menghapus *badge* status di pojok kartu (`Indeks Penuh`, `Peta Relasi`, `Direktori A–Z`, `24 Entri`, `Sitasi & Pustaka`).
  - Menghapus teks *path* URL monospasi dekoratif (`/publications`, `/knowledge/graph`, `/knowledge/index`, `/knowledge/tags`, `/knowledge/references`) sehingga kartu hanya menampilkan judul yang bersih dan deskripsi esensial.
- **Kartu Konteks & Sistem (`#stage-03` & `#stage-04`)**:
  - Menghapus teks *path* URL dekoratif (`/about`, `/projects`, `/methodology`, `/contact`, `/legal/privacy`, `/legal/license`, `/system/sitemap`) dari permukaan kartu agar fokus pada judul dan deskripsi ringkas.

### 4. Pelestarian Struktur Full-Viewport & Rich Features
- **Tata Letak Full-Viewport (`100dvh`)**: Setiap `#stage-01` hingga `#stage-04` tetap mempertahankan `min-height: calc(100dvh - 3.5rem)` dengan perataan ruang yang proporsional.
- **Fitur Interaktif Utuh**:
  - Atribut `data-pakrpp-viewport-stage="01".."04"` dan `data-stage-label` tetap dipertahankan pada kontainer *stage* agar indikator *Dynamic Notch Island* dan *IntersectionObserver* tetap bekerja akurat.
  - Atribut `data-pakrpp-preview-*` pada setiap kartu dan item publikasi tetap dipertahankan untuk fitur *rich preview* instan.
  - Fungsionalitas daftar `Tersimpan` (`localStorage` reader state) tetap berfungsi penuh.
- **Pembersihan CSS**: Menghapus aturan CSS `.pakrpp-group-divider`, `.pakrpp-stage-cue`, `.pakrpp-section-tag`, `.pakrpp-card-badge`, dan `.pakrpp-card-route` yang tidak lagi digunakan di `EditorialFront.astro`.

---

## Verifikasi
1. Menjalankan `compile_applet` dan memastikan *build* Astro serta pengujian arsitektur (`tools/hardening.test.mjs`) lulus tanpa error.
2. Memastikan tampilan setiap *stage* (`#stage-01` s.d. `#stage-04`) tampil bersih, minimalis, dan seluruh fitur interaktif tetap berjalan mulus.
