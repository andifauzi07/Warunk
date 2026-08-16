## 1. Service upsert

- [x] 1.1 Ubah `upsertPengaturan` di `src/lib/services/pengaturan.ts` menjadi `.upsert(input, { onConflict: 'user_id' })`
- [x] 1.2 Pastikan payload tetap memuat ketiga kolom pengaturan + `user_id` (tidak ada kolom pengaturan yang hilang saat update)

## 2. Normalisasi input form

- [x] 2.1 Di `simpanSemua` (`src/views/PengaturanView.vue`), normalisasi `''` / `null` / `undefined` → `0` untuk `modal_kembalian_default` dan `toleransi_selisih_persen` sebelum dikirim
- [x] 2.2 Jalankan validasi toleransi 0–100 pada nilai hasil normalisasi

## 3. Verifikasi

- [x] 3.1 `npm run type-check` tanpa error
- [x] 3.2 `npm test` (vitest) semua hijau
- [x] 3.3 Verifikasi manual di `/pengaturan`: simpan dua kali berturut-turut, ubah modal kembalian → 0 lalu simpan, aktifkan toggle pembayaran digital lalu simpan — semua berhasil tanpa error `duplicate key`
