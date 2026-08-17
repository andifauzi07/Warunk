# Automated Testing Specification

## Purpose

Mendefinisikan strategi pengujian bertingkat untuk memastikan perilaku aplikasi diverifikasi di seluruh lapisan: logika murni (unit), komponen Vue (component), dan perjalanan pengguna utuh (E2E terhadap Supabase local) — sekaligus memastikan setiap perbaikan yang diarsipkan dan kontrak refactoring dilindungi oleh test regresi yang permanen.

## ADDED Requirements

### Requirement: Test Runner dan Perintah Resmi

Sistem SHALL menyediakan perintah pengujian yang berfungsi dan terdokumentasi. Perintah unit/component adalah `bun run test` (Vitest). README SHALL tidak lagi mendokumentasikan `bun test` sebagai perintah yang valid, karena runner bun native gagal me-resolve alias `@/`.

#### Scenario: Perintah unit/component berfungsi

- **WHEN** pengembang menjalankan `bun run test`
- **THEN** seluruh test unit dan component berjalan via Vitest dan me-resolve alias `@/` dengan benar

#### Scenario: README mencerminkan perintah valid

- **WHEN** pengembang membaca bagian Testing di README
- **THEN** perintah yang tertera adalah `bun run test`, `bun run test:unit`, `bun run test:component`, dan `bun run test:e2e` — bukan `bun test`

### Requirement: Cakupan Unit Test Logika Murni

Sistem SHALL memiliki unit test untuk seluruh fungsi murni: `engine.ts`, `format.ts`, dan `sessionNavigation.ts`. Hasil kalkulasi engine SHALL sesuai contoh PRD §3.4 dan menangani kasus tepi (stok 0, modal belum diisi/fallback estimasi, konsumsi sendiri, porsi negatif ter-clamp).

#### Scenario: Engine sesuai contoh PRD

- **WHEN** engine diuji dengan carry-over 5 porsi HPP 6.000, masak baru 20 porsi modal 140.000
- **THEN** stok aktif = 25, HPP gabungan = 6.800, dan agregat profit konsisten dengan PRD

#### Scenario: Format dan navigasi memiliki unit test

- **WHEN** `format.ts` dan `sessionNavigation.ts` diuji
- **THEN** `tambahHari` lintas batas bulan/tahun, `pesanError` (Error / `{message}` / `{details}` / unknown), dan aturan `arahkanKe` ter-cover

### Requirement: Cakupan Component Test

Sistem SHALL memiliki component test (Vitest + `@vue/test-utils` + happy-dom) untuk `Stepper`, `RingkasanHarianCard`, `InputPagiView`, `InputMalamView`, dan `DashboardView` — memverifikasi validasi, transisi mode (input/review/terkunci), dan perilaku non-blokir saat ganti rentang.

#### Scenario: Stepper membatasi rentang

- **WHEN** tombol `+`/`−` pada Stepper ditekan melampaui `min`/`max`
- **THEN** nilai ter-clamp dan `v-model` diperbarui

#### Scenario: Input Malam memblokir simpan saat opname melebihi stok

- **WHEN** sisa layak + rusak + konsumsi sebuah lauk melebihi stok aktif
- **THEN** baris ditandai merah, tombol simpan dinonaktifkan, dan pesan validasi muncul

#### Scenario: Toggle makan sendiri mengontrol kolom konsumsi

- **WHEN** pengguna mematikan "makan sendiri" pada sesi malam
- **THEN** kolom Dimakan Sendiri disembunyikan dan dihitung 0

#### Scenario: Hari terkunci menampilkan mode read-only

- **WHEN** Input Malam dibuka pada hari berstatus `malam_selesai`
- **THEN** sistem menampilkan ringkasan read-only tanpa kontrol edit dan tanpa tombol simpan

#### Scenario: Ganti rentang dashboard tidak menghilangkan konten

- **WHEN** pengguna mengganti rentang 7 ↔ 30 hari di dashboard
- **THEN** data rentang sebelumnya tetap tampil, loading per-panel (bukan global), dan tombol toggle tetap dapat diklik

### Requirement: Cakupan End-to-End Test

Sistem SHALL memiliki E2E test (Playwright) terhadap build produksi + Supabase local yang memverifikasi perjalanan satu hari penuh dan navigasi berbasis sesi.

#### Scenario: Perjalanan satu hari penuh berhasil

- **WHEN** pengguna login, mengisi input pagi (carry-over layak/basi, masak baru, modal), lalu mengisi input malam (opname, uang laci) dan mengunci hari
- **THEN** status hari berubah `pagi_pending` → `pagi_selesai` → `malam_selesai`, ringkasan tampil inline, dan dashboard menampilkan profit serta selisih kas

#### Scenario: Validasi gagal memblokir penyimpanan

- **WHEN** pengguna mengisi opname melebihi stok atau membiarkan uang laci kosong lalu menekan simpan
- **THEN** penyimpanan ditolak dengan pesan yang jelas

#### Scenario: Navigasi berbasis sesi berfungsi

- **WHEN** pengguna yang belum login membuka halaman terlindung atau pengguna login membuka `/login`
- **THEN** pengguna diarahkan ke halaman yang tepat (`/login` atau halaman utama)

#### Scenario: Hari libur dapat dibuka kembali

- **WHEN** pengguna menandai hari libur lalu membuka warung pada hari yang sama
- **THEN** aksi "Buka Lagi" mengubah status menjadi `pagi_pending` dan mengizinkan input pagi

### Requirement: Cakupan Regression Test dari Riwayat Perbaikan

Sistem SHALL memiliki test regresi permanen untuk setiap perbaikan yang diarsipkan di `openspec/changes/archive/` dan untuk kontrak refactoring `clean-code-refactor`, sehingga bug yang sudah diperbaiki tidak muncul kembali tanpa terdeteksi.

#### Scenario: Payload simpan membawa state baris lengkap

- **WHEN** simpan pagi/malam mengirim baris yang sudah ada
- **THEN** payload menyertakan `user_id`, `rekonsiliasi_id`, `lauk_id`, dan seluruh kolom NOT NULL/CHECK sehingga penulisan lolos RLS (regresi `fix-simpan-pagi-error-403`)

#### Scenario: Upsert pengaturan tidak menduplikasi

- **WHEN** `upsertPengaturan` dipanggil berkali-kali untuk user yang sama
- **THEN** hanya satu baris `pengaturan_warung` yang ada (regresi `fix-pengaturan-upsert`) — diverifikasi via alur E2E terhadap Supabase local

#### Scenario: Sesi login/logout tidak race

- **WHEN** user login dan status sesi diperbarui
- **THEN** navigasi guard dan watcher `useAuthGuard` menghasilkan keputusan yang identik dengan `arahkanKe` (regresi `fix-session-race`)

#### Scenario: Kontrak refactoring teruji

- **WHEN** `clean-code-refactor` selesai dan `toItemKalkulasi`/payload/`RingkasanHarianCard` diuji
- **THEN** payload simpan dan output Ringkasan identik dengan sebelum refactoring (kontrak `refactoring-contract`)

### Requirement: Gerbang CI

Sistem SHALL memiliki workflow GitHub Actions yang menjalankan type-check dan seluruh test unit + component pada setiap push/PR.

#### Scenario: CI unit+component selalu hijau sebagai gerbang

- **WHEN** ada push/PR ke repository
- **THEN** job CI menjalankan `type-check` dan `bun run test`; job gagal menghentikan merge