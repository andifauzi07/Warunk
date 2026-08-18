## Why

E2E test `lauk-deactivation.spec.ts` mengalami 2 kegagalan yang memiliki akar masalah yang sama: `getCarryOverForLauk()` mengembalikan 0 padahal seed data menetapkan `porsi_carry_over: 5`. Akibatnya:

1. **Test 1** gagal karena dialog menampilkan pesan "Yakin menonaktifkan lauk ini ?" (carryOver === 0) padahal seharusnya "Menonaktifkan lauk ini, akan membuat sisa porsi kemarin dianggap basi/rusak !"
2. **Test 2** gagal karena `zeroCarryOverForLauk` tidak dipanggil (karena carryOver === 0), sehingga carry-over tetap 5 setelah deaktivasi dan reaktivasi

Kedua test ini menjaga kualitas perilaku deaktivasi lauk yang sudah diimplementasikan di change `lauk-deactivation-flow`. Tanpa test yang berjalan dengan benar, regression bisa terjadi tanpa terdeteksi.

## What Changes

- **Fix seed data `detail_stok_harian`**: Tambahkan error checking pada insert `detail_stok_harian` di `seedTestData()` untuk memastikan data berhasil dimasukkan ke Supabase lokal
- **Fix seed data `rekonsiliasi_harian` delete**: Tambahkan error checking pada delete `rekonsiliasi_harian` untuk memastikan cascade ke `detail_stok_harian` berhasil
- **Verifikasi implementasi `getCarryOverForLauk`**: Pastikan fungsi mengembalikan nilai yang benar berdasarkan seed data yang valid
- **Perbaiki `zeroCarryOverForLauk`**: Hanya nol-kan `porsi_carry_over` (tidak memindahkan ke `porsi_basi_pagi` karena melanggar constraint `chk_basi_pagi`)
- **Pastikan pengujian hanya menggunakan Supabase lokal** dan tidak memodifikasi data production

## Capabilities

### New Capabilities

_(none — ini adalah perbaikan test, bukan fitur baru)_

### Modified Capabilities

_(none — tidak ada perubahan requirement spesifikasi)_

## Impact

- **E2E test**: `e2e/lauk-deactivation.spec.ts` — seed function diperbaiki
- **Service layer**: `src/lib/services/rekonsiliasi.ts` — verifikasi `getCarryOverForLauk` berfungsi benar
- **Database**: Tidak ada perubahan schema — semua perbaikan di level test dan aplikasi
