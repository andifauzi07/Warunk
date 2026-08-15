## 1. Setup Proyek & Dependensi

- [x] 1.1 Install dependensi: `vue-router`, `pinia`, `@tanstack/vue-query`, `tailwindcss`, `@supabase/supabase-js`, `vite-plugin-pwa`
- [x] 1.2 Konfigurasi Vite (plugin Tailwind, vue-devtools, PWA) dan tsconfig
- [x] 1.3 Setup Tailwind CSS (config + base style) dan struktur folder (views/, components/, stores/, lib/, composables/, types/)
- [x] 1.4 Setup `vue-router` dengan 4 rute utama: Beranda, Pagi, Malam, Dashboard (+ Pengaturan) dengan guard autentikasi

## 2. Setup Supabase & Skema Database

- [x] 2.1 Buat project Supabase dan simpan kredensial di `.env` (variabel `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- [x] 2.2 Tulis migrasi SQL tabel `master_lauk` sesuai design.md
- [x] 2.3 Tulis migrasi SQL tabel `rekonsiliasi_harian` dengan status enum (+ `libur`), kolom `modal_kembalian_pakai`, `total_uang_digital`, dan generated column `selisih_kas` (rumus baru: laci − float + digital − pendapatan) serta `keuntungan_bersih`
- [x] 2.4 Tulis migrasi SQL tabel `detail_stok_harian` dengan kolom `porsi_konsumsi`, generated columns (`stok_aktif_awal`, `hpp_gabungan_porsi`, `porsi_dikonsumsi`), dan check constraint `sisa + rusak + konsumsi ≤ stok aktif awal`
- [x] 2.5 Tulis migrasi SQL tabel `pengaturan_warung` (single-row: `modal_kembalian_default`, `toleransi_selisih_persen`, `terima_pembayaran_digital`)
- [x] 2.6 Buat trigger `AFTER INSERT/UPDATE` pada `detail_stok_harian` untuk memperbarui agregat `rekonsiliasi_harian` (atau VIEW `ringkasan_harian` untuk dashboard)
- [x] 2.7 Terapkan kebijakan RLS single-owner pada semua tabel (baca/tulis hanya milik `auth.uid()`)

## 3. Autentikasi & Lapisan Data

- [x] 3.1 Buat klien Supabase dan composable sesi (onAuthStateChange)
- [x] 3.2 Buat halaman login email/password + halaman logout
- [x] 3.3 Buat Pinia store sesi & hari berjalan (status pagi/malam, tanggal aktif)
- [x] 3.4 Buat layer akses data (service/query) untuk semua tabel dengan TanStack Query (optimistic update di tempat yang sesuai)

## 4. Master Lauk

- [x] 4.1 Halaman CRUD master lauk: daftar, tambah, edit, hapus/nonaktifkan (nama, foto opsional, harga jual, HPP estimasi, toggle aktif)
- [x] 4.2 Pastikan lauk nonaktif tidak muncul di modul Pagi/Malam dan data lauk yang pernah tercatat tidak dapat dihapus permanen (hanya dinonaktifkan)

## 5. Engine Rekonsiliasi Mundur

- [x] 5.1 Implementasikan fungsi kalkulasi murni (pure functions) untuk: `stokAktifAwal`, `hppGabungan` (weighted average + fallback HPP estimasi saat modal kosong), `porsiDikonsumsi`, `pendapatan`, `hppNyata`, `kerugian`, `profit`, `selisihKas` (rumus dengan float + digital)
- [x] 5.2 Verifikasi angka kalkulasi terhadap contoh PRD (5×6.000 + 20×7.000 ÷ 25 = 6.800) dan skenario loss/konsumsi via unit test
- [x] 5.3 Terapkan prinsip snapshot: agregat dibaca/menempel saat hari dikunci (malam); perubahan harga/HPP/float tidak mengubah hari terkunci

## 6. Modul Input Pagi

- [x] 6.1 Layar pagi: tampilkan carry-over otomatis dari hari operasional terakhir (read-only, dengan HPP asal)
- [x] 6.2 Konfirmasi per carry-over: "Masih Layak Jual" / "Basi — Catat Rugi" dengan validasi `basi ≤ carry-over`
- [x] 6.3 Input porsi masak baru per lauk dengan stepper besar + input total modal (opsional, boleh dikosongkan)
- [x] 6.4 Tombol "Selesai Input Pagi" → status `pagi_selesai`; ulang/koreksi diizinkan sebelum malam

## 7. Modul Input Malam

- [x] 7.1 Layar malam: daftar lauk aktif dengan stok aktif awal otomatis; tiga kolom stepper per lauk (Sisa Layak, Rusak, Dimakan Sendiri) dengan validasi `sisa + rusak + konsumsi ≤ stok aktif`
- [x] 7.2 Toggle "hari ini makan sendiri?" — kolom Dimakan Sendiri muncul/sembunyi sesuai toggle
- [x] 7.3 Input "Total Uang di Laci" dan "Uang Digital Masuk Hari Ini" (field digital hanya muncul jika pengaturan terima digital; default 0)
- [x] 7.4 Snapshot `modal_kembalian_pakai` dari pengaturan saat simpan; peringatan inline bila ada lauk dengan modal belum diinput (HPP estimasi)
- [x] 7.5 Tombol "Simpan & Kunci" → status `malam_selesai`, tampilkan Ringkasan Hari Ini seketika; tolak semua edit setelah kunci

## 8. Hari Libur

- [x] 8.1 Deklarasi hari libur (status `libur`) dari layar utama sebelum input pagi; layar tenang saat libur
- [x] 8.2 Aksi "Buka Lagi" untuk mengubah `libur` → `pagi_pending`
- [x] 8.3 Carry-over melompati gap tanggal: hari operasional berikutnya mengambil carry-over dari hari operasional terakhir (bukan kalender), termasuk melewati hari libur

## 9. Dashboard & Analitik

- [x] 9.1 Ringkasan Hari Ini (pendapatan estimasi dengan rincian digital/tunai, HPP, kerugian, profit, selisih kas) di area atas dashboard
- [x] 9.2 Detektor selisih kas: indikator warna hijau/kuning/merah sesuai toleransi dari pengaturan
- [x] 9.3 Grafik tren profit 7 & 30 hari dengan pembedaan hari libur vs profit nol
- [x] 9.4 Badge status harian (`pagi_pending`/`pagi_selesai`/`malam_selesai`/`libur`) dan peringatan lupa input
- [x] 9.5 Ranking lauk terlaris & paling sering basi (rentang waktu pilihan)

## 10. Pengaturan Warung

- [x] 10.1 Halaman pengaturan: modal kembalian (float), toleransi selisih kas (%), toggle terima pembayaran digital
- [x] 10.2 Pastikan perubahan pengaturan tidak mengubah nilai snapshot hari terkunci

## 11. PWA & Penyempurnaan UI

- [x] 11.1 Konfigurasi `vite-plugin-pwa` (manifest + service worker + ikon) agar installable ke home screen
- [x] 11.2 Audit UI mobile-first: tombol minimal 48px dalam thumb zone, font ≥ 16px, angka hasil 24–32px
- [ ] 11.3 Uji alur lengkap di viewport ponsel (devtools) dan mode offline dasar

## 12. Verifikasi Akhir

- [x] 12.1 `bun run type-check` dan `bun run build` berjalan tanpa error
- [ ] 12.2 Uji skenario end-to-end: master lauk → input pagi → (opsional libur) → input malam → dashboard, memverifikasi angka profit & selisih kas
- [ ] 12.3 Uji validasi: opname melebihi stok, basi melebihi carry-over, kunci hari tidak bisa diedit
