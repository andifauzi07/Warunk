## Why

Tombol Keluar di halaman `/pengaturan` tidak memberikan respons apa pun saat ditekan; halaman baru mengarah ke login setelah reload manual. Akar masalahnya: guard router hanya berjalan saat terjadi navigasi, sedangkan logout (`supabase.auth.signOut()`) mengubah state sesi tanpa memicu navigasi. Perilaku ini menyimpang dari spec `user-auth` yang sudah mensyaratkan "logout mengakhiri sesi dan mengarahkan ke halaman login".

## What Changes

- Menambahkan composable `useAuthGuard` yang memantau perubahan status pengguna secara reaktif dan mengarahkan navigasi sesuai kondisi sesi (satu sumber kebenaran untuk session → navigasi).
- Menjadikan arah navigasi berbasis sesi **simetris**: pengguna logout/kedaluwarsa/keluar dari tab lain → `/login`; pengguna login/ber-sesi membuka halaman publik → halaman utama.
- Menghapus `router.push('/')` dari `LoginView.vue`; navigasi setelah login ditangani oleh `useAuthGuard`.
- Me-refactor `router/index.ts` agar guard berbagi fungsi predikat yang sama dengan `useAuthGuard`.
- Menambahkan state "Keluar…" dan penanganan error pada tombol Keluar di `PengaturanView.vue`.
- Tidak ada **BREAKING** change pada API publik.

## Capabilities

### New Capabilities

- `session-navigation`: Navigasi aplikasi yang digerakkan oleh perubahan status sesi (login, logout, kedaluwarsa token, sinkronisasi antar-tab) secara reaktif dan seragam.

### Modified Capabilities

- `user-auth`: Memperjelas dan memperkuat persyaratan logout agar redirect terjadi langsung tanpa reload, serta mencakup kasus kedaluwarsa sesi dan logout dari tab lain.

## Impact

- `src/composables/useAuthGuard.ts` (baru): watcher reaktif atas `session.user`.
- `src/lib/sessionNavigation.ts` (baru): fungsi murni `arahkanKe` yang dipakai guard dan composable.
- `src/router/index.ts`: guard memakai `arahkanKe`.
- `src/views/LoginView.vue`: hapus `router.push('/')`.
- `src/views/PengaturanView.vue`: tombol Keluar dengan pending state + error handling.
- `src/App.vue`: memanggil `useAuthGuard()`.
- `src/__tests__/sessionNavigation.test.ts` (baru): unit test fungsi murni.
