## Context

Saat ini data aplikasi ditarik dengan dua paradigma yang tidak konsisten:

- `master_lauk`, `pengaturan`, dan `analitik` memakai vue-query (ter-cache, dibagi antar view).
- Rekonsiliasi + detail hari ini (`useHariIni`) memakai `ref` manual + `watch`; setiap view (`/`, `/pagi`, `/malam`) membuat instance composable sendiri sehingga selalu fetch dari nol. Ditambah `siapkanHari` melakukan dua kali `getDetailByRekonsiliasi` — hasil pengecekan seed tidak dipakai ulang.

Akibatnya halaman utama mengeluarkan 4 request postgREST per kunjungan (2 di antaranya tidak perlu), dan navigasi antar halaman mengulang seluruh pengambilan.

## Goals / Non-Goals

**Goals:**
- Semua server state (termasuk rekonsiliasi + detail hari ini) diambil lewat vue-query dengan query key yang jelas, ter-cache, dan dibagikan antar view.
- Menghapus fetch detail ganda di `siapkanHari` — maksimal satu `GET detail_stok_harian` per siklus penyiapan hari.
- Setelah mutasi hari (simpan pagi/malam, libur, buka lagi), cache di-invalidate sehingga view menampilkan data terbaru.
- Client state (`session`, `tanggal`) tetap di Pinia, tidak ikut di-cache vue-query.

**Non-Goals:**
- Memindahkan sesi auth ke vue-query (tetap Pinia — alasan: auth butuh status sinkron untuk router guard dan SDK Supabase sudah mengelola listener/persistence).
- Membuat halaman utama berhenti total dari penyiapan hari (seed tetap terjadi di query `hari-ini`; memisahkan "status ringan" dan "seed lazy" ke halaman input adalah optimasi lanjutan di luar cakupan).
- Mengubah skema database, RLS, atau backend Supabase.

## Decisions

### D1. `useHariIni` menjadi hook vue-query, bukan Pinia store

Server state milik vue-query. Refactor `useHariIni` menjadi composable berbasis `useQuery` + `useMutation`:

```
['hari-ini', tanggal]  →  siapkanHari(tanggal, laukAktif)   // { rekonsiliasi, detail }

simpanPagi / simpanMalam / tandaiLibur / bukaLag  →  useMutation
    onSuccess → invalidate(['hari-ini', tanggal])
```

**Alternatif dipertimbangkan:** menaruh semua di Pinia store. Ditolak karena menambah boilerplate loading/error/cache manual dan menciptakan paradigma ketiga; pola vue-query sudah dipakai setengah codebase.

### D2. Query `['hari-ini', tanggal]` bergantung pada `master-lauk`

`siapkanHari` butuh daftar lauk aktif untuk seed. Di view, `laukAktif` diperoleh dari `useMasterLauk()`. Query hari ini memakai `enabled` sehingga hanya berjalan setelah master lauk dimuat:

```
useQuery({
  queryKey: ['hari-ini', tanggal],
  queryFn: () => siapkanHari(tanggal, laukAktif),
  enabled: laukAktif.length > 0,
})
```

`laukAktif` tidak masuk query key karena seed hanya peduli `id` lauk; rename/ubah harga lauk tidak mengubah key. QueryFn membaca `laukAktif` terkini dari closure (seeding idempotent, aman direfresh).

**Catatan:** mutasi `master_lauk` (tambah/ubah) meng-invalidate `['hari-ini']` juga, supaya lauk baru aktif ikut ter-seed saat data hari ini di-refresh.

### D3. `siapkanHari` hanya satu kali `GET detail_stok_harian`

Refactor `seedDetailHariIni` agar mengembalikan daftar detail lengkap:

1. Fetch `existing = getDetailByRekonsiliasi(id)` — satu-satunya GET detail.
2. Jika ada lauk yang perlu di-seed, `insert(...).select('*, lauk:lauk_id(*)')` — baris baru dikembalikan dari respons insert yang sama (tanpa GET tambahan).
3. Gabung `existing` + baris hasil insert → dijadikan hasil akhir `siapkanHari`.

