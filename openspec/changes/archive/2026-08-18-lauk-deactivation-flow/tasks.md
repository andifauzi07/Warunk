## 1. Service Layer

- [x] 1.1 Tambah fungsi `getCarryOverForLauk(laukId: string, tanggal: string): Promise<number>` di `rekonsiliasi.ts` — query `detail_stok_harian` join `rekonsiliasi_harian` untuk mendapatkan `porsi_carry_over` lauk tertentu pada tanggal tertentu
- [x] 1.2 Tambah fungsi `zeroCarryOverForLauk(laukId: string, tanggal: string): Promise<void>` di `rekonsiliasi.ts` — update baris `detail_stok_harian`: set `porsi_basi_pagi = porsi_carry_over`, `porsi_carry_over = 0` untuk lauk dan tanggal tersebut

## 2. Master Lauk View

- [x] 2.1 Ubah `toggleAktif(lauk)` di `MasterLaukView.vue` — cek apakah hari ini status `malam_selesai`, jika ya tampilkan pesan dan hentikan
- [x] 2.2 Tambah logic cek carry-over via `getCarryOverForLauk` sebelum toggle, tampilkan `window.confirm` dengan pesan sesuai kondisi carry-over
- [x] 2.3 Jika user konfirmasi dan ada carry-over, panggil `zeroCarryOverForLauk` sebelum `updateLauk`
- [x] 2.4 Pastikan invalidasi cache setelah deaktivasi mencakup `['hari-ini']` dan `['master-lauk']`

## 3. Filter Lauk Nonaktif dari UI

- [x] 3.1 Ubah `useDetailRows` di `useDetailRows.ts` — filter `rows` agar hanya menampilkan baris detail untuk lauk yang `is_active = true` berdasarkan data `laukAktif`
- [x] 3.2 Pastikan filter berlaku untuk kedua mode: input dan review/read-only

## 4. Testing

- [x] 4.1 Unit test untuk `getCarryOverForLauk` — mock Supabase, verifikasi query benar
- [x] 4.2 Unit test untuk `zeroCarryOverForLauk` — mock Supabase, verifikasi update `porsi_basi_pagi` dan `porsi_carry_over`
- [x] 4.3 Component test untuk `MasterLaukView` — verifikasi popup konfirmasi muncul sesuai kondisi carry-over
- [x] 4.4 Component test untuk `useDetailRows` — verifikasi lauk nonaktif tidak muncul di `rows`

## 5. Verifikasi End-to-End

- [x] 5.1 Jalankan `npm run lint` dan pastikan tidak ada error
- [x] 5.2 Jalankan `npm run type-check` dan pastikan tidak ada error
- [x] 5.3 Jalankan `npm run test` dan pastikan semua test pass
