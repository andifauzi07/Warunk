## MODIFIED Requirements

### Requirement: Simpan Input Pagi

Sistem SHALL menyimpan input pagi dengan satu aksi dan mengubah status hari menjadi `pagi_selesai`, dengan menyertakan seluruh state baris (termasuk `user_id`, `rekonsiliasi_id`, `lauk_id`, `porsi_carry_over`, `hpp_carry_over_porsi`) pada setiap penulisan baris detail sehingga kandidat penulisan selalu valid terhadap RLS, NOT NULL, dan CHECK — baik untuk baris baru maupun baris yang sudah ada. Bila penyimpanan gagal, sistem SHALL menampilkan pesan kesalahan yang mencerminkan penyebab sesungguhnya, bukan pesan generik. Tombol simpan SHALL disabled secara otomatis jika ada lauk dengan total modal bahan bernilai 0 atau kosong.

#### Scenario: Tombol simpan disabled saat modal kosong

- **WHEN** pengguna membuka Input Pagi dan terdapat lauk dengan `modalBaru` bernilai 0 atau kosong
- **THEN** tombol "Selesai Input Pagi" dalam keadaan disabled (tidak dapat diklik)

#### Scenario: Tombol simpan aktif setelah modal diisi

- **WHEN** pengguna mengisi total modal bahan untuk semua lauk (nilai > 0)
- **THEN** tombol "Selesai Input Pagi" menjadi aktif dan dapat diklik

#### Scenario: Simpan input pagi

- **WHEN** pengguna menekan tombol "Selesai Input Pagi" dan semua validasi terpenuhi
- **THEN** sistem menyimpan data pagi dan status hari berubah menjadi `pagi_selesai`

#### Scenario: Mengulang input pagi sebelum malam

- **WHEN** pengguna membuka kembali Input Pagi pada hari yang sama sebelum status `malam_selesai`
- **THEN** sistem menampilkan data yang sudah tersimpan dan mengizinkan koreksi

#### Scenario: Simpan input pagi pada baris yang sudah ada

- **WHEN** pengguna menyimpan input pagi dan baris detail untuk sebuah lauk sudah tersimpan sebelumnya
- **THEN** sistem memperbarui baris tersebut berhasil karena setiap penulisan menyertakan state baris lengkap (termasuk `user_id` pemilik) sehingga tidak ditolak RLS, NOT NULL, maupun CHECK

#### Scenario: Penyimpanan gagal menampilkan penyebab

- **WHEN** penyimpanan input pagi ditolak oleh basis data (mis. kebijakan RLS)
- **THEN** sistem menampilkan pesan yang mencerminkan penyebab sesungguhnya dari respon basis data, bukan "Terjadi kesalahan"

### Requirement: Input Porsi Masak Baru dan Modal

Sistem SHALL menyediakan input jumlah porsi masak baru per lauk menggunakan stepper besar (bukan keyboard), serta input total modal bahan baku harian per lauk yang bersifat opsional dan boleh diisi belakangan sebelum malam.

#### Scenario: Menambah porsi masak baru

- **WHEN** pengguna menekan tombol stepper untuk menambah porsi masak baru sebuah lauk
- **THEN** stok aktif awal lauk tersebut diperbarui secara live (carry-over layak + porsi baru)

#### Scenario: Modal diisi belakangan

- **WHEN** pengguna menyimpan input pagi tanpa mengisi total modal salah satu lauk
- **THEN** sistem menyimpan input pagi tetap berhasil dan menandai lauk tersebut sebagai belum ada modal (akan memakai HPP estimasi saat malam)
