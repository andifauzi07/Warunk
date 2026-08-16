## ADDED Requirements

### Requirement: Transisi Rentang Non-Blokir

Sistem SHALL tidak menyembunyikan seluruh halaman dashboard ketika pengguna mengganti rentang tren (7 hari ↔ 30 hari). Loading ditampilkan per panel, data rentang sebelumnya tetap tampil selama data baru di-fetch, dan kontrol penggantian rentang SHALL tetap dapat digunakan.

#### Scenario: Mengganti rentang tidak menghilangkan seluruh halaman

- **WHEN** pengguna membuka `/dashboard` lalu mengganti rentang dari 7 hari ke 30 hari atau sebaliknya
- **THEN** halaman tidak menampilkan indikator loading global yang menyembunyikan seluruh konten; hanya panel yang data-nya sedang di-fetch (Tren dan Ranking) yang menampilkan indikator loading, sedangkan panel Ringkasan tetap menampilkan datanya

#### Scenario: Data rentang sebelumnya tetap tampil saat fetch baru berjalan

- **WHEN** pengguna mengganti rentang tren dan data rentang baru belum selesai diambil
- **THEN** sistem menampilkan data rentang sebelumnya pada panel Tren dan Ranking sebagai placeholder tanpa flash kosong, dan kemudian memperbaruinya dengan data rentang baru tanpa menghilangkan konten

#### Scenario: Tombol toggle tetap dapat digunakan selama loading

- **WHEN** panel Tren sedang menampilkan indikator loading setelah pengguna mengganti rentang
- **THEN** tombol 7 hari dan 30 hari tetap tampil dan dapat diklik untuk mengganti rentang lagi

#### Scenario: Indikator loading tidak menyebabkan pergeseran tata letak

- **WHEN** sebuah panel memasuki atau meninggalkan state loading
- **THEN** tinggi kartu panel tetap (skeleton dengan tinggi yang sudah ditentukan) sehingga tidak terjadi lompatan/layout shift pada halaman

#### Scenario: Kegagalan satu panel tidak menyembunyikan panel lain

- **WHEN** salah satu query panel (Ringkasan, Tren, atau Ranking) gagal
- **THEN** sistem menampilkan pesan error pada panel yang gagal tersebut tanpa menyembunyikan atau mengubah tampilan panel lainnya
