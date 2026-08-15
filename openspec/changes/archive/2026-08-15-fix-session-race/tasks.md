## 1. Store — helper tunggu sesi

- [x] 1.1 Tambahkan `waitForSession()` di `src/stores/session.ts` (early-return bila `loading` sudah `false`, resolve saat `loading` berubah ke `false`)
- [x] 1.2 Pastikan `waitForSession()` diekspos lewat return store

## 2. Boot sequence

- [x] 2.1 Ubah `src/main.ts`: panggil `await session.init()` **sebelum** `app.use(router)`

## 3. Router guard defensif

- [x] 3.1 Ubah `src/router/index.ts`: guard menunggu `session.waitForSession()` untuk route non-publik sebelum mengecek `session.user`

## 4. Verifikasi

- [x] 4.1 Tes manual: reload di `/dashboard` dengan sesi aktif → tetap di `/dashboard`, tidak terlempar ke login
- [x] 4.2 Tes manual: reload di `/dashboard` tanpa sesi → diarahkan ke `/login`
- [x] 4.3 Jalankan lint & typecheck (lihat `package.json` untuk skrip yang tersedia)

## 5. Sesi login & UI nav (anomali redirect saat login)

- [x] 5.1 Ubah `session.login()`: set `user` langsung dari respons `signInWithPassword` (tidak bergantung timing event async)
- [x] 5.2 Ubah `App.vue`: nav bar tidak tampil saat `route.name === 'login'`
- [x] 5.3 Tes manual: login berhasil → diarahkan ke halaman utama, tidak terlempar ke `/login`, menu tampil normal
- [x] 5.4 Tes manual: halaman `/login` tidak menampilkan nav bar dalam kondisi apa pun
- [x] 5.5 Ubah guard router: pengguna ber-sesi yang membuka route publik (mis. `/login`) diarahkan ke `/`
- [x] 5.6 Tes manual: dengan sesi aktif, buka `/login` → diarahkan ke `/`
