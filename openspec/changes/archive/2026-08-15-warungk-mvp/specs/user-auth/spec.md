## ADDED Requirements

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
