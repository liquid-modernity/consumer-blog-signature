# Rencana Implementasi Mockup UI & Tata Letak 4 Babak Beranda

Rencana ini menerjemahkan keempat gambar mockup ke dalam arsitektur komponen Astro, sistem gaya SCSS, dan runtime interaktif PakRPP secara menyeluruh di seluruh halaman.

---

## 1. Tema Default Kertas & Bingkai UI Global (Semua Halaman)

- **Tema Kertas (`paper`) sebagai Default Global**:
  - Mengubah `defaultTheme` di `src/config/theme.ts`, `src/config/reader.ts`, dan variabel `:root` di `src/styles/tokens.css` agar menggunakan palet terang bersih hangat (`#F7F6F2` / `#F4F3EF`) dengan teks tinta gelap (`#181816`) dan permukaan tanpa garis grid latar.
  - Pengguna tetap dapat mengganti tema kapan saja melalui panel **Token & Tampilan** di Gaga Notch.
- **Notch Atas (`ActionRuntime.astro` & `_action-island.scss`)**:
  - Menyesuaikan tampilan kapsul (pill) hitam kontras tinggi (`#111110` dengan teks putih bersih `#F7F6F2`) tepat di tengah atas layar dengan ikon lingkaran dan identitas `PakRPP` sesuai mockup.
  - Saat diklik atau diarahkan kursor, kapsul tetap dapat membuka panel navigasi, pencarian, dan kustomisasi **Token & Tampilan**.
- **Tombol Sudut Kiri Atas & Kanan Atas (`LeftRail.astro` & `RightInfoRail.astro`)**:
  - Kedua rail di kiri dan kanan diatur dalam status terlipat (`collapsed`) dengan latar belakang transparan sehingga hanya menampilkan ikon tombol garis (`≡`) minimalis di sudut kiri atas dan kanan atas sesuai mockup.
  - Keduanya disiapkan sebagai wadah *context-aware* yang saat ini dikosongkan (`LeftRail` dan `RightInfoRail` tidak lagi menampilkan blok daftar isi atau panel samping yang memakan ruang baca).

---

## 2. Pemindahan Table of Contents ke "Gaga Dynamic Outline Peek" (Pill Bawah)

- **Aktif di Semua Ukuran Layar (Mobile, Tablet, dan Desktop)**:
  - Menghapus pembatasan `@media (min-width: 64rem) { display: none !important; }` pada `src/components/frame/ArticleOutlinePeek.astro`.
  - Memperbarui `src/scripts/systems/outline-peek.ts` agar `isAvailable` mengaktifkan **Gaga Dynamic Outline Peek** pada mode `desktop` dan `tablet-large` selain `mobile` dan `tablet-mini`.
  - Memindahkan fungsi **Table of Contents (Daftar Isi)** sepenuhnya dari `RightInfoRail.astro` ke komponen kapsul bawah `ArticleOutlinePeek.astro`.
- **Desain Kapsul Hitam Bawah Sesuai Mockup**:
  - Menata `.gaga-outline-peek-preview` di `src/styles/partials/_outline-peek.scss` menjadi kapsul hitam kontras tinggi di tengah bawah layar (`Gaga Dynamic Outline Peek`) yang menampilkan posisi baca/bagian aktif dan membuka panel Daftar Isi (Table of Contents) saat diklik.
  - Di halaman **Beranda (`/`)**, kapsul bawah ini memuat daftar isi 4 babak utama (`01 Publikasi`, `02 Eksplorasi & Tersimpan`, `03 Tentang, Sistem & Legal`, `04 Sosial`) untuk melompat antar layar, sedangkan di halaman **Artikel & Sub-halaman** memuat struktur subjudul (`H2`/`H3`) halaman tersebut.

---

## 3. Implementasi 4 Layar Penuh (`scroll-snap`) di Beranda (`EditorialFront.astro`)

