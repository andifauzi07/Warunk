# Hari Libur Specification

## Purpose

Mengelola deklarasi hari libur agar sistem tidak menuntut input, meneruskan carry-over melewati hari libur, dan membedakan hari libur dari lupa input.

## Requirements

### Requirement: Deklarasi Hari Libur

Sistem SHALL memperlakukan setiap hari sebagai hari buka secara default, dan SHALL mengizinkan pengguna mendeklarasikan sebuah hari sebagai libur melalui aplikasi. Hari libur direpresentasikan sebagai status `libur`.

#### Scenario: Menandai hari ini libur

- **WHEN** pengguna menandai hari ini sebagai libur sebelum mengisi input pagi
- **THEN** sistem mencatat hari tersebut dengan status `libur` dan tidak menuntut input pagi maupun malam

#### Scenario: Layar tenang saat libur

- **WHEN** hari berstatus `libur` dan pengguna membuka aplikasi pada hari tersebut
- **THEN** sistem menampilkan keadaan tenang ("Hari ini libur") tanpa peringatan input

#### Scenario: Buka lagi setelah salah tandai libur

- **WHEN** pengguna menandai hari libur namun kemudian membuka warung pada hari yang sama
- **THEN** sistem menyediakan aksi "Buka Lagi" yang mengubah status menjadi `pagi_pending` dan mengizinkan input pagi

### Requirement: Carry-Over Melompati Hari Libur

Sistem SHALL meneruskan carry-over dari hari operasional terakhir menuju hari operasional berikutnya meskipun terdapat hari libur di antaranya, dan sisa stok yang menunggu di hari libur tidak dihitung sebagai kerugian sampai diperiksa pada hari operasional berikutnya.

#### Scenario: Sisa Sabtu menunggu sampai Senin

- **WHEN** Sabtu memiliki sisa layak jual 10 porsi dan Minggu dinyatakan libur
- **THEN** input pagi Senin menampilkan carry-over 10 porsi dari Sabtu dan pengguna dapat memeriksanya (layak atau basi)

#### Scenario: Stok membusuk selama libur

- **WHEN** sebagian carry-over yang menunggu melewati hari libur ditemukan basi pada pagi hari operasional berikutnya
- **THEN** bagian tersebut dicatat sebagai Porsi Basi Pagi dengan HPP asal carry-over (hari operasional terakhir)

### Requirement: Pembeda Libur vs Lupa Input

Sistem SHALL membedakan tanggal yang dinyatakan libur dari tanggal tanpa data karena lupa input, dan SHALL menampilkan peringatan "lupa input" hanya untuk tanggal operasional yang tidak memiliki data.

#### Scenario: Tanggal operasional kosong

- **WHEN** terdapat hari operasional yang tidak memiliki baris rekonsiliasi dan tidak dinyatakan libur
- **THEN** sistem menampilkan peringatan bahwa input hari tersebut belum dilakukan

#### Scenario: Tanggal libur tidak dianggap lupa input

- **WHEN** terdapat hari yang dinyatakan libur
- **THEN** sistem tidak menampilkan peringatan lupa input untuk hari tersebut dan tidak menghitungnya dalam metrik konsistensi input harian
