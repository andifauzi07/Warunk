## Why

Halaman utama (`/`) memicu 4 request postgREST setiap kali dibuka setelah login, padahal halaman hanya menampilkan status hari ini. Akar masalahnya adalah inkonsistensi paradigma data fetching: `master_lauk`, `pengaturan`, dan `analitik` memakai vue-query (ter-cache, dibagi antar view), tetapi `useHariIni` memakai ref manual sehingga setiap view membuat state baru dan selalu fetch dari nol — plus satu fetch detail murni duplikat di dalam `siapkanHari`. Akibatnya navigasi Home → Pagi → Malam mengulang seluruh pengambilan data hari ini berulang kali.

## What Changes

- Pindahkan `useHariIni` dari ref manual ke vue-query sebagai server state, dengan query key per tanggal sehingga data dibagikan dan ter-cache antar view (Home, Input Pagi, Input Malam).
- Ubah aksi `simpanPagi`, `simpanMalam`, `tandaiLibur`, dan `bukaLag` menjadi mutation vue-query yang meng-invalidate cache hari tersebut setelah berhasil.
- Hapus pengambilan detail ganda di `siapkanHari`: hasil fetch detail dari `seedDetailHariIni` dipakai ulang sebagai hasil akhir, bukan fetch ulang.
- Halaman utama tidak lagi memicu refetch data yang sudah ter-cache pada navigasi SPA yang sama.

## Capabilities

### New Capabilities

- `data-fetching`: pengambilan server state (data Supabase) yang ter-cache, ter-dedup, dan dibagi antar view melalui vue-query, dengan invalidasi cache setelah mutasi sehingga semua view otomatis segar.

### Modified Capabilities

Tidak ada. Perubahan ini bersifat implementasi data fetching; requirements bisnis pada `rekonsiliasi-mundur`, `input-pagi`, `input-malam`, dan spec lainnya tidak berubah.

## Impact

- `src/composables/useHariIni.ts`: refactor dari ref manual menjadi hook vue-query (query + mutation).
- `src/lib/services/rekonsiliasi.ts`: menghapus fetch detail ganda di `siapkanHari`.
- `src/views/HomeView.vue`, `src/views/InputPagiView.vue`, `src/views/InputMalamView.vue`: memakai hook baru.
- Client state (`session`, `tanggal`) tetap di Pinia; tidak ada perubahan backend, skema database, maupun konfigurasi Supabase.
