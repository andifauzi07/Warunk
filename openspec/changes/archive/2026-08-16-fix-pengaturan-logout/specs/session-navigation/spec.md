## ADDED Requirements

### Requirement: Navigasi Reaktif atas Perubahan Sesi

Sistem SHALL mengarahkan ulang navigasi secara otomatis ketika status sesi berubah, tanpa menunggu reload halaman atau navigasi manual pengguna, dan tanpa mengandalkan pemanggilan eksplisit di setiap komponen.

#### Scenario: Logout langsung mengarah ke halaman login

- **WHEN** pengguna menekan tombol logout dari halaman yang memerlukan autentikasi
- **THEN** sistem mengakhiri sesi dan langsung menampilkan halaman login tanpa reload manual

#### Scenario: Sesi kedaluwarsa mengarah ke halaman login

- **WHEN** sesi pengguna kedaluwarsa atau tidak lagi valid (mis. token gagal diperbarui) saat pengguna berada di halaman yang memerlukan autentikasi
- **THEN** sistem mengakhiri sesi dan menampilkan halaman login

#### Scenario: Logout di tab lain menyinkronkan tab saat ini

- **WHEN** pengguna logout dari tab lain pada browser yang sama sehingga status sesi berubah di tab saat ini
- **THEN** sistem menampilkan halaman login pada tab saat ini

#### Scenario: Login berhasil mengarah ke halaman utama

- **WHEN** pengguna berhasil login dari halaman login
- **THEN** sistem menampilkan halaman utama aplikasi

#### Scenario: Sesi aktif saat membuka halaman publik

- **WHEN** pengguna yang memiliki sesi aktif berada pada halaman publik (mis. `/login`)
- **THEN** sistem menampilkan halaman utama aplikasi

#### Scenario: Tidak ada redirect pada halaman login tanpa sesi

- **WHEN** pengguna tanpa sesi berada di halaman login
- **THEN** sistem tetap menampilkan halaman login dan tidak melakukan redirect berulang

### Requirement: Predikat Navigasi Tunggal

Sistem SHALL menggunakan satu predikat yang sama untuk menentukan arah navigasi berbasis sesi, baik saat navigasi terjadi (router guard) maupun saat status sesi berubah (watcher), sehingga kedua jalur tidak menyimpang.

#### Scenario: Kedua jalur menghasilkan keputusan yang sama

- **WHEN** status sesi dan rute saat ini diberikan ke predikat navigasi, baik dari jalur guard maupun jalur watcher
- **THEN** keduanya menghasilkan arah navigasi yang identik
