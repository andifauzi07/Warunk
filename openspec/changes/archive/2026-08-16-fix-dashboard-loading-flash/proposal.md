## Why

Saat pengguna mengganti mode rentang 7 hari ↔ 30 hari pada halaman `/dashboard` (terutama saat pertama kali membuka halaman), seluruh dashboard tampak "reload" — semua kartu menghilang dan diganti teks "Memuat…". Penyebabnya: `DashboardView` menggantung seluruh halaman pada satu gate `loading` (`v-if="loading"`), padahal hanya query `tren` dan `ranking` yang berubah key saat rentang diganti, dan karena key baru belum ter-cache maka `isLoading` TanStack Query menjadi `true`.

## What Changes

- Hapus gate loading global (`v-if="loading"` + computed `loading`) pada `DashboardView.vue` yang menyembunyikan seluruh konten.
- Ganti dengan **per-panel loading gate**: kartu Ringkasan, Tren, dan Ranking masing-masing menampilkan state loading/error/isi-nya sendiri.
- Kartu Ringkasan tidak lagi ikut menghilang saat ganti rentang, karena query-nya tidak pernah refetch.
- Header kartu Tren (termasuk tombol toggle 7/30) **selalu tampil**, bahkan saat body kartu sedang loading, sehingga pengguna tidak terkunci saat toggle.
- Tambahkan `placeholderData: keepPreviousData` pada query `tren` dan `ranking` di `useAnalitik.ts` agar data rentang lama tetap tampil (benar karena dipetakan per tanggal) sementara data rentang baru di-fetch — tanpa flash.
- Ganti indikator loading global "Memuat…" dengan **skeleton per panel** yang tinggi-nya fixed (tanpa layout shift).
- Pindahkan penanganan error global (satu baris di atas halaman) menjadi **error per panel**.

## Capabilities

### New Capabilities

_(tidak ada — ini perbaikan perilaku halaman yang sudah ada)_

### Modified Capabilities

- `dashboard-analitik`: perilaku tampilan loading/refresh saat pengguna mengganti rentang 7/30 hari berubah — loading tidak lagi menyembunyikan seluruh halaman, melainkan per panel, dengan data rentang sebelumnya tetap tampil selama fetch baru berjalan.

## Impact

- `src/views/DashboardView.vue` — restrukturisasi gate loading/error global menjadi per panel; tombol toggle dipisah dari gate body; skeleton per panel.
- `src/composables/useAnalitik.ts` — tambah `placeholderData: keepPreviousData` pada query `tren` dan `ranking`.
- `src/lib/format.ts` — fungsi `pesanError()` yang sudah ada dipakai untuk pesan error per panel (tanpa perubahan).
- Tidak ada perubahan API Supabase, skema, atau dependency baru.
