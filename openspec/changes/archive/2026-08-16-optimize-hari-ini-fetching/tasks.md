## 1. Perbaikan Layanan Rekonsiliasi (satu GET detail per siklus)

- [x] 1.1 Refactor `seedDetailHariIni` di `src/lib/services/rekonsiliasi.ts` agar mengembalikan daftar `DetailStokLengkap` lengkap: fetch `existing` sekali, dan bila ada lauk yang perlu di-seed, gunakan `insert(...).select('*, lauk:lauk_id(*)')` lalu gabung baris baru dengan `existing`
- [x] 1.2 Perbarui `siapkanHari` agar memakai hasil `seedDetailHariIni` sebagai hasil akhir, menghapus `getDetailByRekonsiliasi` kedua
- [x] 1.3 Tambahkan/pastikan unit test untuk `siapkanHari` dan `seedDetailHariIni` (idempotensi: dua pemanggilan menghasilkan jumlah baris yang sama, tanpa request GET detail ganda)

## 2. Refactor useHariIni Menjadi Hook Vue Query

- [x] 2.1 Ubah `src/composables/useHariIni.ts` menjadi berbasis `useQuery` dengan query key `['hari-ini', tanggal]`, queryFn `siapkanHari(tanggal, laukAktif)`, `enabled` saat `laukAktif.length > 0`, dan `staleTime` ~5 menit (konfirmasi nilai final di Open Questions)
- [x] 2.2 Konversi `simpanPagi`, `simpanMalam`, `tandaiLibur`, `bukaLag` menjadi `useMutation` dengan `onSuccess` meng-invalidate `['hari-ini', tanggal]`
- [x] 2.3 Buat `simpanMalam` juga meng-invalidate query analitik (`ringkasan-harian`, `tren`, `ranking-lauk`)
- [x] 2.4 Update mutasi di `useMasterLauk` agar meng-invalidate `['hari-ini', tanggal]` juga (lauk baru aktif ikut ter-seed)

## 3. Perbarui View

- [x] 3.1 Perbarui `src/views/HomeView.vue` memakai hook baru (status hari ini dari query ter-cache), hapus `ref` + `watch` lama
- [x] 3.2 Perbarui `src/views/InputPagiView.vue` memakai hook baru
- [x] 3.3 Perbarui `src/views/InputMalamView.vue` memakai hook baru
- [x] 3.4 Pastikan tidak ada pemakaian lama `useHariIni` (instance per-view) yang tersisa

## 4. Optimasi Panggilan Auth

- [x] 4.1 Ganti `currentUserId()` di `src/lib/supabase.ts` dan penggunaannya pada service dengan pembacaan `session.user.id` dari Pinia store sesi (tanpa `getUser()` round-trip)
- [x] 4.2 Pastikan tidak ada panggilan `supabase.auth.getUser()` redundant yang tersisa

## 5. Verifikasi

- [x] 5.1 Jalankan `bun run type-check` dan `bun test` (vitest) — semua lulus
- [x] 5.2 Verifikasi manual di Network tab: kunjungan dingin ke `/` hanya memuat `hari-status` (master-lauk tidak lagi di-fetch di halaman utama); `/lauk`, `/pagi`, `/malam` tetap memuat master-lauk dengan `staleTime` 5 menit
- [x] 5.3 Verifikasi tidak ada lagi dua `GET detail_stok_harian` identik dalam satu kunjungan halaman utama
- [x] 5.4 Verifikasi invalidasi: simpan input pagi → kembali ke `/` menampilkan status `pagi_selesai` tanpa reload; tandai libur → status `libur` tampil di semua view
