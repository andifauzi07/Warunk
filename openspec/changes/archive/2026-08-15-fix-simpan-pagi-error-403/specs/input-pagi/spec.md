# Input Pagi Specification (Delta)

## ADDED Requirements

### Requirement: Umpan Balik Simpan dan Mode Ringkasan

Sistem SHALL menampilkan pesan sukses setelah input pagi tersimpan, lalu menampilkan ringkasan penting per lauk dalam bentuk card beserta tombol "Ubah Input Pagi" untuk mengoreksi selama hari belum terkunci.

#### Scenario: Simpan pagi berhasil

- **WHEN** pengguna menekan "Selesai Input Pagi" dan penyimpanan berhasil
- **THEN** sistem menampilkan banner sukses "Input pagi tersimpan" dan card ringkasan per lauk (sisa kemarin, basi pagi, masak baru, modal, stok aktif)

#### Scenario: Membuka kembali hari yang sudah diinput pagi

- **WHEN** pengguna membuka Input Pagi pada hari dengan status `pagi_selesai`
- **THEN** sistem menampilkan mode ringkasan (card informasi penting) dengan tombol "Ubah Input Pagi"

#### Scenario: Mengoreksi input pagi

- **WHEN** pengguna menekan "Ubah Input Pagi" pada mode ringkasan dan hari belum terkunci
- **THEN** sistem menampilkan kembali form input lengkap untuk dikoreksi, dan setelah disimpan kembali ke mode ringkasan

#### Scenario: Hari sudah terkunci

- **WHEN** pengguna membuka Input Pagi pada hari dengan status `malam_selesai`
- **THEN** sistem menampilkan card ringkasan tanpa tombol ubah beserta keterangan bahwa hari terkunci

## MODIFIED Requirements

### Requirement: Simpan Input Pagi

Sistem SHALL menyimpan input pagi dengan satu aksi dan mengubah status hari menjadi `pagi_selesai`, dengan menyertakan seluruh state baris (termasuk `user_id`, `rekonsiliasi_id`, `lauk_id`, `porsi_carry_over`, `hpp_carry_over_porsi`) pada setiap penulisan baris detail sehingga kandidat penulisan selalu valid terhadap RLS, NOT NULL, dan CHECK — baik untuk baris baru maupun baris yang sudah ada. Bila penyimpanan gagal, sistem SHALL menampilkan pesan kesalahan yang mencerminkan penyebab sesungguhnya, bukan pesan generik.

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
