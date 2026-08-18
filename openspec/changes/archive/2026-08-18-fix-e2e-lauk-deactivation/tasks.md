## 1. Seed Data Error Checking

- [x] 1.1 Tambahkan error checking pada insert `detail_stok_harian` di `seedTestData()` (line 78-97 dan 118-134)
- [x] 1.2 Tambahkan error checking pada delete `rekonsiliasi_harian` di `seedTestData()` (line 38)
- [x] 1.3 Tambahkan error checking pada delete `master_lauk` di `seedTestData()` (line 39)
- [x] 1.4 Tambahkan delete eksplisit `detail_stok_harian` sebelum delete `rekonsiliasi_harian` untuk menghindari foreign key constraint

## 2. Verifikasi Implementasi

- [x] 2.1 Verifikasi `getCarryOverForLauk()` di `src/lib/services/rekonsiliasi.ts:218-229` mengembalikan nilai yang benar
- [x] 2.2 Verifikasi `zeroCarryOverForLauk()` di `src/lib/services/rekonsiliasi.ts:235` berfungsi dengan benar
- [x] 2.3 Verifikasi dialog konfirmasi di `src/views/MasterLaukView.vue` menampilkan pesan yang sesuai berdasarkan kondisi carry-over

## 3. Test Execution

- [x] 3.1 Jalankan test 1 "nonaktifkan lauk yang punya carry-over → sisa menjadi basi, lauk hilang dari /pagi" dan pastikan pass
- [x] 3.2 Jalankan test 2 "aktifkan kembali lauk → stok 0, tanpa carry-over" dan pastikan pass
- [x] 3.3 Verifikasi bahwa kedua test hanya menggunakan Supabase lokal (tidak memodifikasi production)

## 4. Cleanup

- [x] 4.1 Hapus console.log debug yang ditambahkan selama investigasi (jika ada)
- [x] 4.2 Pastikan tidak ada perubahan pada source code selain file test — satu-satunya perubahan source adalah perbaikan `zeroCarryOverForLauk` yang disetujui (menghapus update `porsi_basi_pagi` yang melanggar constraint `chk_basi_pagi`)
