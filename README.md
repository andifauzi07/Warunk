# Warunk — Rekonsiliasi Mundur untuk Warung Nasi Campur

> **"Kita tidak perlu tahu siapa membeli apa. Kita cukup tahu apa yang hilang dari stok, dan itu adalah apa yang terjual."**

Warunk adalah **Progressive Web App (PWA) mobile-first** yang membantu pemilik warung nasi campur tradisional menghitung **keuntungan bersih harian secara otomatis**, tanpa mengganggu kecepatan pelayanan di jam sibuk.

Tidak seperti POS konvensional yang mencatat _setiap transaksi_ di kasir (terbukti gagal karena memperlambat antrean saat ramai), aplikasi ini memakai pendekatan **Backward Reconciliation (Rekonsiliasi Mundur)**: sistem tidak pernah mencatat apa yang dijual — ia menghitung apa yang **habis dikonsumsi** dengan membandingkan stok awal (pagi) dan stok akhir (malam) dari setiap jenis lauk.

| Teknologi      | Keterangan                                           |
| -------------- | ---------------------------------------------------- |
| Frontend       | Vue 3 (Composition API) + TypeScript + Vite          |
| Styling        | Tailwind CSS 4                                       |
| PWA            | `vite-plugin-pwa` (installable, auto-update)         |
| Backend & Auth | Supabase (PostgreSQL 17 + Auth + Row Level Security) |
| Server State   | TanStack Query for Vue (cache, dedupe, invalidate)   |
| Client State   | Pinia (sesi auth & tanggal aktif)                    |
| Testing        | Vitest (unit + component), Playwright (E2E)        |

---

## Daftar Isi

