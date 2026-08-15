# Input Malam Specification

## Purpose

Menghimpun opname stok, uang laci, dan uang digital pada akhir hari, serta mengunci hari dengan agregat dan snapshot float agar data tidak berubah setelahnya.

## Requirements

### Requirement: Opname Tiga Bucket per Lauk

Sistem SHALL menampilkan daftar semua lauk aktif hari ini dengan Stok Aktif Awal terisi otomatis dari data pagi, dan menyediakan tiga kolom stepper per lauk: **Sisa Layak Jual**, **Porsi Rusak**, dan **Dimakan Sendiri**.

#### Scenario: Opname normal lengkap

- **WHEN** pengguna mengisi sisa layak jual dan porsi rusak untuk setiap lauk aktif
- **THEN** sistem menghitung porsi dikonsumsi = stok aktif awal − sisa layak − rusak − dimakan sendiri

#### Scenario: Kolom Dimakan Sendiri tersembunyi

- **WHEN** pengguna menandai "hari ini tidak makan sendiri" pada awal sesi malam
- **THEN** kolom stepper "Dimakan Sendiri" tidak ditampilkan dan dihitung 0 untuk semua lauk

#### Scenario: Kolom Dimakan Sendiri muncul

- **WHEN** pengguna menandai "hari ini makan sendiri" pada awal sesi malam
- **THEN** kolom stepper "Dimakan Sendiri" ditampilkan per lauk dan dapat diisi

#### Scenario: Validasi opname

- **WHEN** jumlah sisa layak + rusak + dimakan sendiri melebihi stok aktif awal sebuah lauk
- **THEN** sistem menolak input dan menampilkan peringatan bahwa jumlah tidak boleh melebihi stok aktif awal

### Requirement: Input Uang Laci dan Uang Digital

Sistem SHALL menyediakan input tunggal "Total Uang di Laci Kasir" serta input "Uang Digital Masuk Hari Ini" (berlaku hanya jika pengaturan menerima pembayaran digital, dengan nilai default 0).

#### Scenario: Input uang laci

- **WHEN** pengguna memasukkan total uang fisik di laci kasir
- **THEN** sistem menyimpan nilai tersebut sebagai `total_uang_laci`

#### Scenario: Input uang digital saat warung menerima digital

- **WHEN** pengaturan warung mengaktifkan pembayaran digital dan pengguna memasukkan total uang digital masuk hari ini
- **THEN** sistem menyimpan nilai tersebut sebagai `total_uang_digital` dan memakainya dalam perhitungan selisih kas

#### Scenario: Input uang digital saat warung tunai murni

- **WHEN** pengaturan warung tidak mengaktifkan pembayaran digital
- **THEN** sistem tidak menampilkan input uang digital dan menganggap nilainya 0

### Requirement: Snapshot Float Saat Simpan Malam

Sistem SHALL menyalin nilai modal kembalian dari pengaturan warung ke `modal_kembalian_pakai` pada saat simpan malam, sehingga perubahan pengaturan di kemudian hari tidak mengubah hari yang sudah terkunci.

#### Scenario: Float disalin saat simpan

- **WHEN** pengguna menyimpan input malam
- **THEN** sistem menyimpan nilai modal kembalian yang berlaku saat itu sebagai `modal_kembalian_pakai` pada baris rekonsiliasi hari tersebut

#### Scenario: Ubah float tidak mempengaruhi hari terkunci

- **WHEN** pengguna mengubah modal kembalian di pengaturan setelah hari terkunci
- **THEN** nilai `modal_kembalian_pakai` dan selisih kas hari yang sudah terkunci tetap tidak berubah

### Requirement: Peringatan HPP Estimasi Sebelum Kunci

Sistem SHALL menampilkan peringatan inline pada layar malam jika ada lauk dengan modal bahan belum diinput, dan mengizinkan pengguna untuk tetap menyimpan (dengan HPP estimasi) atau mengisi modal terlebih dahulu.

#### Scenario: Modal belum diinput

- **WHEN** pengguna hendak menyimpan input malam dan terdapat lauk tanpa modal bahan
- **THEN** sistem menampilkan peringatan "HPP akan memakai estimasi Rp X untuk <lauk>" beserta opsi mengisi modal atau tetap menyimpan dengan estimasi

### Requirement: Simpan dan Kunci Hari

Sistem SHALL mengunci hari dengan satu aksi "Simpan & Kunci", mengubah status menjadi `malam_selesai`, dan menampilkan Ringkasan Hari Ini seketika di layar yang sama, dengan menyertakan seluruh state baris pada setiap penulisan baris detail (kolom pagi yang sudah tersimpan, `user_id`, `rekonsiliasi_id`, `lauk_id`, dan nilai input malam) sehingga kandidat penulisan selalu valid terhadap RLS, NOT NULL, dan CHECK — baik untuk baris baru maupun baris yang sudah ada. Setelah terkunci, tidak ada perubahan data hari tersebut.

#### Scenario: Simpan malam berhasil

- **WHEN** pengguna menekan "Simpan & Kunci" dan semua validasi terpenuhi
- **THEN** sistem menyimpan semua input, status berubah menjadi `malam_selesai`, dan ringkasan (pendapatan estimasi, HPP nyata, kerugian, profit, selisih kas) langsung ditampilkan dalam mode read-only

#### Scenario: Koreksi sebelum kunci

- **WHEN** pengguna membuka kembali Input Malam pada hari yang sama sebelum status `malam_selesai`
- **THEN** sistem menampilkan data yang sudah tersimpan dan mengizinkan koreksi

#### Scenario: Simpan malam pada baris yang sudah ada

- **WHEN** pengguna menyimpan input malam dan baris detail untuk sebuah lauk sudah tersimpan sebelumnya
- **THEN** sistem memperbarui baris tersebut berhasil karena setiap penulisan menyertakan state baris lengkap (termasuk `user_id` pemilik) sehingga tidak ditolak RLS, NOT NULL, maupun CHECK

### Requirement: Mode Ringkasan Setelah Hari Terkunci

Sistem SHALL menampilkan mode ringkasan read-only setelah input malam tersimpan (status `malam_selesai`), berupa banner sukses, card Ringkasan Hari Ini, dan card ringkasan per lauk — tanpa kontrol edit apa pun.

#### Scenario: Simpan malam berhasil menampilkan ringkasan

- **WHEN** pengguna menekan "Simpan & Kunci" dan penyimpanan berhasil
- **THEN** sistem menampilkan banner sukses "Input malam tersimpan", card Ringkasan Hari Ini (pendapatan, HPP nyata, kerugian, profit, uang laci, selisih kas) yang diambil dari nilai tersimpan, dan card per lauk (stok awal, terjual, sisa layak besok, rusak/basi, dimakan sendiri, modal)

#### Scenario: Membuka kembali hari yang sudah terkunci

- **WHEN** pengguna membuka Input Malam pada hari dengan status `malam_selesai`
- **THEN** sistem menampilkan mode ringkasan read-only (banner + card ringkasan per lauk) tanpa kontrol edit dan tanpa tombol simpan

#### Scenario: Hari terkunci tidak bisa diedit

- **WHEN** pengguna mencoba mengubah data pada hari yang sudah berstatus `malam_selesai`
- **THEN** sistem menolak perubahan dan menampilkan informasi bahwa hari tersebut sudah terkunci
