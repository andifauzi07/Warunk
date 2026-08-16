# Dashboard Analitik Specification

## Purpose

Menampilkan ringkasan harian, deteksi selisih kas, tren profit, dan ranking lauk untuk membantu pemilik warung memantau performa usaha dengan cepat.

## Requirements

### Requirement: Ringkasan Hari Ini

Sistem SHALL menampilkan Ringkasan Hari Ini berupa Pendapatan Estimasi, HPP Nyata, Total Kerugian, Keuntungan Bersih, dan Selisih Kas segera setelah input malam dikunci, dan SHALL menampilkannya juga dari menu dashboard.

#### Scenario: Ringkasan naratif pasca-kunci

- **WHEN** pengguna selesai mengunci input malam
- **THEN** sistem menampilkan ringkasan berisi pendapatan estimasi (dengan rincian digital nyata dan tunai yang diharapkan), HPP nyata, kerugian, profit, dan selisih kas

#### Scenario: Menjawab "untung berapa hari ini" dalam 10 detik

- **WHEN** pengguna membuka dashboard pada hari dengan status `malam_selesai`
- **THEN** profit dan selisih kas hari tersebut langsung tampil di area atas tanpa perlu navigasi tambahan

### Requirement: Detektor Selisih Kas

Sistem SHALL menampilkan indikator warna pada selisih kas berdasarkan ambang toleransi yang dikonfigurasi: hijau = selisih wajar, kuning = selisih sedang, merah = selisih besar/berpotensi kebocoran.

#### Scenario: Selisih dalam toleransi

- **WHEN** nilai mutlak selisih kas ≤ ambang toleransi
- **THEN** indikator berwarna hijau

#### Scenario: Selisih melebihi toleransi

- **WHEN** nilai mutlak selisih kas melebihi ambang toleransi
- **THEN** indikator berwarna kuning atau merah sesuai tingkat keparahan

#### Scenario: Ambang toleransi mengikuti pengaturan

- **WHEN** pengguna mengubah toleransi selisih di pengaturan warung
- **THEN** warna indikator hari-hari yang belum terkunci ikut menyesuaikan, sedangkan hari terkunci memakai penilaian toleransi saat ditampilkan

### Requirement: Tren Profit dan Status Harian

Sistem SHALL menampilkan grafik sederhana (bar/line) profit harian untuk 7 dan 30 hari terakhir serta badge status harian (`pagi_pending`, `pagi_selesai`, `malam_selesai`, `libur`), dan SHALL membedakan hari libur dari hari dengan profit nol.

#### Scenario: Grafik tren 7 hari

- **WHEN** pengguna membuka dashboard tren
- **THEN** sistem menampilkan profit untuk 7 hari terakhir, dengan hari libur ditandai secara berbeda dari hari profit nol

#### Scenario: Badge status hari ini

- **WHEN** pengguna membuka dashboard
- **THEN** sistem menampilkan badge status hari ini yang menunjukkan tahap input yang belum diselesaikan

#### Scenario: Peringatan lupa input

- **WHEN** terdapat hari operasional yang tidak memiliki data dan bukan libur
- **THEN** sistem menandai hari tersebut dengan status lupa input pada dashboard

### Requirement: Ranking Lauk

Sistem SHALL menampilkan ranking lauk terlaris (berdasarkan porsi dikonsumsi) dan lauk paling sering basi, untuk membantu pengguna menyesuaikan jumlah masakan di hari berikutnya.

#### Scenario: Ranking lauk terlaris

- **WHEN** pengguna membuka bagian ranking lauk
- **THEN** sistem menampilkan daftar lauk urut berdasarkan porsi dikonsumsi menurun dalam rentang waktu tertentu

#### Scenario: Ranking lauk paling sering basi

- **WHEN** pengguna membuka bagian ranking lauk
- **THEN** sistem menampilkan daftar lauk urut berdasarkan total porsi basi/rusak menurun dalam rentang waktu tertentu

### Requirement: Transisi Rentang Non-Blokir

Sistem SHALL tidak menyembunyikan seluruh halaman dashboard ketika pengguna mengganti rentang tren (7 hari ↔ 30 hari). Loading ditampilkan per panel, data rentang sebelumnya tetap tampil selama data baru di-fetch, dan kontrol penggantian rentang SHALL tetap dapat digunakan.

#### Scenario: Mengganti rentang tidak menghilangkan seluruh halaman

- **WHEN** pengguna membuka `/dashboard` lalu mengganti rentang dari 7 hari ke 30 hari atau sebaliknya
- **THEN** halaman tidak menampilkan indikator loading global yang menyembunyikan seluruh konten; hanya panel yang data-nya sedang di-fetch (Tren dan Ranking) yang menampilkan indikator loading, sedangkan panel Ringkasan tetap menampilkan datanya

#### Scenario: Data rentang sebelumnya tetap tampil saat fetch baru berjalan

- **WHEN** pengguna mengganti rentang tren dan data rentang baru belum selesai diambil
- **THEN** sistem menampilkan data rentang sebelumnya pada panel Tren dan Ranking sebagai placeholder tanpa flash kosong, dan kemudian memperbaruinya dengan data rentang baru tanpa menghilangkan konten

#### Scenario: Tombol toggle tetap dapat digunakan selama loading

- **WHEN** panel Tren sedang menampilkan indikator loading setelah pengguna mengganti rentang
- **THEN** tombol 7 hari dan 30 hari tetap tampil dan dapat diklik untuk mengganti rentang lagi

#### Scenario: Indikator loading tidak menyebabkan pergeseran tata letak

- **WHEN** sebuah panel memasuki atau meninggalkan state loading
- **THEN** tinggi kartu panel tetap (skeleton dengan tinggi yang sudah ditentukan) sehingga tidak terjadi lompatan/layout shift pada halaman

#### Scenario: Kegagalan satu panel tidak menyembunyikan panel lain

- **WHEN** salah satu query panel (Ringkasan, Tren, atau Ranking) gagal
- **THEN** sistem menampilkan pesan error pada panel yang gagal tersebut tanpa menyembunyikan atau mengubah tampilan panel lainnya
