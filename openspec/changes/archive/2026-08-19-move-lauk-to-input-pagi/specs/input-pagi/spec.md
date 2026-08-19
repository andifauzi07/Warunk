## ADDED Requirements

### Requirement: Akses Master Lauk dari Input Pagi

Sistem SHALL menyediakan akses langsung ke fitur tambah lauk baru dari halaman Input Pagi, baik melalui tombol header maupun tombol inline, sehingga pengguna tidak perlu navigasi ke halaman terpisah.

#### Scenario: Tombol header tambah lauk

- **WHEN** pengguna membuka halaman Input Pagi
- **THEN** sistem menampilkan tombol "[+ Lauk]" di header yang membuka form tambah lauk (bottom sheet)

#### Scenario: Tombol inline tambah lauk pada mode input

- **WHEN** pengguna membuka halaman Input Pagi dalam mode input (belum simpan atau sedang koreksi) dan hari belum terkunci
- **THEN** sistem menampilkan tombol "[+ Tambah Lauk Baru]" di bawah daftar lauk yang membuka form tambah lauk (bottom sheet)

#### Scenario: Tombol inline tidak ditampilkan saat mode review

- **WHEN** pengguna membuka halaman Input Pagi dalam mode review (sudah simpan, belum terkunci)
- **THEN** tombol "[+ Tambah Lauk Baru]" TIDAK ditampilkan (cukup tombol header)

#### Scenario: Empty state menampilkan link tambah lauk

- **WHEN** pengguna membuka halaman Input Pagi dan tidak ada lauk aktif
- **THEN** sistem menampilkan pesan "Belum ada lauk aktif." dengan link atau tombol yang mengarah ke form tambah lauk

#### Scenario: Tombol tersembunyi saat hari terkunci

- **WHEN** pengguna membuka halaman Input Pagi pada hari dengan status `malam_selesai`
- **THEN** semua tombol tambah lauk (header dan inline) TIDAK ditampilkan
