## Why

Semua input mata uang pada aplikasi Warunk menggunakan `type="number"` tanpa pemisah ribuan. Pengguna harus membaca angka mentah seperti `170000` tanpa visualisasi `170.000`, yang membuat proses input lambat dan rentan salah ketik. Selain itu, tombol simpan tidak disabled secara otomatis saat field required masih kosong — pengguna harus mengklik simpan terlebih dahulu baru melihat error.

## What Changes

- Menambahkan Vue directive `v-currency` yang memformat input angka dengan pemisah ribuan Indonesia (`.`) secara real-time saat pengguna mengetik
- Mengubah semua input mata uang dari `type="number"` menjadi `type="text"` dengan `inputmode="numeric"` agar directive bisa bekerja
- Menambahkan validasi tombol simpan: disabled saat input required masih kosong/nol
- Menambahkan fungsi `parseCurrency` di `format.ts` untuk reverse parsing (format string → number)

## Capabilities

### New Capabilities

- `currency-input-formatting`: Vue directive `v-currency` untuk pemformatan input mata uang real-time dengan pemisah ribuan, termasuk parsing balik ke angka mentah

### Modified Capabilities

- `input-pagi`: Tombol simpan disabled saat ada row dengan `modalBaru = 0` (sebelumnya hanya warning teks)
- `input-malam`: Tombol simpan disabled saat `uangLaci` kosong/null (sebelumnya validasi hanya di dalam fungsi simpan)
- `master-lauk`: Input harga jual dan HPP estimasi menggunakan `v-currency` untuk konsistensi

## Impact

- **File yang diubah:**
  - `src/lib/format.ts` — tambah `parseCurrency()`
  - `src/main.ts` — register directive `v-currency`
  - `src/directives/currency.ts` — file baru, implementasi directive
  - `src/views/MasterLaukView.vue` — ubah input harga jual & HPP ke `v-currency`
  - `src/views/InputPagiView.vue` — ubah input modal ke `v-currency`, tambah validasi tombol simpan
  - `src/views/InputMalamView.vue` — ubah input uang laci & digital ke `v-currency`, tambah validasi tombol simpan
  - `src/views/PengaturanView.vue` — ubah input modal kembalian ke `v-currency`
- **Dependency:** Tidak ada dependency baru
- **Database:** Tidak ada perubahan schema
- **Breaking changes:** Tidak ada