Mengatur `.gaga-main-region:has([data-pakrpp-root-index])` dengan `scroll-snap-type: y mandatory` dan setiap `.pakrpp-viewport-stage` berukuran `100dvh` (`scroll-snap-align: start`) tanpa garis pembatas horizontal maupun garis pohon kiri:

1. **Layar 1 — Daftar 20 Publikasi (`1_08edb1cd.png`)**:
   - Menghapus judul besar `<h1>PakRPP</h1>` di dalam kanvas (karena sudah diwakili oleh pill notch atas).
   - Menampilkan daftar bernomor `01` s.d. `20` secara bersih tanpa garis bawah per baris, dengan kepadatan vertikal yang terkalibrasi agar ke-20 judul beserta tautan bawah muat utuh dalam satu layar penuh (`100dvh`).
   - Bagian bawah daftar menampilkan `Semua Publikasi →` di sisi kiri dan `Indeks Objek Publikasi →` di sisi kanan (`justify-content: space-between`).
2. **Layar 2 — Topik, Arsip, Pengetahuan & Tersimpan (`2_4c136fda.png`)**:
   - Baris atas: Grid 3 kolom bersih tanpa border untuk **Topik** (`Pelaporan · 3 publikasi`, `Teknologi · 5 publikasi`, `Anomali · 3 publikasi`, `Semua Topik →`), **Arsip** (`2026 · 7 publikasi`, `2025 · 0 publikasi`, `2024 · 0 publikasi`, `Semua Arsip →`), dan **Pengetahuan** (`Graf`, `Indeks`, `Tag`, `Referensi`, `Ikhtisar Pengetahuan →`).
   - Baris bawah: Bagian **Tersimpan** ditempatkan terpusat (`text-align: center`) di bawah grid 3 kolom, lengkap dengan pesan status simpanan dan tautan `Semua Tersimpan →`.
3. **Layar 3 — Tentang, Sistem & Legal (`3_b7c3348c.png`)**:
   - Grid 3 kolom terpusat di tengah layar penuh tanpa garis kotak/border:
     - **Tentang**: `Tentang`, `Penulis`, `Dukungan`, `Kontak`
     - **Sistem**: `Peta Situs`, `RSS`, `Status`
     - **Legal**: `Kebijakan Privasi`, `Ketentuan Penggunaan`, `Penafian`, `Lisensi`
4. **Layar 4 — Kanal Sosial (`4_bb5f39c1.png`)**:
   - Tanpa judul seksi `Sosial`, langsung menampilkan baris 3 kolom terpusat secara vertikal dan horizontal:
     - `LinkedIn` `in/pakrpp`
     - `YouTube` `@pakrpp`
     - `Reddit` `u/pakrpp`

---

## 4. File yang Akan Dimodifikasi

- `src/config/theme.ts`, `src/config/reader.ts`, & `src/styles/tokens.css`: Mengatur tema default ke `paper` (latar kertas terang hangat) di seluruh halaman.
- `src/components/frame/ActionRuntime.astro` & `src/styles/partials/_action-island.scss`: Penyesuaian kapsul hitam atas `PakRPP` sesuai proporsi mockup.
- `src/components/frame/LeftRail.astro`, `src/components/frame/RightInfoRail.astro`, `src/styles/partials/_left-rail.scss`, & `src/styles/partials/_right-rail.scss`: Mengosongkan isi rail kiri/kanan (context-aware kosong) dan menampilkan pemicu ikon `≡` bersih di sudut kiri/kanan atas.
- `src/components/frame/ArticleOutlinePeek.astro`, `src/components/gaga/PageFrame.astro`, `src/components/frame/StandaloneAppFrame.astro`, `src/scripts/systems/outline-peek.ts`, & `src/styles/partials/_outline-peek.scss`: Memindahkan Table of Contents dari sidebar kanan ke pill bawah `Gaga Dynamic Outline Peek` untuk desktop, tablet, dan mobile.
- `src/components/reader/EditorialFront.astro`: Merombak tata letak 4 layar penuh (`scroll-snap`) sesuai presisi visual keempat gambar mockup.
