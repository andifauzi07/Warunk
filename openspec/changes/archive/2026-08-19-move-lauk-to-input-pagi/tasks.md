## 1. Setup

- [x] 1.1 Buat komponen `components/LaukFormSheet.vue` dengan struktur bottom sheet
- [x] 1.2 Implement form fields: nama lauk, harga jual per porsi (v-currency), HPP estimasi per porsi (v-currency)
- [x] 1.3 Implement validasi: nama wajib diisi, nama duplikat (case-insensitive check terhadap `laukList`)
- [x] 1.4 Implement error handling untuk success/error state
- [x] 1.5 Terima props: `open: boolean`, emit: `close`, `saved`

## 2. Modifikasi useDetailRows

- [x] 2.1 Baca `useDetailRows.ts` dan identifikasi watcher `hari.detail`
- [x] 2.2 Tambah branch `else` di watcher untuk detect item baru (bandingkan `laukId` yang ada di `rows` vs `hari.detail`)
- [x] 2.3 Implement append item baru ke `rows` tanpa reset data existing
- [x] 2.4 Pastikan `initRowsFromDetail` dipanggil untuk item baru saja

## 3. Hapus Tombol Lauk dari HomeView

- [x] 3.1 Buka `HomeView.vue` dan hapus `<RouterLink to="/lauk">` (baris 74-79)
- [x] 3.2 Pastikan tombol "Atur" tetap ada di header

## 4. Integrasi ke InputPagiView

- [x] 4.1 Import `LaukFormSheet` ke `InputPagiView.vue`
- [x] 4.2 Tambah state `showLaukForm = ref(false)` untuk mengontrol bottom sheet
- [x] 4.3 Tambah tombol "[+ Lauk]" di header (sebelah judul), klik buka `showLaukForm`
- [x] 4.4 Tambah tombol inline "[+ Tambah Lauk Baru]" di bawah `v-for` rows pada mode input
- [x] 4.5 Sembunyikan tombol inline saat `terkunci` (status `malam_selesai`)
- [x] 4.6 Ubah empty state "Belum ada lauk aktif. Tambahkan di Master Lauk dulu." menjadi link yang buka `showLaukForm`
- [x] 4.7 Tambah `<LaukFormSheet>` di template dengan `v-model:open` dan handler `@saved`
- [x] 4.8 Handle event `@saved` untuk trigger refresh data (invalidate queries)

## 5. Testing & Verification

- [x] 5.1 Jalankan `bun run lint` dan pastikan tidak ada error
- [x] 5.2 Jalankan `bun run type-check` (jika ada) dan pastikan tidak ada type error
- [x] 5.3 Jalankan test yang ada (`bun run test`) dan pastikan tidak ada regression
- [x] 5.4 Verifikasi manual: tambah lauk dari Input Pagi → lauk muncul di daftar input
- [x] 5.5 Verifikasi manual: data existing tidak hilang saat tambah lauk baru
- [x] 5.6 Verifikasi manual: tombol inline tersembunyi saat hari terkunci
- [x] 5.7 Verifikasi manual: validasi nama duplikat muncul error message
