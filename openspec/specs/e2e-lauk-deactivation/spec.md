# E2E Lauk Deactivation Specification

## Purpose

Mendefinisikan persyaratan E2E test (Playwright terhadap Supabase local) yang menjaga kualitas perilaku deaktivasi lauk: integritas seed data `detail_stok_harian`, pemilihan dialog konfirmasi yang sesuai dengan kondisi carry-over, dan zeroing carry-over saat lauk dinonaktifkan.

## Requirements

### Requirement: E2E Test Seed Data Integrity

Sistem SHALL memastikan seed data E2E test berhasil dimasukkan ke Supabase lokal dan dapat di-query oleh fungsi aplikasi.

#### Scenario: Detail stok harian berhasil di-seed dengan carry-over

- **WHEN** E2E test menjalankan `seedTestData()` dengan `porsi_carry_over: 5`
- **THEN** baris `detail_stok_harian` berhasil dimasukkan dan `getCarryOverForLauk()` mengembalikan nilai 5

#### Scenario: Seed data gagal terdeteksi dengan error checking

- **WHEN** operasi insert ke `detail_stok_harian` gagal (misalnya karena constraint violation)
- **THEN** `seedTestData()` melemparkan error dengan pesan yang menjelaskan penyebab kegagalan

### Requirement: E2E Test Lauk Deactivation Dialog

Sistem SHALL menampilkan dialog konfirmasi yang sesuai dengan kondisi carry-over saat lauk dinonaktifkan.

#### Scenario: Dialog carry-over warning ditampilkan saat carry-over > 0

- **WHEN** pengguna menonaktifkan lauk yang memiliki `porsi_carry_over > 0`
- **THEN** dialog menampilkan pesan "Menonaktifkan lauk ini, akan membuat sisa porsi kemarin dianggap basi/rusak !"

#### Scenario: Dialog simple ditampilkan saat carry-over = 0

- **WHEN** pengguna menonaktifkan lauk yang tidak memiliki carry-over
- **THEN** dialog menampilkan pesan "Yakin menonaktifkan lauk ini ?"

### Requirement: E2E Test Zero Carry-Over on Deactivation

Sistem SHALL memanggil `zeroCarryOverForLauk()` saat menonaktifkan lauk yang memiliki carry-over.

#### Scenario: Carry-over di-zero saat deaktivasi dengan carry-over

- **WHEN** pengguna mengonfirmasi deaktivasi lauk yang memiliki carry-over
- **THEN** `porsi_carry_over` pada baris detail hari ini menjadi 0

#### Scenario: Lauk tidak muncul di input pagi setelah deaktivasi

- **WHEN** lauk dinonaktifkan
- **THEN** lauk tersebut tidak ditampilkan di halaman Input Pagi