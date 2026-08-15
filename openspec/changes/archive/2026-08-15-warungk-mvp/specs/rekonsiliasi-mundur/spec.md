## ADDED Requirements

### Requirement: Perhitungan Stok Aktif Awal
Sistem SHALL menghitung Stok Aktif Awal per lauk sebagai `(porsi_carry_over − porsi_basi_pagi) + porsi_baru_dimasak`.

#### Scenario: Stok aktif dengan carry-over dan masakan baru
- **WHEN** hari memiliki 10 porsi carry-over layak, 2 porsi basi pagi, dan 20 porsi masak baru
- **THEN** stok aktif awal = 28 porsi

#### Scenario: Stok aktif tanpa carry-over
- **WHEN** hari tidak memiliki carry-over
- **THEN** stok aktif awal = jumlah porsi masak baru

### Requirement: Perhitungan HPP Gabungan (Weighted Average)
Sistem SHALL menghitung HPP gabungan per porsi dengan rata-rata tertimbang antara carry-over (HPP kemarin) dan masakan baru (modal hari ini), dan SHALL menghasilkan 0 jika total stok aktif awal = 0.

#### Scenario: HPP gabungan sesuai contoh PRD
- **WHEN** carry-over 5 porsi dengan HPP Rp 6.000/porsi dan masakan baru 20 porsi dengan total modal Rp 140.000 (HPP Rp 7.000/porsi)
- **THEN** HPP gabungan = (5×6000 + 20×7000) ÷ 25 = Rp 6.800/porsi

#### Scenario: HPP gabungan saat tidak ada stok
- **WHEN** stok aktif awal sebuah lauk = 0
- **THEN** HPP gabungan dihitung 0 untuk menghindari pembagian dengan nol

#### Scenario: Fallback HPP estimasi
- **WHEN** modal porsi baru belum diinput saat perhitungan dilakukan
- **THEN** sistem memakai HPP estimasi dari master lauk sebagai `hpp_baru_porsi` dan menandai hari tersebut sebagai menggunakan estimasi

### Requirement: Perhitungan Porsi Dikonsumsi dan Pendapatan
Sistem SHALL menghitung Porsi Dikonsumsi per lauk sebagai `stok_aktif_awal − porsi_sisa_layak_jual − porsi_rusak_malam − porsi_konsumsi`, dan Pendapatan Estimasi sebagai jumlah dari `porsi_dikonsumsi × harga_jual_porsi` untuk semua lauk. Porsi yang dimakan sendiri TIDAK menghasilkan pendapatan.

#### Scenario: Porsi dikonsumsi pada hari normal
- **WHEN** stok aktif awal 25, sisa layak 5, rusak 1, dan dimakan sendiri 2
- **THEN** porsi dikonsumsi (terjual) = 17 porsi

#### Scenario: Pendapatan tidak termasuk konsumsi
- **WHEN** porsi dikonsumsi 17 dengan harga jual Rp 10.000/porsi
- **THEN** pendapatan estimasi = 17 × 10.000 = Rp 170.000

### Requirement: Perhitungan HPP Nyata dan Kerugian
Sistem SHALL menghitung Total HPP Nyata sebagai jumlah `porsi_dikonsumsi × hpp_gabungan` untuk semua lauk, dan Total Kerugian sebagai penjumlahan nilai modal basi pagi (`porsi_basi_pagi × hpp_carry_over`) dan rusak malam (`porsi_rusak_malam × hpp_gabungan`).

#### Scenario: HPP nyata dan kerugian
- **WHEN** porsi dikonsumsi 17 dengan HPP gabungan Rp 6.800, basi pagi 2 porsi carry-over HPP Rp 6.000, dan rusak malam 1 porsi
- **THEN** HPP nyata = 17 × 6.800 = Rp 115.600 dan kerugian = 2×6.000 + 1×6.800 = Rp 18.800

#### Scenario: Kerugian mengurangi profit secara langsung
- **WHEN** pendapatan estimasi Rp 170.000, HPP nyata Rp 115.600, dan kerugian Rp 18.800
- **THEN** profit bersih = 170.000 − 115.600 − 18.800 = Rp 35.600

### Requirement: Perhitungan Selisih Kas
Sistem SHALL menghitung Selisih Kas sebagai `(total_uang_laci − modal_kembalian_pakai) + total_uang_digital − total_pendapatan_estimasi`.

#### Scenario: Selisih kas nol dengan float dan digital
- **WHEN** uang laci Rp 480.000, float Rp 100.000, uang digital Rp 120.000, dan pendapatan estimasi Rp 500.000
- **THEN** selisih kas = (480.000 − 100.000) + 120.000 − 500.000 = 0

#### Scenario: Selisih kas negatif (potensi bocor)
- **WHEN** (uang laci − float) + uang digital kurang dari pendapatan estimasi
- **THEN** selisih kas bernilai negatif dan ditampilkan sebagai indikasi potensi kebocoran

#### Scenario: Selisih kas tunai murni
- **WHEN** uang digital 0 dan (uang laci − float) sama dengan pendapatan estimasi
- **THEN** selisih kas = 0

### Requirement: Audit Trail Carry-Over
Sistem SHALL menyimpan referensi asal setiap batch carry-over (`carry_over_dari_id`) ke baris detail stok harian asalnya, dan SHALL mencegah pencampuran carry-over dari lebih dari satu hari operasional sebelumnya tanpa jejak.

#### Scenario: Carry-over melompati hari libur
- **WHEN** hari Sabtu memiliki sisa layak jual dan Minggu dinyatakan libur
- **THEN** carry-over Sabtu menjadi baris awal input pagi Senin dengan referensi ke baris detail Sabtu

#### Scenario: Sumber carry-over dapat ditelusuri
- **WHEN** pengguna memeriksa asal sebuah carry-over
- **THEN** sistem menampilkan rantai referensi ke baris detail stok harian asalnya beserta HPP asalnya

### Requirement: Agregat Tersimpan Saat Kunci
Sistem SHALL menyimpan nilai agregat harian (total pendapatan estimasi, total HPP nyata, total kerugian, profit, selisih kas) secara permanen pada saat hari dikunci, sehingga tidak berubah oleh perubahan data induk di kemudian hari.

#### Scenario: Agregat tidak bergeser setelah kunci
- **WHEN** harga jual atau HPP estimasi master lauk diubah setelah hari terkunci
- **THEN** agregat hari terkunci tidak berubah nilainya
