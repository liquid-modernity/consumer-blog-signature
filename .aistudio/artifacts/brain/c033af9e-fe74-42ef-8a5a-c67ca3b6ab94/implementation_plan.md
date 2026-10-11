# Implementation Plan: Hardware-Aware Notch & Dynamic Island Action Bar (.gaga-notch-island-action)

Menghemat ruang vertikal layar pada mobile portrait (smartphone) dan tablet mini dengan memproyeksikan action bar langsung ke area fisik hardware notch / Dynamic Island menggunakan safe-area insets (`env(safe-area-inset-top)`), serta bertransisi mulus menjadi inline header navigasi standar pada viewport desktop/tablet large.

---

## 1. Problem Statement & Architecture Goals

### Problem
- Pada perangkat mobile modern (iPhone notch/Dynamic Island, Android punch-hole), header konvensional memakan ruang vertikal yang berharga (3.5rem - 4.5rem di bawah safe area).
- Hal ini mengurangi area baca (reading canvas) di mobile portrait dan tablet mini.
- Menempatkan elemen interaktif di area notch rawan memicu **dead-zone block**: jika wrapper menutupi notch tanpa konfigurasi pointer-events yang benar, sentuhan layar dan scroll atas akan terblokir.

### Architecture Solution: `.gaga-notch-island-action`
1. **Desktop & Tablet Large (`min-width: 1024px`)**:
   - Berfungsi sebagai **standard inline/flex header**.
   - Tinggi standar, background solid elevated, border-bottom pemisah, pointer-events normal (`pointer-events: auto`).
2. **Mobile Portrait & Tablet Mini (`max-width: 1023px and (orientation: portrait)`)**:
   - Posisi `fixed` menempel ke puncak layar (`top: 0`, `left: 0`, `right: 0`).
   - Ketinggian diatur secara presisi menyesuaikan `env(safe-area-inset-top, 0px)`.
   - Latar belakang transparan (`background: transparent`), border-bottom dihilangkan.
   - **Interaction Guardrail**: Wrapper menggunakan `pointer-events: none` sehingga area fisik notch tidak memblokir sentuhan/gesture sistem, sedangkan child actions / island buttons secara eksplisit mengaktifkan `pointer-events: auto`.
   - Mengelompokkan aksi di sayap kiri dan kanan notch atau kapsul Dynamic Island tengah (`center notch island aware`).

---

## 2. Output & Deliverables

1. **Pure Vanilla CSS Block**:
   - Modern CSS Custom Properties (`:root`).
   - Fallback mechanics untuk lingkungan tanpa dukungan `env()` atau browser legacy.
   - Guardrail hitbox pointer-events.
2. **SCSS (SASS) Partial Block**:
   - Mixin responsif khusus `@mixin gaga-mobile-notch-view`.
   - Mengombinasikan `max-width: $tablet-mini-max` (1023px) dan `orientation: portrait`.
   - Variabel breakpoint terintegrasi dengan arsitektur sistem (`_breakpoints.scss`).
3. **Komponen Reusable & Integrasi Proyek**:
   - File partial SCSS: `src/styles/partials/_notch-island-action.scss`.
   - Registrasi di `src/styles/signature.scss`.
   - Komponen Astro standalone: `src/components/navigation/NotchIslandAction.astro`.
   - Integrasi ke `AppFrameBase.astro` / primary layout blog untuk menghemat ruang vertikal di seluruh halaman dan artikel.

---

## 3. Verification Plan

### Automated Build & Syntax Checks
- Run `compile_applet` untuk memastikan Astro & Sass compiler memvalidasi SCSS partial dan markup.
- Run `lint_applet` dan `npm run check` untuk memverifikasi type-safety pada komponen baru.

### Responsive & Safe-Area Verification
- Verifikasi desktop (`>= 1280px` & `1024px - 1279px`): Header inline dengan layout horizontal, solid background.
- Verifikasi tablet mini & mobile portrait (`<= 1023px` portrait): Fixed safe-area bar, transparent wrapper, child interactive buttons, tidak ada layout shift atau dead-zone scroll block.
- Verifikasi mobile landscape: Tetap menjaga fleksibilitas tanpa memaksakan safe-area portrait.
