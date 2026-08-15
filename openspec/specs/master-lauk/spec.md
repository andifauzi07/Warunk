# Master Lauk Specification

## Purpose

Mengelola daftar jenis lauk/masakan (CRUD) beserta kemampuan menonaktifkan lauk musiman tanpa menghapus riwayat datanya.

## Requirements

### Requirement: CRUD Master Lauk

Sistem SHALL menyediakan pembuatan, pembacaan, pembaruan, dan penghapusan daftar jenis lauk/masakan. Setiap lauk memiliki nama, foto opsional, harga jual per porsi, HPP estimasi per porsi, dan satuan porsi.

#### Scenario: Menambah lauk baru

- **WHEN** pengguna mengisi nama lauk, harga jual per porsi, dan HPP estimasi per porsi lalu menyimpan
- **THEN** sistem menampilkan lauk tersebut pada daftar master lauk dan tersedia untuk input pagi

#### Scenario: Mengedit harga jual

- **WHEN** pengguna mengubah harga jual per porsi sebuah lauk
- **THEN** harga baru berlaku untuk hari-hari yang belum terkunci; hari yang sudah `malam_selesai` tidak terpengaruh

#### Scenario: Menghapus lauk

- **WHEN** pengguna menghapus lauk yang sudah pernah tercatat dalam riwayat
- **THEN** sistem mencegah penghapusan atau menandai tidak aktif agar riwayat tetap utuh

### Requirement: Toggle Aktif/Nonaktif Lauk

Sistem SHALL memungkinkan lauk dinonaktifkan (untuk lauk musiman) tanpa menghapus riwayat datanya.

#### Scenario: Menonaktifkan lauk musiman

- **WHEN** pengguna menonaktifkan sebuah lauk
- **THEN** lauk tersebut tidak lagi muncul di daftar input pagi dan malam, tetapi riwayat datanya tetap tersimpan

#### Scenario: Mengaktifkan kembali lauk

- **WHEN** pengguna mengaktifkan kembali sebuah lauk yang nonaktif
- **THEN** lauk tersebut kembali muncul di daftar input pagi dan malam dengan harga dan HPP estimasi yang tersimpan