Pada kasus umum (hari sudah tersiapkan) tidak ada insert → satu GET detail per siklus. Pada kasus pertama, satu GET + satu insert (dengan hasilnya) — tetap bukan dua GET.

### D4. `staleTime` untuk mencegah refetch saat navigasi

Default vue-query (`staleTime: 0`) tetap akan refetch di background setiap komponen memakai query ter-mount. Untuk benar-benar menghilangkan request berulang saat navigasi dalam sesi yang sama, beri `staleTime` pada query yang jarang berubah:

- `['hari-ini', tanggal]`: `staleTime` ~5 menit (kesegaran dijamin oleh invalidate pada mutasi).
- `['master-lauk']`, `['pengaturan']`: `staleTime` lebih panjang (mis. 5 menit), tetap di-invalidate oleh mutasi masing-masing.

Reload halaman (SPA dimuat ulang) mengosongkan cache → fetch segar, sesuai perilaku lama.

### D5. Invalidasi menyeluruh setelah mutasi

- `simpanPagi` / `simpanMalam` / `tandaiLibur` / `bukaLag` → invalidate `['hari-ini', tanggal]`.
- `simpanMalam` juga invalidate query analitik (`['ringkasan-harian', ...]`, `['tren', ...]`, `['ranking-lauk', ...]`) supaya dashboard langsung segar setelah hari terkunci.
- Mutasi `master_lauk` invalidate `['master-lauk']` (sudah ada) + `['hari-ini', tanggal]`.

### D6. `currentUserId()` digantikan pembacaan session store

`currentUserId()` di `supabase.ts` memanggil `supabase.auth.getUser()` (round-trip `/auth/v1/user`) di beberapa titik (`createRekonsiliasi`, `seedDetailHariIni`, `simpanPagi`, `simpanMalam`). Ganti dengan pembacaan `session.user.id` dari Pinia — sudah diisi dari respons login dan listener, sinkron, tanpa request tambahan.

## Risks / Trade-offs

- **QueryFn `siapkanHari` memiliki efek samping (insert)** → Seeding idempotent (get-or-create). Retry/dedup vue-query aman karena baris yang sama tidak akan di-insert dua kali.
- **`laukAktif` di closure vs key** → Lauk baru aktif tidak ter-seed sampai `['hari-ini']` di-invalidate. Dimitigasi D2 (mutasi master_lauk ikut invalidate hari ini).
- **Perubahan perilaku cache** → Pengguna yang membuka aplikasi lewat beberapa tab bisa melihat data tidak langsung segar di tab kedua (staleTime 5 menit). Dampak rendah untuk aplikasi single-owner.
- **Home tetap memicu seed** (bukan lazy di halaman input) → Masih satu query ter-cache; bukan optimasi penuh tapi konsisten dengan arah A. Didokumentasikan di Non-Goals.

## Migration Plan

1. Refactor `siapkanHari` + `seedDetailHariIni` (D3) — perubahan layanan murni, perilaku view belum berubah.
2. Refactor `useHariIni` jadi hook vue-query (D1, D2, D4, D5).
3. Perbarui ketiga view agar memakai hook baru.
4. Ganti `currentUserId()` dengan pembacaan session store (D6).
5. Verifikasi jumlah request via Network tab: `/` → 2 request segar (master-lauk + hari-ini), navigasi lanjutan → 0 request baru.

Rollback: revert perubahan komposabel/view; perubahan layanan `siapkanHari` tetap aman karena idempotent.

## Open Questions

- Nilai `staleTime` yang tepat (5 menit?) — perlu konfirmasi seberapa cepat pengguna mengharapkan data hari ini segar saat berpindah-pindah halaman.
- Apakah `simpanMalam` perlu memicu invalidasi analitik langsung, atau cukup saat dashboard dibuka (vue-query refetch otomatis karena key berbeda dan stale)?
