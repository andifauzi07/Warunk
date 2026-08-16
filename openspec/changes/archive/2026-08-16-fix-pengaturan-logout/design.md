## Context

Aplikasi Vue 3 + Pinia + Vue Router + Supabase. Session dikelola `src/stores/session.ts` (ref `user`, `loading`, subscribe `onAuthStateChange`). Router guard di `src/router/index.ts:46-53` hanya berjalan saat navigasi. Akibatnya, saat `supabase.auth.signOut()` membuat `user` menjadi `null` (dari `/pengaturan`), tidak ada navigasi yang terpicu → halaman diam; reload manual baru memicu guard → redirect ke `/login`.

Masalah yang sama juga terjadi (silent) pada kasus: token kedaluwarsa, dan logout di tab lain (Supabase sinkronisasi lintas-tab via `localStorage` + `BroadcastChannel`, `signOut()` default scope `global`). Selain itu `LoginView.vue:18` menangani redirect login secara imperatif (`router.push('/')`) — satu-satunya navigasi manual berbasis sesi.

## Goals / Non-Goals

**Goals:**
- Logout dari `/pengaturan` langsung menampilkan halaman login tanpa reload.
- Satu sumber kebenaran untuk keputusan navigasi berbasis sesi, dipakai oleh router guard maupun watcher reaktif.
- Menangani login, logout, kedaluwarsa token, dan sinkronisasi antar-tab secara seragam dan simetris.
- Menghapus navigasi imperatif di `LoginView` (mengikuti keputusan pengguna: simetris, bukan hibrida).

**Non-Goals:**
- Tidak mengubah skema data atau API Supabase.
- Tidak menambahkan halaman khusus "sesi berakhir"; kedaluwarsa langsung diarahkan ke `/login`.
- Tidak menambah mekanisme "kembali ke halaman asal" (redirect query) — cukup `/` sebagai tujuan.
- Tidak merombak cara `init()`/`waitForSession()` bekerja.

## Decisions

### D1. Predikat navigasi murni `arahkanKe` di `src/lib/sessionNavigation.ts`

Fungsi murni, menerima `{ user, route }` → mengembalikan target atau `null`:

```
public && user            → { name: 'home' }
public && !user           → null        (lanjut, mis. /login)
protected && !user        → { name: 'login' }
protected && user         → null
```

Rasional: dapat di-unit-test dengan konvensi suite yang ada (`environment: node`, tanpa DOM/router — lihat `vitest.config.ts`). Guard dan watcher memakai fungsi yang sama sehingga tidak bisa menyimpang (persyaratan "Predikat Navigasi Tunggal").

Alternatif ditolak: menaruh logika langsung di guard dan menduplikasinya di watcher (dua tempat bisa tidak sinkron), atau meletakkan predikat di dalam store (menambah tanggung jawab store yang bukan urusannya).

### D2. Composable `useAuthGuard()` di `src/composables/`, dipanggil dari `App.vue`

`App.vue` adalah komponen akar yang selalu ter-mount, sudah memegang store (`useSessionStore()`). Composable ini:

```ts
watch(() => session.user, () => {
  if (session.loading) return
  const tujuan = arahkanKe({ user: session.user, route: router.currentRoute.value })
  if (tujuan && tujuan.name !== router.currentRoute.value.name)
    router.replace(tujuan)
})
```

- Menggunakan `router.replace` (bukan `push`) agar setelah logout tombol *back* tidak kembali ke halaman yang sudah login.
- Anti-loop: `tujuan.name !== nama rute sekarang` → hanya redirect saat benar-benar berpindah; `/login` dan `/home` bersifat *absorbing* sehingga tidak ada siklus.
- Guard `session.loading` mencegah redirect prematur saat `init()` masih berjalan (urutan `init()`: set `user` → set `loading=false`).

Alternatif ditolak: menaruh `watch` langsung di `router/index.ts` module scope (side-effect di module, rawan double-register saat HMR); menaruh di store (menciptakan dependensi store → router, dan cycle import yang sudah ada `session ↔ supabase` makin rawan).

### D3. Router guard di-refactor memakai `arahkanKe`

```
router.beforeEach(async (to) => {
  const session = useSessionStore()
  await session.waitForSession()
  return arahkanKe({ user: session.user, route: to }) ?? true
})
```

Perilaku guard tidak berubah; hanya mengonsolidasikan logika ke satu predikat.

### D4. Hapus `router.push('/')` di `LoginView.vue`

Setelah `await session.login(...)` sukses, `user` terisi → watcher `useAuthGuard` melihat rute sekarang `/login` (public) + user ada → `replace({ name: 'home' })`. Navigasi menjadi murni reaktif. `LoginView` hanya: kirim kredensial, tampilkan error pada kegagalan.

Analisis keamanan: pada kegagalan login, `user` tetap `null` → watcher tidak bereaksi → pesan error tetap tampil. Kedua pemicu (login & logout) menuju rute yang sama dengan hasil yang sama, sehingga idempotent.

### D5. Tombol Keluar di `PengaturanView.vue`: pending state + error handling

`keluar()` dibungkus try/catch/finally; tombol menampilkan "Keluar…" dan `disabled` selama proses, menampilkan pesan error bila `signOut()` gagal (konsisten dengan pola tombol Simpan). Catatan: `signOut()` supabase-js v2 tetap membersihkan sesi lokal dan emit `SIGNED_OUT` walau jaringan gagal, sehingga watcher tetap bekerja — pending state & pesan error murni untuk feedback UX.

## Risks / Trade-offs

- [Navigasi login menjadi implisit] Pembaca `LoginView` tidak melihat redirect di sana → Mitigasi: nama composable (`useAuthGuard`) dan komentar singkat menjelaskan bahwa navigasi dikelola di satu tempat.
- [Redirect agresif pada kedaluwarsa token] Pengguna terlempar ke login tanpa aksi → Diterima sebagai keputusan (Non-Goals), karena sesi memang sudah tidak valid dan call data akan 401.
- [Watcher ganda bila `useAuthGuard` dipanggil di lebih dari satu tempat] → Mitigasi: hanya dipanggil sekali di `App.vue`; komposisi composable dengan guard penyimpanan intern opsional bila risiko HMR menjadi nyata.
- [Race antara watcher dan guard saat navigasi manual] Keduanya menghasilkan keputusan identik (predikat sama) → tidak ada konflik yang berbahaya.

## Migration Plan

- Tidak ada perubahan data/skema; deploy frontend biasa.
- Rollback: revert perubahan `src/composables/`, `src/lib/sessionNavigation.ts`, `router/index.ts`, `LoginView.vue`, `App.vue`, `PengaturanView.vue`.
- Verifikasi manual: klik Keluar → langsung `/login`; reload halaman terlindung tanpa sesi → `/login`; login → `/`; logout di satu tab → tab lain ikut ke `/login`.

## Open Questions

- Apakah `signOut()` perlu opsi `scope: 'local'` vs `'global'`? Saat ini default `'global'` yang justru mendukung sinkronisasi antar-tab — tidak ada perubahan.