- [Masalah yang Diselesaikan](#masalah-yang-diselesaikan)
- [Fitur Utama](#fitur-utama)
- [Alur Kerja Tiga Fase](#alur-kerja-tiga-fase)
- [Logika Kalkulasi Inti](#logika-kalkulasi-inti)
- [Arsitektur Teknis](#arsitektur-teknis)
- [Struktur Proyek](#struktur-proyek)
- [Skema Database](#skema-database)
- [Sesi & Navigasi](#sesi--navigasi)
- [Strategi Data Fetching](#strategi-data-fetching)
- [Testing](#testing)
- [Setup & Pengembangan](#setup--pengembangan)
- [Spec-Driven Development](#spec-driven-development)

---

## Masalah yang Diselesaikan

Pemilik warung nasi campur hampir **tidak pernah tahu profit bersih harian** secara akurat, karena:

- **HPP bahan baku bersifat fluktuatif** — harga pasar berubah setiap hari.
- **Kombinasi pesanan sangat acak** — nasi campur adalah kombinasi bebas dari banyak jenis lauk, mustahil dicatat manual per transaksi saat ramai.
- **POS konvensional gagal diterapkan** — menambah waktu antre di kasir pada jam sibuk (_validated failure_).
- **Tidak ada deteksi kebocoran uang** — selisih antara uang fisik di laci dengan uang yang seharusnya ada tidak pernah terukur.
- **Kerugian basi/rusak tidak tercatat** — stok yang busuk "hilang" begitu saja dari perhitungan.

Warunk menggeser seluruh beban input ke **waktu senggang pemilik** — pagi sebelum buka dan malam setelah tutup — sehingga jam operasional (siang) berjalan 100% normal tanpa aplikasi.

---

## Fitur Utama

Semua fitur di bawah ini dispesifikasikan secara _spec-driven_ di folder [`openspec/specs/`](openspec/specs/).

### 🔐 User Auth — Autentikasi Single-Owner

Login email/password via Supabase Auth untuk satu pemilik warung. Data dilindungi **Row Level Security**: setiap akun hanya bisa membaca/menulis baris datanya sendiri.

### 🥗 Master Lauk — CRUD Daftar Lauk/Masakan

Tambah/edit/hapus jenis lauk (nama, harga jual per porsi, HPP estimasi). Lauk musiman bisa **dinonaktifkan** tanpa menghapus riwayat datanya — harga & HPP di-_snapshot_ saat hari dikunci sehingga data historis tidak berubah.

### 🌅 Input Pagi — Baseline Stok Hari Ini

Menampilkan **carry-over** (sisa lauk kemarin yang layak jual) secara otomatis sebagai baris awal. Pemilik mengonfirmasi per lauk **"Masih Layak Jual"** atau **"Basi — Catat Rugi"**, lalu menambah **porsi masak baru** + **total modal bahan** menggunakan stepper besar (bukan keyboard). Tombol tunggal "Selesai Input Pagi" mengubah status hari menjadi `pagi_selesai`.

### 🌙 Input Malam — Opname & Kunci Hari

Opname tiga kolom per lauk: **Sisa Layak Jual**, **Porsi Rusak**, dan **Dimakan Sendiri** (muncul hanya jika pemilik menandai "hari ini makan sendiri"). Ditambah input **Total Uang di Laci** dan **Uang Digital** (jika warung menerima pembayaran digital). Tombol **"Simpan & Kunci"** mengunci hari (`malam_selesai`) dan langsung menampilkan ringkasan — setelah terkunci, data tidak dapat berubah.

### 📴 Hari Libur — Deklarasi Eksplisit

Setiap hari default-nya hari buka. Pemilik dapat mendeklarasikan hari libur (state ke-4) sehingga sistem tidak menuntut input. **Carry-over melompati hari libur** (sisa Sabtu menunggu sampai Senin) dan hanya dihitung rugi saat diperiksa di hari operasional berikutnya. Dashboard membedakan **libur** vs **lupa input**.

### 📊 Dashboard Analitik — "Untung Berapa Hari Ini?"

- **Ringkasan Hari Ini**: pendapatan estimasi, HPP nyata, kerugian, profit, selisih kas — tampil dalam < 10 detik.
- **Detektor Selisih Kas**: indikator warna (🟢 aman / 🟡 waspada / 🔴 kritis) berdasarkan ambang toleransi yang bisa dikonfigurasi.
- **Tren profit** 7 & 30 hari (grafik bar) dengan penanda khusus untuk hari libur dan gap "lupa input".
- **Ranking lauk** terlaris & paling sering basi untuk menyesuaikan jumlah masak besok.

### ⚙️ Pengaturan Warung

Modal kembalian (float) sebagai nilai default — di-**snapshot per hari** saat simpan malam agar hari terkunci bebas bias perubahan setting. Ambang toleransi selisih kas (%), dan toggle penerimaan pembayaran digital.

---

## Alur Kerja Tiga Fase

```
FASE 1 · PAGI (sebelum buka)          FASE 2 · SIANG (jam operasional)        FASE 3 · MALAM (setelah tutup)
┌─────────────────────────────┐       ┌─────────────────────────────┐        ┌─────────────────────────────┐
│ Baseline stok hari ini      │       │ Warung beroperasi NORMAL    │        │ Rekonsiliasi mundur         │
│ • Carry-over otomatis       │  ──►  │ tanpa aplikasi              │  ──►   │ • Opname per lauk           │
│ • Layak / Basi (catat rugi) │       │ tanpa mencatat transaksi    │        │ • Uang laci + digital       │
│ • Porsi masak baru + modal  │       │ uang mengalir seperti biasa  │        │ • HPP gabungan (weighted)   │
└─────────────────────────────┘       └─────────────────────────────┘        │ • Kunci hari → ringkasan    │
                                                                              └─────────────────────────────┘
```

**Fase 1 — PAGI (± 05.00–08.00):** Tetapkan baseline stok. Carry-over kemarin tampil otomatis, dikonfirmasi layak atau dicatat basi (rugi langsung). Tambah porsi masak baru + modal bahan (opsional, boleh diisi belakangan).

**Fase 2 — SIANG (08.00–20.00):** Tidak ada input apa pun. Warung melayani pembeli seperti biasa, uang mengalir ke laci kasir. Aplikasi tidak ikut campur.

**Fase 3 — MALAM (± 20.00–21.00):** Hitung mundur. Catat sisa layak jual (untuk carry-over besok), porsi rusak, dan porsi dimakan sendiri. Input satu angka total uang di laci. Sistem menghitung porsi terjual = **Stok Aktif Awal − Sisa − Rusak − Dimakan Sendiri**, lalu menampilkan ringkasan profit & deteksi kebocoran.

---

## Logika Kalkulasi Inti

Implementasi murni ada di [`src/lib/engine.ts`](src/lib/engine.ts) — pure functions yang dipakai untuk _live feedback_ di UI, sedangkan nilai final dikunci di database via generated columns & trigger.

```
[Stok Aktif Awal] = ( [Porsi Carry-Over] − [Porsi Basi Pagi] ) + [Porsi Masak Baru]

[HPP Gabungan per Porsi] = ( [Carry-Over Layak × HPP Kemarin] + [Porsi Baru × HPP Baru] )
                           ÷ [Stok Aktif Awal]                        ← weighted average

[Porsi Dikonsumsi] = [Stok Aktif Awal] − [Sisa Layak Jual] − [Porsi Rusak Malam] − [Porsi Dimakan Sendiri]

[Pendapatan Estimasi]  = Σ ( Porsi Dikonsumsi × Harga Jual per Porsi )
[HPP Nyata]            = Σ ( Porsi Dikonsumsi × HPP Gabungan )
[Total Kerugian]       = Σ ( Basi Pagi × HPP Carry-Over + Rusak Malam × HPP Gabungan )

[Profit Bersih]        = Pendapatan − HPP Nyata − Kerugian
[Selisih Kas]          = ( Uang Laci − Modal Kembalian ) + Uang Digital − Pendapatan
```

### Contoh Perhitungan (dari PRD & test)

| Komponen                                    | Nilai                                      |
| ------------------------------------------- | ------------------------------------------ |
| Carry-over 5 porsi, HPP kemarin             | Rp 6.000/porsi → modal Rp 30.000           |
| Masak baru 20 porsi, total modal            | Rp 140.000 → HPP Rp 7.000/porsi            |
| Stok aktif awal                             | 25 porsi, total modal Rp 170.000           |
| **HPP gabungan**                            | **170.000 ÷ 25 = Rp 6.800/porsi**          |
| Terjual 17 porsi @ Rp 10.000                | Pendapatan Rp 170.000                      |
| HPP nyata 17 × 6.800                        | Rp 115.600                                 |
| Basi pagi 2 × 6.000 + rusak malam 1 × 6.800 | Kerugian Rp 18.800                         |
| **Profit bersih**                           | **170.000 − 115.600 − 18.800 = Rp 35.600** |

### Detektor Selisih Kas

`statusSelisih(selisih, pendapatan, toleransiPersen)` di `engine.ts` — membandingkan selisih kas mutlak dengan ambang toleransi yang bisa dikonfigurasi:

| Status | Kondisi | Contoh (pendapatan Rp 500.000, toleransi 5%) |
| :----: | ------- | :------------------------------------------ |
| 🟢 Aman | `abs(selisih)` ≤ ambang *(pendapatan × toleransi%)* | selisih ≤ **Rp 25.000** |
| 🟡 Waspada | ambang < `abs(selisih)` ≤ ambang × 2 | **Rp 25.000 – Rp 50.000** |
| 🔴 Kritis | di atas itu, atau `selisih` ≠ 0 saat pendapatan 0 | selisih > **Rp 50.000** *(potensi kebocoran)* |

### Aturan Penting

- **Carry-over membawa HPP asalnya** (HPP hari kemarin), lalu digabung dengan masakan baru via **weighted average** — tidak dicampur tanpa jejak (`carry_over_dari_id` menyimpan referensi audit trail).
- **Dua titik kerugian dibedakan**: _Basi Pagi_ (dari carry-over kemarin, modal keluar sebelum masuk stok aktif) dan _Rusak Malam_ (dari stok aktif hari itu, tidak dianggap terjual).
- **HPP estimasi sebagai fallback**: jika modal porsi baru belum diinput, sistem memakai HPP estimasi dari master lauk dan menandai hari tersebut "estimasi belum final".
- **Agregat di-snapshot saat kunci**: mengubah harga jual/HPP estimasi setelah hari terkunci tidak menggeser nilai hari itu.

---

## Arsitektur Teknis

```
┌──────────────────────────────────────────────────────────────────┐
│                           VIEWS (Vue SFC)                        │
│  Login · Home · InputPagi · InputMalam · Dashboard · Lauk ·      │
│  Pengaturan                         (lazy-loaded routes)         │
└───────────────┬──────────────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────────────┐
│                 COMPOSABLES + STORES (layanan data)              │
│  useHariIni · useStatusHari · useMasterLauk · usePengaturan      │
│  useAnalitik · useAuthGuard         stores/session · stores/hari │
│        │                                     │                   │
│   TanStack Query                    Pinia (sesi auth,            │
│   (cache server state)             tanggal aktif — client state) │
└───────────────┬──────────────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────────────┐
│             LIB / SERVICES (akses Supabase)                      │
│  lib/supabase.ts · lib/engine.ts · lib/format.ts                 │
│  services/rekonsiliasi · masterLauk · pengaturan · analitik      │
│  lib/sessionNavigation.ts (arahkanKe — predikat navigasi tunggal)│
└───────────────┬──────────────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────────────┐
│                SUPABASE (PostgreSQL 17 + Auth)                   │
│  master_lauk · rekonsiliasi_harian · detail_stok_harian          │
│  pengaturan_warung · trigger agregat · VIEW ringkasan_harian     │
│  RLS single-owner                                                 │
└──────────────────────────────────────────────────────────────────┘
```

Prinsip pemisahan state:

- **Client state** (sesi autentikasi, tanggal aktif) hidup di **Pinia**.
- **Server state** (master lauk, pengaturan, rekonsiliasi hari ini, data analitik) hidup di **TanStack Query** — ter-cache, ter-dedupe, dan dibagikan antar view. Navigasi antar halaman tidak mengulang fetch.
- **Invalidasi otomatis**: setiap mutasi hari (simpan pagi, simpan malam, tandai libur, buka lagi) meng-invalidate cache sehingga semua view menampilkan data terbaru seketika.
- Penyiapan hari (`siapkanHari`) hanya melakukan **satu** pengambilan detail per siklus — hasil pengecekan seed dipakai ulang sebagai hasil akhir (tidak ada request ganda).

---

## Struktur Proyek

```
Warunk/
├── src/
│   ├── views/            # 7 halaman (Login, Home, InputPagi, InputMalam,
│   │                     #   Dashboard, MasterLauk, Pengaturan)
│   ├── components/       # Stepper.vue — stepper −/+/angka reusable
│   ├── composables/      # useHariIni, useStatusHari, useMasterLauk,
│   │                     #   usePengaturan, useAnalitik, useAuthGuard
│   ├── stores/           # session.ts (auth), hari.ts (tanggal aktif)
│   ├── lib/
│   │   ├── engine.ts     # ★ pure engine rekonsiliasi mundur
│   │   ├── supabase.ts   # klien Supabase + helper user id
│   │   ├── format.ts     # formatRupiah, tanggalBaca, pesanError, tambahHari
│   │   ├── sessionNavigation.ts  # ★ arahkanKe — predikat navigasi tunggal
│   │   └── services/     # rekonsiliasi, masterLauk, pengaturan, analitik
│   ├── router/index.ts   # 7 rute lazy + guard global
│   ├── types/            # database.ts (domain types), vue-router.d.ts
│   ├── __tests__/        # engine, sessionNavigation, rekonsiliasi
│   ├── App.vue           # layout + bottom nav + useAuthGuard
│   └── main.ts           # bootstrap Pinia + VueQuery + PWA + session.init()
├── supabase/
│   └── migrations/       # 6 migrasi SQL (tabel → trigger/view → RLS)
├── openspec/
│   ├── specs/            # 10 spesifikasi fitur (sumber kebenaran)
│   └── changes/archive/  # riwayat change proposal + design
├── PRD.md                # Product Requirement Document
├── .env.example          # template variabel lingkungan
├── vite.config.ts        # Vite + Tailwind + PWA
└── vitest.config.ts      # konfigurasi Vitest
```

---

## Skema Database

6 migrasi SQL di `supabase/migrations/` (PostgreSQL 17 / Supabase):

| Tabel | Fungsi |
| :---: | ------- |
| 🗃️ `master_lauk` | Master lauk (nama, harga jual, HPP estimasi, `is_active`) |
| 📅 `rekonsiliasi_harian` | 1 baris = 1 hari operasional; status workflow `pagi_pending → pagi_selesai → malam_selesai` / `libur`; UNIQUE `(user_id, tanggal)` |
| 🥗 `detail_stok_harian` | 1 baris = 1 lauk per hari; semua input pagi/malam + kolom generated |
| ⚙️ `pengaturan_warung` | Setting per-user (float, toleransi %, toggle digital); UNIQUE `user_id` |

### Generated Columns (nilai otomatis dihitung Postgres)

| Kolom | Rumus |
| :---: | ----- |
| 📊 `detail.stok_aktif_awal` | `(porsi_carry_over − porsi_basi_pagi) + porsi_baru_dimasak` |
| 🏷️ `detail.hpp_gabungan_porsi` | weighted average; `0` jika stok aktif = 0 |
| 🍽️ `detail.porsi_dikonsumsi` | `stok_aktif_awal − sisa − rusak − dimakan sendiri` |
| 💰 `rekonsiliasi.keuntungan_bersih` | `pendapatan − hpp_nyata − kerugian` |
| 🧾 `rekonsiliasi.selisih_kas` | `(uang_laci − modal_kembalian_pakai) + uang_digital − pendapatan` |

### Trigger & View

- **`hitung_agregat_rekonsiliasi()`** (AFTER INSERT/UPDATE/DELETE pada `detail_stok_harian`) menghitung ulang agregat harian — **hanya jika status belum `malam_selesai`**, sehingga hari terkunci tetap menjadi snapshot permanen.
- **VIEW `ringkasan_harian`** (`security_invoker`) menyatukan rekonsiliasi + detail + total porsi terjual untuk dashboard.

### Check Constraints (validasi di level database)

- `chk_stok_non_negative`: sisa + rusak + dimakan sendiri ≤ stok aktif awal
- `chk_basi_pagi`: basi pagi ≤ carry-over
- `chk_porsi_non_negative`: semua kolom porsi ≥ 0

### Row Level Security

Setiap tabel memiliki satu policy **owner-scoped**: `user_id = auth.uid()` untuk `USING` dan `WITH CHECK`. Model single-owner — satu akun hanya mengakses datanya sendiri.

---

## Sesi & Navigasi

Navigasi berbasis sesi memakai **satu predikat tunggal** `arahkanKe({ user, route })` di [`src/lib/sessionNavigation.ts`](src/lib/sessionNavigation.ts), dipakai oleh dua jalur agar tidak pernah menyimpang:

1. **Router guard global** (`router/index.ts`) — menunggu `session.waitForSession()` lalu memutuskan redirect.
2. **Watcher `useAuthGuard`** (`App.vue`) — bereaksi terhadap perubahan status sesi secara real-time.

Hasilnya:

- Reload dengan sesi valid → tetap di halaman yang diminta.
- Reload tanpa sesi → diarahkan ke `/login`.
- Logout → langsung ke `/login` tanpa reload manual, bahkan tersinkron antar tab.
- Login berhasil → langsung ke halaman utama, status user diisi dari respons login (tanpa race condition event asinkron).
- Sesi aktif membuka `/login` → diarahkan ke `/`.

---

## Strategi Data Fetching

- **Query keys** ber-scope: `['hari-ini', tanggal]`, `['hari-status', tanggal]`, `['master-lauk']`, `['pengaturan']`, `['ringkasan-harian', tanggal]`, `['tren', rentang, tanggal]`, `['ranking-lauk', ...]`.
- **Satu pengambilan detail per siklus** penyiapan hari — hasil pengecekan seed dipakai ulang, tanpa fetch ulang.
- **Invalidasi setelah mutasi**: simpan pagi/malam, tandai libur, dan buka lagi meng-invalidate cache hari; view lain otomatis ter-update tanpa reload.
- Status autentikasi **selalu** berasal dari store sesi (sinkron dengan listener Supabase), bukan dari cache query.

---

## Testing

Test bertingkat via **Vitest** (`bun run test`). Catatan: perintah `bun test` (runner native bun) **tidak** didukung — runner tersebut mengabaikan konfigurasi Vitest sehingga gagal me-resolve alias `@/`. Selalu gunakan skrip di `package.json`.

| Perintah             | Cakupan                                                                                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run test`       | Semua unit + component test (cepat, tanpa dependensi eksternal). Unit: `engine.test.ts` (stok aktif, HPP gabungan weighted average + fallback estimasi, porsi dikonsumsi, pendapatan, kerugian, agregat profit, `selisihKas`, `statusSelisih`), `format.test.ts` (`formatRupiah`, `formatAngka`, `tanggalBaca`, `pesanError`, `tambahHari`), `sessionNavigation.test.ts` (aturan guard `arahkanKe`), `rekonsiliasi.test.ts` (idempotensi `siapkanHari` dengan klien Supabase in-memory). Component (`src/__tests__/component/`): `Stepper`, `InputPagiView`, `InputMalamView`, `DashboardView`, guard sesi (router + watcher `useAuthGuard`) |
| `bun run test:unit`  | Hanya project `unit` (logika murni — node env)                                                                                                                                                           |
| `bun run test:component` | Hanya project `component` (SFC via `@vue/test-utils` + happy-dom)                                                                                                                                     |
| `bun run test:e2e`   | End-to-end (Playwright) terhadap build produksi + Supabase local: perjalanan satu hari penuh, validasi, navigasi sesi                                                                                     |

---

## Setup & Pengembangan

Prasyarat: **Node ≥ 22.18 / ≥ 24.12** dan **Bun** (package manager).

```bash
# 1. Install dependensi
bun install

# 2. Siapkan lingkungan (salin & isi)
cp .env.example .env
#   VITE_SUPABASE_URL=        → URL project Supabase
#   VITE_SUPABASE_PUBLISHABLE_KEY=  → anon/publishable key

# 3. Jalankan development server (hot-reload)
bun dev

# 4. Type-check
bun run type-check

# 5. Unit & component test
bun run test

# 5b. End-to-end test (wajib Supabase local + browser Playwright)
bun run test:e2e

# 6. Build produksi (type-check + build)
bun run build
```

### Supabase Local (opsional)

```bash
supabase start        # jalankan stack lokal (port 54321 API, 54322 DB)
supabase db reset     # terapkan semua migrasi (catatan: pastikan seed.sql tersedia)
supabase db push      # atau push migrasi ke project remote yang sudah di-link
```

> PWA ter-install otomatis via service worker (auto-update) dengan manifest _WarungK — Rekonsiliasi Mundur_ (theme hijau #16a34a, portrait, installable ke home screen).

---

## Spec-Driven Development

Fitur-fitur aplikasi ini dikembangkan **spec-driven** menggunakan **OpenSpec**:

- **`openspec/specs/`** — 10 spesifikasi live (user-auth, input-pagi, input-malam, pengaturan-warung, master-lauk, session-navigation, data-fetching, hari-libur, dashboard-analitik, rekonsiliasi-mundur). Setiap spesifikasi ditulis dalam format _Purpose → Requirements → Scenarios (WHEN/THEN)_.
- **`openspec/changes/archive/`** — riwayat change proposal + design + tasks yang sudah diimplementasikan, termasuk catatan keputusan desain penting:
  - Porsi **dimakan sendiri** dicatat eksplisit — mencegah pendapatan over-count.
  - **Float di-snapshot per hari** — selisih kas bebas bias perubahan setting.
  - **Kunci final di malam hari** (`malam_selesai`) — tidak ada perubahan retroaktif.
  - **Pembayaran non-tunai** (QRIS/GoPay) dihitung dalam selisih kas.

Pola ini menjadikan README ini sebagai ringkasan; detail perilaku setiap fitur (skenario WHEN/THEN) ada di masing-masing spec.

---

_Dibangun untuk UMKM kuliner — mobile-first, minim ketik, zero-training onboarding. "Hari ini untung berapa?" kini terjawab dalam hitungan detik._
