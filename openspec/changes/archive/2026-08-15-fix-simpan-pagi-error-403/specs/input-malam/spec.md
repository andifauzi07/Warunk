# Input Malam Specification (Delta)

## ADDED Requirements

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

## MODIFIED Requirements

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
