## Context

`DashboardView.vue` saat ini menggantung seluruh konten pada satu gate:

```
<div v-if="loading"> Memuat… </div>
<template v-else> ... 3 kartu ... </template>
```

`loading` adalah OR dari `isLoading` ketiga query (`ringkasanHariIni`, `tren`, `ranking`). Ketika pengguna mengganti rentang 7↔30, hanya query `tren` (`['tren', rentang, T]`) dan `ranking` (`['ranking-lauk', rentang, T]`) yang berubah key. Key baru yang belum ter-cache membuat `isLoading` TanStack Query v5 = `true` (`isPending && isFetching`), sehingga **seluruh halaman** — termasuk kartu Ringkasan yang key-nya statis — di-teardown dan diganti "Memuat…". Ini yang terasa sebagai "reload halaman", dan terjadi saat pertama kali membuka dashboard karena cache dingin.

## Goals / Non-Goals

**Goals:**
- Pergantian rentang 7↔30 tidak lagi menghilangkan seluruh halaman.
- Kartu Ringkasan selalu stabil (tidak pernah ikut refetch/hilang).
- Tombol toggle 7/30 tetap bisa diklik selama body kartu Tren loading.
- Ganti indikator "Memuat…" dengan skeleton per panel yang tinggi-nya fixed (tanpa layout shift).
- Error ditangani per panel, bukan satu pesan global di atas halaman.

**Non-Goals:**
- Tidak mengubah data fetching service (`analitik.ts`), skema, atau API Supabase.
- Tidak mengubah perilaku cache antar-halaman (`data-fetching` spec).
- Tidak membuat skeleton sebagai komponen reusable global — cukup inline di `DashboardView.vue` (satu-satunya konsumen).
- Tidak menangani kasus `rentang` diubah ke nilai selain 7/30 (UI hanya menyediakan dua pilihan).

## Decisions

### D1. Per-panel loading gate, bukan gate global

Hapus `v-if="loading"` global dan computed `loading`. Setiap kartu mengelola state-nya sendiri:

| Panel | Gate loading | Gate error | Refetch saat ganti rentang? |
|---|---|---|---|
| Ringkasan | `ringkasanLoading` | `ringkasanError` | Tidak (key statis) |
| Tren | `trenLoading` | `trenError` | Ya |
| Ranking | `rankingLoading` | `rankingError` | Ya |

_Rationale:_ hanya panel yang key query-nya berubah yang perlu menampilkan loading. Meng-OR ketiganya membuat Ringkasan ikut hilang padahal datanya masih valid.

_Alternatif ditolak:_ tetap memakai gate global tapi mengganti `isLoading` → `isFetching`. `isFetching` tetap `true` saat key dingin pertama kali di-fetch (fetch aktif), jadi seluruh halaman masih bisa menghilang. Tidak menyelesaikan masalah.

### D2. `placeholderData: keepPreviousData` pada query `tren` dan `ranking`

Di `useAnalitik.ts`, tambahkan `placeholderData: keepPreviousData` pada kedua query. Efeknya: saat key berganti, `data` tetap memegang data key sebelumnya dan `status` tetap `success`, sehingga `isLoading` tetap `false` — kartu tidak pernah kosong.

**Kenapa aman terhadap perubahan `dari`:** `batang` (`DashboardView.vue:63`) memetakan data **per tanggal** (`peta.get(t)`), bukan per index. Rentang 7 hari (T-6..T) adalah subset dari rentang 30 hari (T-29..T), jadi saat 30→7 semua tanggal window baru tercakup data lama → bar yang tampil benar. Saat 7→30, key 30 sudah ada di cache sejak mount (default `rentang = 30`), sehingga instan tanpa fetch.

**Kasus 30→7 untuk `ranking`:** sama, data ranking per lauk tidak bergantung tanggal spesifik di luar agregasi; data lama tetap representatif sebagai placeholder sementara fetch baru berjalan.

_Alternatif ditolak:_ tanpa placeholder, kartu Tren/Ranking menampilkan skeleton (kedip) tiap ganti rentang — masih halus, tapi bukan "nol kedip". Karena `batang` di-map per tanggal, risiko salah tanggal dari placeholder tidak ada, jadi keepPreviousData dipilih.

