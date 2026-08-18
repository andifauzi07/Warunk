## MODIFIED Requirements

### Requirement: Toggle Aktif/Nonaktif Lauk

Sistem SHALL memungkinkan lauk dinonaktifkan (untuk lauk musiman) tanpa menghapus riwayat datanya. Sebelum menonaktifkan, sistem SHALL memproses carry-over yang masih ada dengan memindahkan seluruh porsi carry-over ke porsi basi pagi (zero carry-over), dan menampilkan konfirmasi kepada pengguna sesuai kondisi carry-over.

#### Scenario: Menonaktifkan lauk dengan carry-over

- **WHEN** pengguna menonaktifkan sebuah lauk yang memiliki `porsi_carry_over > 0` pada hari ini
- **THEN** sistem menampilkan pesan konfirmasi: "Menonaktifkan lauk ini, akan membuat sisa porsi kemarin dianggap basi/rusak !"

#### Scenario: Konfirmasi deaktivasi dengan carry-over

- **WHEN** pengguna menekan "Ya" pada konfirmasi deaktivasi lauk yang memiliki carry-over
- **THEN** sistem memindahkan seluruh `porsi_carry_over` ke `porsi_basi_pagi` (zero carry-over) pada baris detail hari ini, lalu mengubah `is_active` lauk menjadi `false`

#### Scenario: Menonaktifkan lauk tanpa carry-over

- **WHEN** pengguna menonaktifkan sebuah lauk yang tidak memiliki carry-over hari ini (`porsi_carry_over = 0` atau baris detail belum ada)
- **THEN** sistem menampilkan pesan konfirmasi: "Yakin menonaktifkan lauk ini ?"

#### Scenario: Konfirmasi deaktivasi tanpa carry-over

- **WHEN** pengguna menekan "Ya" pada konfirmasi deaktivasi lauk tanpa carry-over
- **THEN** sistem mengubah `is_active` lauk menjadi `false` tanpa perubahan pada detail stok

#### Scenario: Membatalkan deaktivasi

- **WHEN** pengguna menekan "Batal" pada konfirmasi deaktivasi
- **THEN** sistem tidak melakukan perubahan apa pun pada lauk atau detail stok

#### Scenario: Menonaktifkan lauk saat hari terkunci

- **WHEN** pengguna mencoba menonaktifkan lauk pada hari dengan status `malam_selesai`
- **THEN** sistem menolak deaktivasi dan menampilkan pesan bahwa hari sudah terkunci

#### Scenario: Mengaktifkan kembali lauk

- **WHEN** pengguna mengaktifkan kembali sebuah lauk yang nonaktif
- **THEN** lauk tersebut kembali muncul di daftar input pagi dan malam dengan carry-over 0 (mulai dari nol)
