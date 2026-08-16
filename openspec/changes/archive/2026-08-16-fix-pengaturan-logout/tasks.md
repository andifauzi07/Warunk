## 1. Predikat Navigasi

- [x] 1.1 Buat `src/lib/sessionNavigation.ts` berisi fungsi murni `arahkanKe({ user, route })` sesuai design D1 (public+user → home; protected+!user → login; lainnya → null)
- [x] 1.2 Buat `src/__tests__/sessionNavigation.test.ts` menguji keempat kombinasi predikat (mengikuti gaya `engine.test.ts`, environment node tanpa router)

## 2. Composable useAuthGuard

- [x] 2.1 Buat `src/composables/useAuthGuard.ts`: `watch(() => session.user, ...)` dengan guard `session.loading`, memanggil `arahkanKe`, `router.replace` bila target berbeda dari rute sekarang
- [x] 2.2 Panggil `useAuthGuard()` sekali di `src/App.vue`

## 3. Router Guard

- [x] 3.1 Refactor `src/router/index.ts`: `beforeEach` memakai `arahkanKe({ user, route: to }) ?? true`, tanpa mengubah perilaku navigasi awal (`waitForSession` tetap)

## 4. LoginView

- [x] 4.1 Hapus `router.push('/')` dan import `useRouter` di `src/views/LoginView.vue`; navigasi setelah login ditangani `useAuthGuard`

## 5. PengaturanView (tombol Keluar)

- [x] 5.1 Ubah `keluar()` di `src/views/PengaturanView.vue` dengan try/catch/finally, state `saving`, pesan error memakai `pesanError`
- [x] 5.2 Tombol Keluar menampilkan "Keluar…" + `disabled` saat proses berjalan

## 6. Verifikasi

- [x] 6.1 Jalankan `npm run test` (semua unit test lulus, termasuk yang baru)
- [x] 6.2 Jalankan `npm run type-check`
- [x] 6.3 Verifikasi manual: klik Keluar → langsung `/login` tanpa reload; reload halaman terlindung tanpa sesi → `/login`; login → `/`; logout di satu tab → tab lain ikut ke `/login`
