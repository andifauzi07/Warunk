## 1. Service Layer — Guard Status Revert

- [x] 1.1 Modifikasi `simpanMalam()` di `src/lib/services/rekonsiliasi.ts`: tambah guard yang mengecek status saat ini sebelum upsert detail. Jika status sudah `malam_selesai`, revert ke `pagi_selesai` terlebih dahulu.
- [x] 1.2 Pastikan setelah upsert detail, status dikembalikan ke `malam_selesai` bersamaan dengan update uang fields (uangLaci, uangDigital, modalKembalianPakai).

## 2. InputMalamView — Hapus Field Modal

- [x] 2.1 Hapus blok input modal bahan dari template `InputMalamView.vue` (label + input `row.modalBaru`, line ~253-264).
- [x] 2.2 Hapus computed `daftarEstimasi` dan blok peringatan "HPP memakai estimasi" dari template (line ~52-55, ~297-309).
- [x] 2.3 Di section ringkasan terkunci, hapus tampilan "Modal bahan" dari card per lauk (line ~176-179).

## 3. InputMalamView — Mode Edit

- [x] 3.1 Tambah `editMode = ref(false)` dan `showDialog = ref(false)` di script setup.
- [x] 3.2 Tambah computed `makanSendiriAwal` yang derive nilai toggle dari data tersimpan (ada `konsumsi > 0`?). Inisialisasi `makanSendiri` dari computed ini saat data loaded.
- [x] 3.3 Tambah tombol "Ubah Input Malam" di section terkunci (setelah ringkasan), yang menampilkan AlertDialog saat diklik.
- [x] 3.4 Tambah AlertDialog konfirmasi: "Yakin ingin mengedit input malam hari ini? Data yang sudah tersimpan akan diubah." dengan tombol Batal dan Ya.
- [x] 3.5 Saat dikonfirmasi, set `editMode = true` — tampilkan semua field input (sisa layak, rusak, konsumsi, uang laci, uang digital) dengan tombol "Simpan & Kunci Hari Ini".
- [x] 3.6 Pastikan setelah simpan ulang, `editMode` kembali `false` dan `resetInitialized()` dipanggil.

## 4. InputMalamView — Query Param Edit

- [x] 4.1 Di InputMalamView, impor `useRoute` dari vue-router.
- [x] 4.2 Cek `route.query.edit === '1'` saat component mounted. Jika `terkunci`, langsung set `editMode = true`.
- [x] 4.3 Bersihkan query param setelah masuk edit mode (optional, agar refresh tidak masuk edit lagi).

## 5. HomeView — Koreksi Input Malam

- [x] 5.1 Di HomeView, ganti RouterLink `to="/malam"` (line ~159-164) dengan conditional: jika `status !== 'malam_selesai'`, tampilkan RouterLink; jika `malam_selesai`, tampilkan tombol "Koreksi Input Malam".
- [x] 5.2 Tambah `dialogEditMalam = ref(false)` di script setup.
- [x] 5.3 Import `AlertDialog` dan `useRouter`.
- [x] 5.4 Tambah fungsi `tanyaEditMalam()` yang set `dialogEditMalam = true`, dan `bukaEditMalam()` yang navigasi ke `/malam`.
- [x] 5.5 Tambah AlertDialog di template dengan pesan konfirmasi dan handler confirm/cancel.

## 6. Testing

- [x] 6.1 Update test `InputMalamView.test.ts`: tambah test case untuk tombol "Ubah Input Malam" muncul saat `malam_selesai`.
- [x] 6.2 Update test `InputMalamView.test.ts`: tambah test case untuk mode edit — field bisa diubah dan simpan ulang berhasil.
- [x] 6.3 Update test `InputMalamView.test.ts`: pastikan field modal tidak muncul di view.
- [x] 6.4 Tambah test case untuk guard status revert di `rekonsiliasi.ts` (mock supabase, verifikasi status di-revert sebelum upsert).
- [x] 6.5 Run `bun run test` dan pasti semua test pass.

## 7. Final Verification

- [x] 7.1 Run linter (`bun run lint`) dan pasti tidak ada error.
- [x] 7.2 Run typecheck (`bun run typecheck`) dan pasti tidak ada error.
- [x] 7.3 Manual test: buka hari dengan status `malam_selesai`, klik "Koreksi Input Malam" dari HomeView, konfirmasi dialog, edit field, simpan, verifikasi agregat terupdate.
