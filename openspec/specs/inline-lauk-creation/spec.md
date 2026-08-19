# Inline Lauk Creation Specification

## Purpose

Menyediakan kemampuan menambah lauk baru langsung dari halaman Input Pagi menggunakan bottom sheet form, tanpa perlu navigasi ke halaman Master Lauk.

## Requirements

### Requirement: Tambah Lauk Baru dari Input Pagi

Sistem SHALL menyediakan kemampuan menambah lauk baru langsung dari halaman Input Pagi menggunakan bottom sheet form, tanpa perlu navigasi ke halaman Master Lauk.

#### Scenario: Membuka form tambah lauk via header button

- **WHEN** pengguna menekan tombol "[+ Lauk]" di header halaman Input Pagi
- **THEN** sistem menampilkan bottom sheet form dengan field: nama lauk, harga jual per porsi, HPP estimasi per porsi

#### Scenario: Membuka form tambah lauk via inline button

- **WHEN** pengguna menekan tombol "[+ Tambah Lauk Baru]" di bawah daftar lauk pada mode input
- **THEN** sistem menampilkan bottom sheet form yang sama dengan header button

#### Scenario: Inline button tersembunyi saat hari terkunci

- **WHEN** pengguna membuka Input Pagi pada hari dengan status `malam_selesai`
- **THEN** tombol "[+ Tambah Lauk Baru]" TIDAK ditampilkan

#### Scenario: Simpan lauk baru berhasil

- **WHEN** pengguna mengisi nama lauk, harga jual, dan HPP estimasi lalu menekan "Simpan" dan tidak ada duplikat nama
- **THEN** sistem menyimpan lauk baru ke tabel `master_lauk`, menutup bottom sheet, dan lauk baru langsung muncul sebagai baris input di halaman Input Pagi

#### Scenario: Validasi nama wajib diisi

- **WHEN** pengguna menekan "Simpan" tanpa mengisi nama lauk
- **THEN** sistem menampilkan pesan error "Nama lauk wajib diisi" dan tidak menyimpan

#### Scenario: Validasi nama duplikat

- **WHEN** pengguna mengisi nama lauk yang sudah ada (case-insensitive) dan menekan "Simpan"
- **THEN** sistem menampilkan pesan error "Nama lauk sudah ada" dan tidak menyimpan

#### Scenario: Error saat menyimpan

- **WHEN** penyimpanan lauk baru gagal (misalnya koneksi terputus)
- **THEN** sistem menampilkan pesan error yang menjelaskan penyebab kegagalan dan bottom sheet tetap terbuka

### Requirement: Lauk Baru Sinkron dengan Daftar Input

Sistem SHALL memastikan lauk yang baru ditambahkan melalui form inline langsung tersedia sebagai baris input di halaman Input Pagi tanpa perlu refresh halaman.

#### Scenario: Lauk baru muncul di daftar input

- **WHEN** pengguna berhasil menambah lauk baru melalui bottom sheet form
- **THEN** baris input untuk lauk baru tersebut langsung muncul di daftar dengan carry-over 0 dan semua field input siap digunakan

#### Scenario: Data existing tidak terganggu

- **WHEN** pengguna sedang mengisi form input lauk lain dan menambah lauk baru
- **THEN** data input yang sedang diketik pada lauk lain TIDAK hilang atau ter-reset
