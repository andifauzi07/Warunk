## MODIFIED Requirements

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
- **THEN** sistem mengakhiri sesi dan langsung mengarahkan ke halaman login tanpa perlu reload manual halaman
