## Why

Pemilik warung nasi campur tradisional tidak pernah tahu profit bersih harian secara akurat. Sistem POS konvensional terbukti gagal (memperlambat antrean di jam sibuk). WarungKas menyelesaikannya dengan **rekonsiliasi mundur**: sistem tidak mencatat transaksi, melainkan menghitung apa yang habis dikonsumsi dari selisih stok pagi dan malam. Seluruh beban input bergeser ke waktu senggang pemilik, jam operasional berjalan normal tanpa aplikasi.

## What Changes

Membangun MVP WarungKas dari nol (greenfield dari template Vite default):

- **Aplikasi PWA mobile-first** — Vue 3 (Composition API) + TypeScript + Vite + Tailwind CSS, installable ke home screen, input berbasis tap/stepper bukan keyboard.
- **Backend Supabase** — PostgreSQL + Auth + Row Level Security (single-owner), generated columns untuk kalkulasi otomatis.
- **Engine rekonsiliasi mundur** — kalkulasi inti: Stok Aktif Awal, HPP Gabungan (weighted average), Porsi Dikonsumsi, Pendapatan Estimasi, HPP Nyata, Total Kerugian, Profit Bersih, dan Selisih Kas.
- **Modul Input Pagi** — carry-over otomatis dari kemarin, konfirmasi layak/basi, input porsi masak baru + modal.
- **Modul Input Malam** — opname 3 bucket per lauk (sisa layak, rusak, dimakan sendiri), uang laci, uang digital, kunci final.
- **Dashboard analitik** — ringkasan hari ini, detektor selisih/kebocoran, tren 7/30 hari, ranking lauk.
- **Keputusan desain hasil eksplorasi** (menyempurnakan PRD):
  - Porsi **dimakan sendiri** dicatat eksplisit per lauk (toggle "hari ini makan sendiri?") — mencegah pendapatan over-count dan selisih kas negatif palsu.
  - **Float** (modal kembalian) sebagai setting sekali pakai, di-**snapshot per hari** saat simpan malam — selisih kas bebas bias float.
  - **Kunci final di malam hari**: status `malam_selesai` = terkunci, tidak ada perubahan retroaktif; laporan malam wajib.
  - **Hari libur** = deklarasi eksplisit (state ke-4), carry-over melompati gap tanggal.
  - **Pembayaran non-tunai** (QRIS/GoPay) dicatat sebagai satu angka di malam hari — selisih kas menghitung tunai bersih + digital terhadap pendapatan estimasi.

## Capabilities

### New Capabilities
- `master-lauk`: CRUD jenis lauk/masakan (nama, harga jual per porsi, HPP estimasi, toggle aktif), harga di-snapshot saat kunci malam.
- `input-pagi`: Alur pagi — carry-over otomatis dari malam kemarin, konfirmasi layak/basi (Porsi Basi Pagi), input porsi masak baru + total modal bahan.
- `input-malam`: Alur malam — opname per lauk (sisa layak, rusak, dimakan sendiri), input uang laci + uang digital, validasi konsistensi, snapshot float, kunci final terkunci.
- `rekonsiliasi-mundur`: Engine kalkulasi inti dan konsistensi data — stok aktif awal, HPP weighted average, porsi dikonsumsi, pendapatan, HPP nyata, kerugian, profit, selisih kas; audit trail carry-over.
- `hari-libur`: Deklarasi hari tutup sebagai state eksplisit; carry-over mampu melompati gap tanggal; dashboard membedakan "libur" vs "lupa input".
- `dashboard-analitik`: Ringkasan hari ini, detektor selisih/kebocoran (toleransi konfigurabel + warna), tren 7/30 hari, ranking lauk terlaris & paling sering basi, badge status harian.
- `pengaturan-warung`: Setting global — modal kembalian (float), toleransi selisih kas, toggle terima pembayaran digital, profil warung.
- `user-auth`: Autentikasi single-owner (email/password via Supabase Auth) + kebijakan RLS sederhana.

### Modified Capabilities
<!-- Tidak ada — seluruh capability baru (belum ada spec yang berubah). -->

## Impact

- **Greenfield**: repo saat ini hanya template Vite default (`src/App.vue`, `src/main.ts`, belum ada dependensi selain Vue).
- **Dependensi baru**: `vue-router`, `pinia`, `@tanstack/vue-query`, `tailwindcss`, `vite-plugin-pwa`, `@supabase/supabase-js`.
- **Supabase (PostgreSQL)**: tabel `master_lauk`, `rekonsiliasi_harian`, `detail_stok_harian`, `pengaturan_warung`; generated columns (`stok_aktif_awal`, `hpp_gabungan_porsi`, `porsi_dikonsumsi`, `keuntungan_bersih`, `selisih_kas`); trigger/VIEW untuk agregat harian; kebijakan RLS single-owner.
- **Perubahan skema PRD**: kolom baru `porsi_konsumsi` (detail stok), `modal_kembalian_pakai` + `total_uang_digital` (rekonsiliasi harian), enum status + `libur`; rumus `selisih_kas` diperbarui untuk float & digital.
