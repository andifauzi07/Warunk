## ADDED Requirements

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
