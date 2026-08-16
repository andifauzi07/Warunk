## ADDED Requirements

### Requirement: Penyimpanan Pengaturan Selalu Memperbarui Satu Baris

Sistem SHALL menyimpan pengaturan warung sebagai satu baris per pengguna. Ketika baris pengaturan belum ada, simpan pertama SHALL membuat baris baru; ketika baris sudah ada, simpan berikutnya SHALL memperbarui baris tersebut dan tidak boleh gagal atau membuat baris duplikat.

#### Scenario: Simpan pertama kali

- **WHEN** pengguna menyimpan pengaturan dan belum ada baris pengaturan untuk pengguna tersebut
- **THEN** sistem membuat satu baris pengaturan dengan nilai yang disimpan

#### Scenario: Simpan berulang setelah baris ada

- **WHEN** pengguna menyimpan pengaturan kembali setelah baris pengaturannya sudah ada
- **THEN** sistem memperbarui baris tersebut dengan nilai baru dan tidak mengembalikan error duplikasi `user_id`

#### Scenario: Mengubah nilai modal kembalian menjadi 0

- **WHEN** pengguna mengubah modal kembalian menjadi 0 lalu menyimpan pengaturan
- **THEN** sistem menyimpan nilai 0 pada baris pengaturan yang sudah ada tanpa error

#### Scenario: Mengaktifkan pembayaran digital setelah simpan sebelumnya

- **WHEN** pengguna mengaktifkan toggle "menerima pembayaran digital" lalu menyimpan pengaturan
- **THEN** sistem memperbarui `terima_pembayaran_digital` menjadi true pada baris yang sudah ada tanpa error
