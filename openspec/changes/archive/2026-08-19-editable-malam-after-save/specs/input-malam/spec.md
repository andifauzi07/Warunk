## MODIFIED Requirements

### Requirement: Mode Ringkasan Setelah Hari Terkunci

Sistem SHALL menampilkan mode ringkasan read-only setelah input malam tersimpan (status `malam_selesai`), berupa banner sukses, card Ringkasan Hari Ini, card ringkasan per lauk, DAN tombol "Ubah Input Malam" yang dilindungi AlertDialog konfirmasi. Setelah terkunci, pengguna DAPAT mengedit data melalui mode edit yang tersedia.

#### Scenario: Simpan malam berhasil menampilkan ringkasan

- **WHEN** pengguna menekan "Simpan & Kunci" dan penyimpanan berhasil
- **THEN** sistem menampilkan banner sukses "Input malam tersimpan", card Ringkasan Hari Ini (pendapatan, HPP nyata, kerugian, profit, uang laci, selisih kas) yang diambil dari nilai tersimpan, card per lauk (stok awal, terjual, sisa layak besok, rusak/basi, dimakan sendiri), DAN tombol "Ubah Input Malam"

#### Scenario: Membuka kembali hari yang sudah terkunci

- **WHEN** pengguna membuka Input Malam pada hari dengan status `malam_selesai`
- **THEN** sistem menampilkan mode ringkasan read-only (banner + card ringkasan per lauk) beserta tombol "Ubah Input Malam" dengan AlertDialog konfirmasi

#### Scenario: Tombol Ubah Input Malam

- **WHEN** pengguna menekan tombol "Ubah Input Malam" pada ringkasan terkunci
- **THEN** sistem menampilkan AlertDialog konfirmasi, dan jika dikonfirmasi, masuk ke mode edit dengan semua field editable

### Requirement: Peringatan HPP Estimasi Sebelum Kunci

Sistem SHALL tidak menampilkan peringatan HPP estimasi pada layar malam karena field modal bahan telah dihapus dari UI malam. Peringatan HPP estimasi hanya ditampilkan pada layar input pagi.

#### Scenario: Modal belum diinput

- **WHEN** pengguna membuka Input Malam
- **THEN** tidak ada peringatan terkait HPP estimasi atau modal bahan yang belum diisi
