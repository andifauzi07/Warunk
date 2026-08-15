## Why

Setiap reload halaman (mis. di `/dashboard`), pengguna yang masih memiliki sesi valid ditendang ke halaman login. Penyebabnya race condition: router guard membaca `session.user` (masih `null`) sebelum `session.init()` selesai mengambil sesi dari localStorage. Session-nya sebenarnya masih valid — hanya saja aplikasi menampilkan login karena navigasi awal terjadi terlalu cepat.

## What Changes

- Mengubah urutan boot di `src/main.ts`: `session.init()` dipanggil dan di-await **sebelum** `app.use(router)`, sehingga navigasi awal tidak pernah berjalan sebelum status sesi diketahui.
- Menjadikan router guard (`src/router/index.ts`) defensif: menunggu `loading` session selesai sebelum memutuskan redirect, sehingga navigasi yang keburu jalan tetap aman.
- Menambahkan mekanisme tunggu yang bersih (helper `waitForSession()` di store) sebagai pengganti polling.

## Capabilities

### New Capabilities

### Modified Capabilities

- `user-auth`: Menambahkan persyaratan bahwa sesi valid harus bertahan dan dipulihkan saat reload/peremajaan halaman, tanpa mengarahkan pengguna ke login.

## Impact

- `src/main.ts` — urutan inisialisasi session vs pemasangan router.
- `src/stores/session.ts` — helper tunggu `waitForSession()` (atau setara).
- `src/router/index.ts` — guard menunggu status loading session.
- `src/__tests__/` — kemungkinan test unit untuk boot sequence dan guard.
