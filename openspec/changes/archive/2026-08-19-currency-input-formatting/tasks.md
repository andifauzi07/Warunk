## 1. Core Infrastructure

- [x] 1.1 Buat fungsi `parseCurrency()` di `src/lib/format.ts` — strip non-digit, return number
- [x] 1.2 Buat file `src/directives/currency.ts` — implementasi Vue directive v-currency (handle event input, focus, paste,keydown, cursor management)
- [x] 1.3 Register directive `v-currency` di `src/main.ts`
- [x] 1.4 Tambah unit test untuk `parseCurrency()` di `src/__tests__/format.test.ts`
- [x] 1.5 Tambah unit test untuk directive `v-currency` di `src/__tests__/` (test format, parse, cursor)

## 2. Master Lauk View

- [x] 2.1 Ubah input `hargaJual` di `src/views/MasterLaukView.vue:206` — ganti `type="number"` ke `type="text"`, tambah `v-currency`, ganti `v-model` dari `.number` ke biasa
- [x] 2.2 Ubah input `hppEstimasi` di `src/views/MasterLaukView.vue:218` — perubahan yang sama

## 3. Input Pagi View

- [x] 3.1 Ubah input `modalBaru` di `src/views/InputPagiView.vue:174` — ganti ke `v-currency`, sesuaikan v-model
- [x] 3.2 Tambah computed `semuaModalTerisi` di `src/views/InputPagiView.vue` — cek semua row.modalBaru > 0
- [x] 3.3 Update `:disabled` tombol simpan di `src/views/InputPagiView.vue:191` — tambah `|| !semuaModalTerisi`

## 4. Input Malam View

- [x] 4.1 Ubah input `uangLaci` (edit mode) di `src/views/InputMalamView.vue:289` — ganti ke `v-currency`
- [x] 4.2 Ubah input `uangDigital` (edit mode) di `src/views/InputMalamView.vue:300` — ganti ke `v-currency`
- [x] 4.3 Ubah input `uangLaci` (normal mode) di `src/views/InputMalamView.vue:399` — ganti ke `v-currency`
- [x] 4.4 Ubah input `uangDigital` (normal mode) di `src/views/InputMalamView.vue:409` — ganti ke `v-currency`
- [x] 4.5 Update `:disabled` tombol simpan (kedua mode) — tambah `|| uangLaci === null || uangLaci < 0`
- [x] 4.6 Hapus validasi `uangLaci` dari dalam fungsi `simpan()` di `src/views/InputMalamView.vue:106-108`

## 5. Pengaturan View

- [x] 5.1 Ubah input `modal_kembalian_default` di `src/views/PengaturanView.vue:89` — ganti ke `v-currency`

## 6. Verification

- [x] 6.1 Jalankan `npm run lint` dan pastikan tidak ada error
- [x] 6.2 Jalankan `npm run typecheck` dan pastikan tidak ada error
- [x] 6.3 Jalankan `npm run test:unit` dan pastikan semua test lulus
- [x] 6.4 Manual testing: verifikasi input formatting bekerja di semua halaman (/lauk, /pagi, /malam, /pengaturan)
