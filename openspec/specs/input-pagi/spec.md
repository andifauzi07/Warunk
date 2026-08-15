# Input Pagi Specification

## Purpose

Menampilkan carry-over dari hari operasional sebelumnya, mengonfirmasi kelayakan/basi carry-over, dan mencatat porsi masak baru beserta modal bahan di pagi hari.

## Requirements

### Requirement: Tampilkan Carry-Over Otomatis

Sistem SHALL menampilkan daftar carry-over dari sesi malam hari operasional terakhir sebagai baris awal, bersifat read-only (hasil sistem), sebelum input pagi dimulai.

#### Scenario: Carry-over tersedia dari malam kemarin

- **WHEN** pengguna membuka modul Input Pagi dan hari operasional sebelumnya memiliki sisa layak jual
- **THEN** sistem menampilkan per lauk jumlah porsi carry-over beserta HPP asalnya (HPP hari kemarin)

#### Scenario: Tidak ada hari operasional sebelumnya

- **WHEN** pengguna membuka Input Pagi dan tidak ada carry-over dari hari sebelumnya
- **THEN** sistem menampilkan daftar lauk aktif dengan porsi carry-over 0

### Requirement: Konfirmasi Layak/Basi Carry-Over

Sistem SHALL menyediakan konfirmasi per lauk atas carry-over: "Masih Layak Jual" atau "Basi — Catat Rugi". Carry-over yang basi dicatat sebagai Porsi Basi Pagi, dikeluarkan dari stok aktif, dan modalnya dihitung sebagai kerugian (loss).

#### Scenario: Carry-over layak jual

- **WHEN** pengguna menekan "Masih Layak Jual" pada sebuah carry-over
- **THEN** seluruh porsi carry-over tersebut masuk sebagai stok aktif hari ini dengan HPP asal kemarin

#### Scenario: Carry-over basi di pagi hari

- **WHEN** pengguna menekan "Basi — Catat Rugi" pada sebuah carry-over
- **THEN** sistem mencatat seluruh porsi tersebut sebagai Porsi Basi Pagi, mengeluarkannya dari stok aktif, dan mencatat nilai modalnya (HPP carry-over) sebagai kerugian

#### Scenario: Validasi porsi basi pagi

- **WHEN** jumlah porsi yang ditandai basi melebihi jumlah carry-over yang ada
- **THEN** sistem menolak input dan menampilkan peringatan validasi

### Requirement: Input Porsi Masak Baru dan Modal

Sistem SHALL menyediakan input jumlah porsi masak baru per lauk menggunakan stepper besar (bukan keyboard), serta input total modal bahan baku harian per lauk yang bersifat opsional dan boleh diisi belakangan sebelum malam.

#### Scenario: Menambah porsi masak baru

- **WHEN** pengguna menekan tombol stepper untuk menambah porsi masak baru sebuah lauk
- **THEN** stok aktif awal lauk tersebut diperbarui secara live (carry-over layak + porsi baru)

#### Scenario: Modal diisi belakangan

- **WHEN** pengguna menyimpan input pagi tanpa mengisi total modal salah satu lauk
- **THEN** sistem menyimpan input pagi tetap berhasil dan menandai lauk tersebut sebagai belum ada modal (akan memakai HPP estimasi saat malam)

### Requirement: Simpan Input Pagi

Sistem SHALL menyimpan input pagi dengan satu aksi dan mengubah status hari menjadi `pagi_selesai`.

#### Scenario: Simpan input pagi

- **WHEN** pengguna menekan tombol "Selesai Input Pagi" dan semua validasi terpenuhi
- **THEN** sistem menyimpan data pagi dan status hari berubah menjadi `pagi_selesai`

#### Scenario: Mengulang input pagi sebelum malam

- **WHEN** pengguna membuka kembali Input Pagi pada hari yang sama sebelum status `malam_selesai`
- **THEN** sistem menampilkan data yang sudah tersimpan dan mengizinkan koreksi
