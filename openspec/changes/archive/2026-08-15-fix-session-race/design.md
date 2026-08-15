## Context

Aplikasi Vue 3 + Pinia + vue-router + Supabase. Pada boot saat ini (`src/main.ts`), router dipasang (`app.use(router)`) sebelum `await session.init()` dijalankan. Akibatnya navigasi awal dieksekusi oleh guard `beforeEach` (`src/router/index.ts`) yang membaca `session.user` — masih `null` karena `getSession()` belum selesai — sehingga setiap reload dengan sesi valid mengarahkan ke `/login`.

Store (`src/stores/session.ts`) sudah menyediakan ref `loading` (default `true`, di-set `false` setelah `init()` selesai), namun belum pernah dipakai oleh guard maupun boot sequence.

## Goals / Non-Goals

**Goals:**
- Navigasi awal tidak pernah terjadi sebelum status sesi diketahui.
- Guard tetap bekerja benar meski ada jalur navigasi yang memicu lebih awal (defensif).
- Tidak ada perubahan perilaku login/logout; hanya memperbaiki pemulihan sesi saat reload.

**Non-Goals:**
- Tidak mengubah skema RLS, alur login, atau penyimpanan data.
- Tidak menambahkan halaman loading/splash baru — urutan boot diubah sehingga router baru aktif saat sesi diketahui.
- Tidak menangani kasus multi-tab / sinkronisasi lintas tab (out of scope).

## Decisions

### D1: Pindahkan `await session.init()` sebelum `app.use(router)` di `main.ts`

```ts
const session = useSessionStore()
await session.init()
app.use(router)
```

Sesuai dokumentasi vue-router: navigasi awal dijalankan saat router dipasang. Dengan memastikan sesi sudah dipulihkan terlebih dahulu, navigasi awal `beforeEach` selalu melihat status sesi final.

- **Alternatif**: menunda guard dengan promise. Kurang disukai sebagai solusi tunggal karena lebih kompleks dan tetap ada window navigasi yang menunggu.
- **Alternatif**: mengandalkan event `INITIAL_SESSION` dari `onAuthStateChange`. Bergantung pada timing event yang kurang deterministik; `getSession()` eksplisit lebih jelas.

### D2: Guard defensif menunggu `loading` selesai

Guard mengembalikan `true` untuk route publik, lalu menunggu `session.loading === false` sebelum mengecek `session.user`. Implementasi tunggu memakai helper `waitForSession()` dari store (berbasis reaktivitas, bukan polling).

- **Alternatif**: polling `while (loading) await sleep()`. Berfungsi tapi boros dan kasar; helper berbasis `watch` lebih elegan.

### D3: Helper `waitForSession()` di store

```ts
async function waitForSession() {
  if (!loading.value) return
  await new Promise<void>((resolve) => {
    const stop = watch(loading, (val) => {
      if (!val) {
        stop()
        resolve()
      }
    })
  })
}
```

Dipakai oleh guard. Menjaga semua logika tunggu sesi berada di satu tempat (store), mudah di-test.

## Risks / Trade-offs

- [Guard menunggu tanpa batas jika `init()` tidak pernah selesai] → `loading` dijamin di-set `false` di akhir `init()`; `getSession()` dari supabase-js selalu resolve.
- [Helper `watch` tidak ikut dipanggil ulang jika `loading` sudah false saat pemanggilan] → D3 menangani kasus itu dengan early-return.
- [Mengubah urutan boot membuat router aktif lebih lambat sebesar durasi `getSession()` (satu panggilan lokal ke localStorage, umumnya ms)] → Dampak minimal; tidak ada UI yang menunggu karena belum ada yang dirender sebelum mount.
