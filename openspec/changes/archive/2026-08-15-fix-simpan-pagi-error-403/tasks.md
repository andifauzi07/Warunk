# Tasks: Fix Simpan Pagi Error 403

## 1. Perbaiki Penyimpanan di Service

- [x] 1.1 Sertakan seluruh state baris (termasuk `user_id`, `rekonsiliasi_id`, `lauk_id`, `porsi_carry_over`, `hpp_carry_over_porsi`) pada payload upsert `simpanPagi` di `src/lib/services/rekonsiliasi.ts`
- [x] 1.2 Sertakan seluruh state baris (termasuk `user_id`, `rekonsiliasi_id`, `lauk_id`, kolom pagi) pada payload upsert `simpanMalam` di `src/lib/services/rekonsiliasi.ts`
- [x] 1.3 Pastikan service melempar `"Belum login"` bila `currentUserId()` mengembalikan null pada kedua fungsi di atas
- [x] 1.4 Lengkapi items payload di `InputPagiView.vue` dan `InputMalamView.vue` (carry over, HPP carry over, kolom pagi) serta tipe `DetailPagiInput`/`DetailMalamInput`

## 2. Perbaiki Tampilan Pesan Error

- [x] 2.1 Ubah `pesanError` di `src/lib/format.ts` agar menampilkan `message`/`details` untuk objek error non-`Error` (mis. respon PostgREST) dengan fallback `"Terjadi kesalahan"`
- [x] 2.2 Pastikan pemakaian `pesanError` di `InputPagiView.vue`, `InputMalamView.vue`, dan `HomeView.vue` tetap berlaku tanpa perubahan kontrak

## 3. Umpan Balik UI Input Pagi & Malam

- [x] 3.1 Tambah state `editMode` di `InputPagiView.vue` dan beralih ke mode ringkasan setelah simpan berhasil
- [x] 3.2 Tampilkan banner sukses "Input pagi tersimpan" + card ringkasan per lauk (sisa kemarin, basi, masak baru, modal, stok aktif) saat status `pagi_selesai`
- [x] 3.3 Tampilkan tombol "Ubah Input Pagi" untuk kembali ke mode input (dan card ringkasan tanpa tombol saat status `malam_selesai`)
- [x] 3.4 Tampilkan banner sukses "Input malam tersimpan" + card Ringkasan Hari Ini read-only (nilai persisten dari rekonsiliasi) saat status `malam_selesai`
- [x] 3.5 Tampilkan card ringkasan per lauk read-only (stok awal, terjual, sisa layak, rusak/basi, dimakan sendiri, modal) saat `malam_selesai`
- [x] 3.6 Sembunyikan seluruh kontrol edit (toggle makan sendiri, stepper, input uang, tombol simpan) setelah hari terkunci

## 4. Verifikasi

- [x] 4.1 Jalankan type-check/lint proyek (per package.json) dan pastikan lolos
- [x] 4.2 Uji manual alur pagi: input masak baru + modal (dan basi > 0 bila ada carry-over) → "Selesai Input Pagi" → banner sukses + card ringkasan tampil, status `pagi_selesai`, tanpa error; tombol "Ubah Input Pagi" membuka form kembali
- [x] 4.3 Uji manual alur malam: "Simpan & Kunci" → status `malam_selesai` tanpa error constraint/RLS/NOT NULL
