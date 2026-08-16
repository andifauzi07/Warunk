# Pengaturan Warung Specification

## Purpose

Menyediakan konfigurasi modal kembalian (float), ambang toleransi selisih kas, dan penerimaan pembayaran digital yang memengaruhi modul input dan detektor selisih.

## Requirements

### Requirement: Pengaturan Modal Kembalian (Float)

Sistem SHALL menyediakan pengaturan satu nilai modal kembalian (uang kecil yang ditaruh di laci kasir di pagi hari) yang menjadi default `modal_kembalian_pakai` untuk hari-hari baru. Perubahan pengaturan hanya berlaku untuk hari yang belum terkunci.

#### Scenario: Menetapkan modal kembalian

- **WHEN** pengguna menyimpan nilai modal kembalian di pengaturan
- **THEN** hari-hari baru memakai nilai tersebut sebagai modal kembalian saat simpan malam

#### Scenario: Perubahan tidak mempengaruhi hari terkunci

- **WHEN** pengguna mengubah modal kembalian setelah ada hari terkunci
- **THEN** nilai `modal_kembalian_pakai` pada hari terkunci tetap menggunakan nilai saat hari tersebut disimpan

### Requirement: Pengaturan Toleransi Selisih Kas

Sistem SHALL menyediakan pengaturan ambang toleransi selisih kas (dalam persen terhadap pendapatan estimasi) untuk indikator warna detektor selisih.

#### Scenario: Menetapkan ambang toleransi

- **WHEN** pengguna mengubah nilai toleransi selisih kas
- **THEN** indikator warna detektor selisih memakai ambang baru tersebut saat menampilkan hari

### Requirement: Pengaturan Pembayaran Digital

Sistem SHALL menyediakan toggle "menerima pembayaran digital" yang mengontrol kemunculan input uang digital pada modul Input Malam.

#### Scenario: Mengaktifkan pembayaran digital

- **WHEN** pengguna mengaktifkan toggle pembayaran digital
- **THEN** modul Input Malam menampilkan input "uang digital masuk hari ini"

#### Scenario: Menonaktifkan pembayaran digital

- **WHEN** pengguna menonaktifkan toggle pembayaran digital
- **THEN** modul Input Malam menyembunyikan input uang digital dan menganggap nilainya 0

### Requirement: Penyimpanan Pengaturan Selalu Memperbarui Satu Baris

Sistem SHALL menyimpan pengaturan warung sebagai satu baris per pengguna. Ketika baris pengaturan belum ada, simpan pertama SHALL membuat baris baru; ketika baris sudah ada, simpan berikutnya SHALL memperbarui baris tersebut dan tidak boleh gagal atau membuat baris duplikat.

#### Scenario: Simpan pertama kali

- **WHEN** pengguna menyimpan pengaturan dan belum ada baris pengaturan untuk pengguna tersebut
- **THEN** sistem membuat satu baris pengaturan dengan nilai yang disimpan

#### Scenario: Simpan berulang setelah baris ada

- **WHEN** pengguna menyimpan pengaturan kembali setelah baris pengaturannya sudah ada
- **THEN** sistem memperbarui baris tersebut dengan nilai baru dan tidak mengembalikan error duplikasi `user_id`

#### Scenario: Mengubah nilai modal kembalian menjadi 0

- **WHEN** pengguna mengubah modal kembalian menjadi 0 lalu menyimpan pengaturan
- **THEN** sistem menyimpan nilai 0 pada baris pengaturan yang sudah ada tanpa error

#### Scenario: Mengaktifkan pembayaran digital setelah simpan sebelumnya

- **WHEN** pengguna mengaktifkan toggle "menerima pembayaran digital" lalu menyimpan pengaturan
- **THEN** sistem memperbarui `terima_pembayaran_digital` menjadi true pada baris yang sudah ada tanpa error
