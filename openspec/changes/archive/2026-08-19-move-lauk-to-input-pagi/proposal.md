## Why

Pengguna sering bolak-balik antara halaman Input Pagi dan Master Lauk untuk menambah lauk baru saat sedang input stok pagi. Tombol "Lauk" saat ini hanya ada di halaman Home, memaksa navigasi yang tidak efisien. Perlu akses langsung ke fitur tambah lauk dari halaman Input Pagi.

## What Changes

- Hapus tombol navigasi "Lauk" dari header halaman Home
- Tambah tombol "[+ Lauk]" di header halaman Input Pagi
- Tambah tombol inline "[+ Tambah Lauk Baru]" di bawah daftar lauk pada mode input (sembunyi saat hari terkunci)
- Buat komponen `LaukFormSheet` (bottom sheet) untuk form tambah lauk
- Modifikasi watcher di `useDetailRows` untuk append item baru tanpa reset edit user

## Capabilities

### New Capabilities

- `inline-lauk-creation`: Kemampuan menambah lauk baru langsung dari halaman Input Pagi menggunakan bottom sheet form, dengan validasi nama duplikat dan sinkronisasi otomatis ke daftar input.

### Modified Capabilities

- `input-pagi`: Menambahkan akses ke fitur master lauk (header button + inline button) sehingga pengguna tidak perlu navigasi ke halaman terpisah.

## Impact

- **HomeView.vue**: Hapus tombol `<RouterLink to="/lauk">` dari header
- **InputPagiView.vue**: Tambah header button, inline button, dan integrasi `LaukFormSheet`
- **useDetailRows.ts**: Modifikasi watcher untuk detect dan append item baru
- **New: LaukFormSheet.vue**: Komponen bottom sheet dengan form (nama, harga jual, HPP estimasi)
- **Dependencies**: Tidak ada dependency baru, menggunakan TanStack Query dan Tailwind yang sudah ada
