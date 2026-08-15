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

Sistem SHALL menyimpan input pagi dengan satu aksi dan mengubah status hari menjadi `pagi_selesai`, dengan menyertakan seluruh state baris (termasuk `user_id`, `rekonsiliasi_id`, `lauk_id`, `porsi_carry_over`, `hpp_carry_over_porsi`) pada setiap penulisan baris detail sehingga kandidat penulisan selalu valid terhadap RLS, NOT NULL, dan CHECK — baik untuk baris baru maupun baris yang sudah ada. Bila penyimpanan gagal, sistem SHALL menampilkan pesan kesalahan yang mencerminkan penyebab sesungguhnya, bukan pesan generik.

#### Scenario: Simpan input pagi

- **WHEN** pengguna menekan tombol "Selesai Input Pagi" dan semua validasi terpenuhi
- **THEN** sistem menyimpan data pagi dan status hari berubah menjadi `pagi_selesai`

#### Scenario: Mengulang input pagi sebelum malam

- **WHEN** pengguna membuka kembali Input Pagi pada hari yang sama sebelum status `malam_selesai`
- **THEN** sistem menampilkan data yang sudah tersimpan dan mengizinkan koreksi

#### Scenario: Simpan input pagi pada baris yang sudah ada

- **WHEN** pengguna menyimpan input pagi dan baris detail untuk sebuah lauk sudah tersimpan sebelumnya
- **THEN** sistem memperbarui baris tersebut berhasil karena setiap penulisan menyertakan state baris lengkap (termasuk `user_id` pemilik) sehingga tidak ditolak RLS, NOT NULL, maupun CHECK

#### Scenario: Penyimpanan gagal menampilkan penyebab

- **WHEN** penyimpanan input pagi ditolak oleh basis data (mis. kebijakan RLS)
- **THEN** sistem menampilkan pesan yang mencerminkan penyebab sesungguhnya dari respon basis data, bukan "Terjadi kesalahan"

### Requirement: Umpan Balik Simpan dan Mode Ringkasan

Sistem SHALL menampilkan pesan sukses setelah input pagi tersimpan, lalu menampilkan ringkasan penting per lauk dalam bentuk card beserta tombol "Ubah Input Pagi" untuk mengoreksi selama hari belum terkunci.

#### Scenario: Simpan pagi berhasil

- **WHEN** pengguna menekan "Selesai Input Pagi" dan penyimpanan berhasil
- **THEN** sistem menampilkan banner sukses "Input pagi tersimpan" dan card ringkasan per lauk (sisa kemarin, basi pagi, masak baru, modal, stok aktif)

#### Scenario: Membuka kembali hari yang sudah diinput pagi

- **WHEN** pengguna membuka Input Pagi pada hari dengan status `pagi_selesai`
- **THEN** sistem menampilkan mode ringkasan (card informasi penting) dengan tombol "Ubah Input Pagi"

#### Scenario: Mengoreksi input pagi

- **WHEN** pengguna menekan "Ubah Input Pagi" pada mode ringkasan dan hari belum terkunci
- **THEN** sistem menampilkan kembali form input lengkap untuk dikoreksi, dan setelah disimpan kembali ke mode ringkasan

#### Scenario: Hari sudah terkunci

- **WHEN** pengguna membuka Input Pagi pada hari dengan status `malam_selesai`
- **THEN** sistem menampilkan card ringkasan tanpa tombol ubah beserta keterangan bahwa hari terkunci
