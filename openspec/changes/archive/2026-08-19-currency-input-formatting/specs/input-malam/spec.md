## MODIFIED Requirements

### Requirement: Simpan dan Kunci Hari

Sistem SHALL mengunci hari dengan satu aksi "Simpan & Kunci", mengubah status menjadi `malam_selesai`, dan menampilkan Ringkasan Hari Ini seketika di layar yang sama, dengan menyertakan seluruh state baris pada setiap penulisan baris detail (kolom pagi yang sudah tersimpan, `user_id`, `rekonsiliasi_id`, `lauk_id`, dan nilai input malam) sehingga kandidat penulisan selalu valid terhadap RLS, NOT NULL, dan CHECK — baik untuk baris baru maupun baris yang sudah ada. Setelah terkunci, tidak ada perubahan data hari tersebut. Tombol simpan SHALL disabled secara otomatis jika `uangLaci` kosong, null, atau bernilai negatif.

#### Scenario: Tombol simpan disabled saat uang laci kosong

- **WHEN** pengguna membuka Input Malam dan `uangLaci` masih null atau kosong
- **THEN** tombol "Simpan & Kunci Hari Ini" dalam keadaan disabled (tidak dapat diklik)

#### Scenario: Tombol simpan aktif setelah uang laci diisi

- **WHEN** pengguna mengisi total uang di laci dengan nilai >= 0
- **THEN** tombol "Simpan & Kunci Hari Ini" menjadi aktif (selain validasi lain terpenuhi)

#### Scenario: Simpan malam berhasil

- **WHEN** pengguna menekan "Simpan & Kunci" dan semua validasi terpenuhi
- **THEN** sistem menyimpan semua input, status berubah menjadi `malam_selesai`, dan ringkasan (pendapatan estimasi, HPP nyata, kerugian, profit, selisih kas) langsung ditampilkan dalam mode read-only

#### Scenario: Koreksi sebelum kunci

- **WHEN** pengguna membuka kembali Input Malam pada hari yang sama sebelum status `malam_selesai`
- **THEN** sistem menampilkan data yang sudah tersimpan dan mengizinkan koreksi

#### Scenario: Simpan malam pada baris yang sudah ada

- **WHEN** pengguna menyimpan input malam dan baris detail untuk sebuah lauk sudah tersimpan sebelumnya
- **THEN** sistem memperbarui baris tersebut berhasil karena setiap penulisan menyertakan state baris lengkap (termasuk `user_id` pemilik) sehingga tidak ditolak RLS, NOT NULL, maupun CHECK

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
