## Why

Saat lauk dinonaktifkan di `/lauk`, baris `detail_stok_harian` untuk lauk tersebut tidak dihapus. Akibatnya, lauk nonaktif masih tampil di halaman `/pagi` karena `seedDetailHariIni` hanya menambah baris baru, tidak menghapus baris lama. Selain itu, carry-over (sisa porsi dari malam sebelumnya) milik lauk nonaktif tidak diproses — jika lauk diaktifkan kembali, carry-over lama bisa "bangkit" dan mengganggu kalkulasi HPP.

## What Changes

- **Konfirmasi deaktivasi dua level**: Jika lauk punya carry-over hari ini, tampilkan peringatan bahwa sisa porsi akan dianggap basi. Jika tidak ada carryOVER, tampilkan konfirmasi sederhana.
- **Zero carry-over saat deaktivasi**: Sebelum menonaktifkan, update `detail_stok_harian` hari ini — pindahkan seluruh `porsi_carry_over` ke `porsi_basi_pagi`, dan reset `porsi_carry_over` ke 0. Ini memastikan tidak ada carry-over "tertinggal" untuk lauk nonaktif.
- **Filter lauk nonaktif dari UI `/pagi` dan `/malam`**: `useDetailRows` hanya menampilkan baris detail untuk lauk yang `is_active = true`.
- **Bug fix**: Lauk nonaktif tidak lagi muncul di halaman input pagi/malam.

## Capabilities

### New Capabilities

_(none — ini adalah perubahan pada kemampuan yang sudah ada)_

### Modified Capabilities

- `master-lauk`: Requirement "Toggle Aktif/Nonaktif Lauk" berubah — menambahkan langkah zero carry-over sebelum deaktivasi, konfirmasi popup dua level, dan filter di UI input.
- `input-pagi`: Requirement "Tampilkan Carry-Over Otomatis" berubah — hanya menampilkan lauk yang aktif (`is_active = true`).

## Impact

- **Service layer**: `rekonsiliasi.ts` — fungsi baru `zeroCarryOverForLauk()` dan `getCarryOverForLauk()`.
- **View**: `MasterLaukView.vue` — `toggleAktif` dirombak total dengan popup konfirmasi dan panggilan service.
- **Composable**: `useDetailRows.ts` — filter `rows` berdasarkan `is_active`.
- **Composable**: `useMasterLauk.ts` — pastikan invalidasi cache mencakup semua query terkait.
- **Tidak ada perubahan database schema** — semua perubahan di level aplikasi.
