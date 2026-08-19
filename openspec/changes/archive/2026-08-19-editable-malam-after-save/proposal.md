## Why

Pengguna sering kali perlu mengedit input malam setelah tersimpan — misalnya salah menghitung uang laci, lupa mencatat porsi makan sendiri, atau ingin mengoreksi sisa layak jual. Saat ini, setelah status `malam_selesai`, semua field terkunci permanen dan tidak bisa diubah. Padahal input pagi sudah punya pola edit-after-save ("Ubah Input Pagi") yang memungkinkan koreksi sebelum malam selesai. Input malam butuh kemampuan serupa.

## What Changes

- **InputMalamView**: Tambah mode edit (`editMode`) dengan tombol "Ubah Input Malam" di section ringkasan terkunci. Semua field (sisa layak, rusak, konsumsi, uang laci, uang digital) bisa diedit. Field modal bahan dihapus dari UI malam karena sudah ditangani di input pagi. Toggle `makanSendiri` di-derive dari data tersimpan.
- **HomeView**: Ganti link "Input Malam" (yang selalu muncul) dengan tombol "Koreksi Input Malam" saat status `malam_selesai`. Sertakan AlertDialog konfirmasi sebelum navigasi ke `/malam`.
- **rekonsiliasi.ts (simpanMalam)**: Tambah guard — kalau status sudah `malam_selesai`, revert ke `pagi_selesai` dulu sebelum upsert detail, sehingga database trigger `hitung_agregat_rekonsiliasi()` bisa jalan menghitung ulang agregat. Setelah upsert, set balik ke `malam_selesai`.
- **input-malam spec**: Modifikasi requirement "Mode Ringkasan Setelah Hari Terkunci" dan "Peringatan HPP Estimasi" — tambah kemampuan edit dan hapus referensi modal di malam.

## Capabilities

### New Capabilities

- `edit-malam-flow`: Alur edit input malam setelah tersimpan — mencakup tombol edit, AlertDialog konfirmasi, mode edit di InputMalamView, dan navigasi dari HomeView.

### Modified Capabilities

- `input-malam`: Requirement "Mode Ringkasan Setelah Hari Terkunci" diubah — setelah terkunci, sistem menampilkan tombol "Ubah Input Malam" dengan AlertDialog, bukan hanya ringkasan read-only. Requirement "Peringatan HPP Estimasi" dihapus karena field modal dihapus dari malam.

## Impact

- `src/views/InputMalamView.vue` — tambah `editMode`, `showDialog`, tombol edit, AlertDialog, hapus field modal
- `src/views/HomeView.vue` — ganti RouterLink "Input Malam" dengan tombol + AlertDialog saat `malam_selesai`
- `src/lib/services/rekonsiliasi.ts` — modifikasi `simpanMalam()` dengan guard status revert
- `src/__tests__/component/InputMalamView.test.ts` — update test cases untuk flow edit
- `src/__tests__/component/DashboardView.test.ts` — mungkin perlu update mock data
- Database trigger tidak berubah — guard di-handle di service layer
