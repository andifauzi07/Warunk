# Currency Input Formatting Specification

## Purpose

Menyediakan directive dan fungsi utilitas untuk format input mata uang dengan pemisah ribuan Indonesia.

## Requirements

### Requirement: Input Mata Uang dengan Pemisah Ribuan

Sistem SHALL menyediakan directive Vue `v-currency` yang memformat input angka dengan pemisah ribuan Indonesia (`.`) secara real-time saat pengguna mengetik, dan menyimpan nilai mentah (number) ke v-model.

#### Scenario: User mengetik angka bertambah

- **WHEN** pengguna mengetik angka `170000` pada input berv-currency
- **THEN** input menampilkan `170.000` dan v-model bernilai `170000` (number)

#### Scenario: User menghapus angka

- **WHEN** pengguna menghapus karakter terakhir pada input yang menampilkan `17.000`
- **THEN** input menampilkan `1.700` dan v-model bernilai `1700` (number)

#### Scenario: User paste angka dengan prefix

- **WHEN** pengguna menempelkan `Rp 170.000` ke input berv-currency
- **THEN** input menampilkan `170.000` dan v-model bernilai `170000` (number), semua karakter non-digit dihapus

#### Scenario: Input kosong

- **WHEN** input berv-currency dalam keadaan kosong
- **THEN** v-model bernilai `0` (number)

#### Scenario: Keyboard numerik muncul di mobile

- **WHEN** pengguna menekan input berv-currency di perangkat mobile
- **THEN** keyboard numerik ditampilkan (inputmode="numeric")

### Requirement: Reverse Parsing Currency

Sistem SHALL menyediakan fungsi `parseCurrency()` yang mengonversi string dengan pemisah ribuan menjadi number.

#### Scenario: Parse angka dengan pemisah

- **WHEN** fungsi `parseCurrency()` dipanggil dengan `"170.000"`
- **THEN** fungsi mengembalikan `170000` (number)

#### Scenario: Parse string kosong

- **WHEN** fungsi `parseCurrency()` dipanggil dengan `""`
- **THEN** fungsi mengembalikan `0` (number)

#### Scenario: Parse string dengan karakter non-digit

- **WHEN** fungsi `parseCurrency()` dipanggil dengan `"Rp 170.000"`
- **THEN** fungsi mengembalikan `170000` (number)