### D3. Header kartu Tren (judul + tombol 7/30) di luar gate body

Struktur kartu Tren:

```
[ Header: judul + tombol toggle ]        ← selalu render
[ Body: v-if trenLoading → skeleton
        v-else-if trenError → pesan error
        v-else → chart + ringkasanTren + rentangLupa ]
```

_Rationale:_ pada struktur lama, tombol ada di dalam `<template v-else>` sehingga ikut hilang saat loading dan pengguna terkunci sampai data datang. Memisahkan header memungkinkan rapid-toggle; TanStack Query aman (observer key terakhir yang aktif).

### D4. Skeleton dengan tinggi fixed memakai utilitas Tailwind

Ganti "Memuat…" dengan blok `animate-pulse` (Tailwind) dengan dimensi meniru konten agar tinggi kartu konstan:

- **Ringkasan:** ~7 baris placeholder (teks lebar bervariasi) + kotak selisih.
- **Tren:** area chart setinggi `h-36` + satu baris ringkasan (total/rata-rata).
- **Ranking:** dua kartu, masing-masing ~5 baris.

_Rationale:_ tinggi kartu fixed mencegah layout shift (dan menghindari "lompatan" pada PWA mobile `max-w-md`). Skeleton inline cukup karena hanya dipakai di halaman ini.

### D5. Error per panel memakai `pesanError()`

Hapus `<p v-if="ringkasanError || trenError || rankingError">` global; masing-masing panel menampilkan pesan errornya sendiri lewat `pesanError()` dari `src/lib/format.ts:16` (sudah tersedia, tidak perlu diubah).

_Rationale:_ kegagalan satu panel (mis. tren) tidak lagi "mencemari" tampilan panel lain.

### D6. Struktur template final

```
<div class="p-4">
  [ Judul halaman ]

  [ Kartu Ringkasan ]        gate ringkasanLoading / ringkasanError / isi
  [ Kartu Tren ]             header selalu tampil; body gate trenLoading/trenError/isi
  [ Kartu Ranking ×2 ]       gate rankingLoading / rankingError / daftar
</div>
```

## Risks / Trade-offs

- **[Cache `gcTime` (default 5 menit) kedaluwarsa]** → saat pengguna diam > 5 menit lalu mengganti rentang, key menjadi dingin lagi dan skeleton muncul di kartu terkait. → Diterima; ini perilaku wajar untuk data basi, dan dampaknya kini terisolasi ke kartu yang bersangkutan (bukan seluruh halaman).
- **[`keepPreviousData` menampilkan data lama yang salah tanggal]** → hanya berisiko bila window baru memuat tanggal di luar data lama. Saat ini default 30 → key 30 selalu hangat saat mount, dan 7 ⊂ 30, sehingga tidak terjadi. → Dicatat sebagai asumsi desain; jika di masa depan default rentang diubah, perlu guard.
- **[Rapid toggle 7↔30]** → queryFn di `analitik.ts` tidak meneruskan `signal` dari TanStack Query sehingga fetch lama tidak benar-benar di-cancel, hanya hasilnya dibuang. → Tidak ada race yang menimpa state karena observer selalu memakai key terakhir.
- **[Layout shift antar panel]** → dimitigasi oleh D4 (skeleton fixed height). Kartu dengan tinggi dinamis (mis. baris ringkasan yang hanya muncul saat data ada) sudah merupakan perilaku eksisting, bukan regresi baru.

## Migration Plan

Tidak ada migrasi data. Perubahan hanya UI + komposabel. Deploy normal; rollback = revert commit. Perlu verifikasi manual: (1) buka `/dashboard` pertama kali, (2) toggle 7↔30 bolak-balik, (3) amati tidak ada flash seluruh halaman, tombol tetap aktif, Ringkasan tidak pernah hilang.

## Open Questions

- Apakah skeleton per kartu perlu meniru tinggi persis (mis. chart `h-36`) atau cukup perkiraan? → Diasumsikan meniru, sesuai D4.
- Perlu mempertimbangkan `refetchOnMount`/`staleTime` untuk query analitik? → Di luar lingkup; hanya placeholder + gate yang diubah.
