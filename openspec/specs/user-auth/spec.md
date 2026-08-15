# User Auth Specification

## Purpose

Menyediakan autentikasi pemilik tunggal warung dan membatasi akses data agar setiap akun hanya dapat mengakses datanya sendiri.

## Requirements

### Requirement: Autentikasi Pemilik Tunggal

Sistem SHALL menyediakan autentikasi email/password untuk satu pemilik warung, dengan seluruh data terkait pada akun tersebut.

#### Scenario: Login berhasil

- **WHEN** pengguna memasukkan email dan password yang benar
- **THEN** sistem membuka sesi dan menampilkan halaman utama aplikasi

#### Scenario: Akses tanpa login

- **WHEN** pengguna yang belum login mencoba membuka halaman aplikasi
- **THEN** sistem mengarahkan ke halaman login

#### Scenario: Logout

- **WHEN** pengguna menekan tombol logout
- **THEN** sistem mengakhiri sesi dan mengarahkan ke halaman login

### Requirement: Keamanan Data Single-Owner

Sistem SHALL membatasi akses data sehingga pemilik hanya dapat membaca dan menulis datanya sendiri (Row Level Security).

#### Scenario: RLS membatasi akses antar pengguna

- **WHEN** terdapat lebih dari satu akun terdaftar pada sistem
- **THEN** setiap akun hanya dapat mengakses baris data miliknya sendiri

#### Scenario: Operasi data membutuhkan sesi aktif

- **WHEN** pengguna melakukan operasi baca/tulis tanpa sesi yang valid
- **THEN** sistem menolak operasi tersebut

### Requirement: Pemulihan Sesi Saat Reload

Sistem SHALL memulihkan sesi yang masih valid dari penyimpanan lokal saat aplikasi dimuat ulang (reload/peremajaan halaman), dan SHALL memutuskan arah navigasi awal hanya setelah status sesi diketahui.

#### Scenario: Reload dengan sesi valid

- **WHEN** pengguna yang masih memiliki sesi valid me-reload halaman aplikasi (mis. `/dashboard`)
- **THEN** sistem tetap menampilkan halaman yang diminta dan tidak mengarahkan ke halaman login

#### Scenario: Reload tanpa sesi

- **WHEN** pengguna tanpa sesi valid me-reload halaman aplikasi yang memerlukan autentikasi
- **THEN** sistem mengarahkan ke halaman login

#### Scenario: Navigasi awal menunggu status sesi

- **WHEN** aplikasi memuat dan router melakukan navigasi awal sebelum status sesi selesai dipulihkan
- **THEN** router menunggu hingga status sesi diketahui sebelum memutuskan redirect

### Requirement: Sesi Tersedia Saat Login Berhasil

Sistem SHALL mengisi status pengguna dari respons login langsung pada saat proses login selesai, tanpa bergantung pada timing event sesi asinkron.

#### Scenario: Login berhasil langsung dikenali

- **WHEN** pengguna berhasil login
- **THEN** sistem langsung mengisi status pengguna dari respons login dan mengarahkan ke halaman utama tanpa terlempar kembali ke halaman login

#### Scenario: Navigasi ke halaman login tidak menampilkan menu utama

- **WHEN** pengguna berada di halaman login
- **THEN** sistem tidak menampilkan menu navigasi utama apa pun kondisi sesi

### Requirement: Pembatasan Akses Halaman Login Saat Ber-Sesi

Sistem SHALL melarang pengguna yang memiliki sesi aktif untuk membuka halaman login, dan SHALL mengarahkan mereka ke halaman utama.

#### Scenario: Pengguna ber-sesi membuka /login

- **WHEN** pengguna yang masih memiliki sesi aktif membuka URL `/login`
- **THEN** sistem mengarahkan ke halaman utama (`/`)
