## MODIFIED Requirements

### Requirement: Tampilkan Carry-Over Otomatis

Sistem SHALL menampilkan daftar carry-over dari sesi malam hari operasional sebelumnya sebagai baris awal, bersifat read-only (hasil sistem), sebelum input pagi dimulai. Sistem HANYA menampilkan baris detail untuk lauk yang memiliki `is_active = true` pada master lauk.

#### Scenario: Carry-over tersedia dari malam kemarin

- **WHEN** pengguna membuka modul Input Pagi dan hari operasional sebelumnya memiliki sisa layak jual
- **THEN** sistem menampilkan per lauk aktif jumlah porsi carry-over beserta HPP asalnya (HPP hari kemarin)

#### Scenario: Tidak ada hari operasional sebelumnya

- **WHEN** pengguna membuka Input Pagi dan tidak ada carry-over dari hari sebelumnya
- **THEN** sistem menampilkan daftar lauk aktif dengan porsi carry-over 0

#### Scenario: Lauk nonaktif tidak ditampilkan

- **WHEN** pengguna membuka Input Pagi dan terdapat lauk dengan `is_active = false`
- **THEN** sistem TIDAK menampilkan baris detail untuk lauk nonaktif tersebut, meskipun baris `detail_stok_harian` untuk lauk tersebut masih ada di database
