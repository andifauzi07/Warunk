## 1. Composable — placeholder data

- [x] 1.1 Tambah `placeholderData: keepPreviousData` pada query `tren` di `src/composables/useAnalitik.ts` (import `keepPreviousData` dari `@tanstack/vue-query`)
- [x] 1.2 Tambah `placeholderData: keepPreviousData` pada query `ranking` di `src/composables/useAnalitik.ts`
- [x] 1.3 Verifikasi `type-check` (`npm run type-check`) tidak ada error baru

## 2. DashboardView — struktur template

- [x] 2.1 Hapus computed `loading` (baris 131-133) dan semua referensi `trenLoading`, `rankingLoading`, `ringkasanLoading` yang hanya dipakai di dalamnya
- [x] 2.2 Hapus gate global `<div v-if="loading">` dan `<template v-else>` (baris 145-147) sehingga semua kartu render langsung tanpa wrapper loading
- [x] 2.3 Hapus `<p v-if="ringkasanError || trenError || rankingError">` global (baris 141-143)
- [x] 2.4 Kartu Ringkasan: tambah gate `ringkasanLoading` → skeleton, `ringkasanError` → pesan error (via `pesanError()`), else isi
- [x] 2.5 Kartu Tren: pindahkan header (judul + tombol 7/30) ke luar gate body; body di-gate `trenLoading` → skeleton, `trenError` → pesan error, else chart + ringkasanTren + rentangLupa
- [x] 2.6 Kartu Ranking (terlaris & sering basi): tambah gate `rankingLoading` → skeleton, `rankingError` → pesan error, else daftar

## 3. Skeleton per panel

- [x] 3.1 Buat markup skeleton Ringkasan (`animate-pulse`, ~7 baris placeholder + kotak selisih, tinggi meniru konten)
- [x] 3.2 Buat markup skeleton Tren (area chart `h-36` + satu baris ringkasan total/rata-rata)
- [x] 3.3 Buat markup skeleton Ranking (dua kartu, masing-masing ~5 baris)
- [x] 3.4 Pastikan tidak ada layout shift saat transisi skeleton ↔ konten (tinggi kartu konsisten)

## 4. Verifikasi manual

- [x] 4.1 Buka `/dashboard` pertama kali (cache dingin) lalu toggle 7↔30 — seluruh halaman TIDAK menghilang, hanya kartu Tren/Ranking menampilkan skeleton/data lama, Ringkasan tetap tampil
- [x] 4.2 Tombol 7/30 tetap dapat diklik saat loading (rapid toggle aman)
- [x] 4.3 Simulasi error salah satu query (mis. offline) — hanya panel terkait menampilkan error, panel lain tetap normal
- [x] 4.4 Jalankan `npm run type-check` dan `npm run test` (jika ada) — lolos
