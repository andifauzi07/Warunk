# Data Fetching Specification

## Purpose

Mengelola pengambilan dan sinkronisasi server state agar efisien dan konsisten: data yang sama dibagikan antar view tanpa fetch berulang, cache di-invalidate setelah mutasi, dan client state dipisahkan dari cache server.

## Requirements

### Requirement: Pengambilan Server State Ter-cache

Sistem SHALL mengambil server state — master lauk, pengaturan, data analitik, serta rekonsiliasi dan detail hari ini — melalui vue-query sehingga hasilnya ter-cache, ter-dedup, dan dibagikan antar view. Ketika pengguna berpindah antar halaman dalam sesi aplikasi yang sama (mis. `/` → `/pagi` → `/malam`), sistem TIDAK boleh mengambil ulang data yang masih valid di cache.

#### Scenario: Navigasi antar halaman tidak mengulang fetch

- **WHEN** pengguna membuka `/` lalu berpindah ke `/pagi` dan `/malam` dalam sesi yang sama
- **THEN** sistem tidak mengeluarkan request ulang untuk rekonsiliasi dan detail hari ini karena data sudah ter-cache di vue-query

#### Scenario: Data hari ini dibagikan antar view

- **WHEN** halaman utama dan halaman input pagi sama-sama menampilkan status/detail hari ini
- **THEN** kedua halaman membaca dari sumber cache yang sama dan menampilkan nilai yang konsisten

### Requirement: Satu Pengambilan Detail per Siklus Penyiapan Hari

Sistem SHALL memastikan operasi penyiapan hari (`siapkanHari`) hanya melakukan SATU pengambilan detail stok hari ini per siklus; hasil pengambilan untuk pengecekan seed dipakai ulang sebagai hasil akhir, tanpa fetch ulang.

#### Scenario: Tidak ada request detail ganda

- **WHEN** pengguna membuka halaman utama dan data hari ini sudah tersiapkan
- **THEN** sistem mengirim tepat satu request `detail_stok_harian` untuk hari tersebut (bukan dua request identik)

#### Scenario: Hasil seed menjadi data tampilan

- **WHEN** operasi penyiapan hari berjalan dan menambah baris detail baru (seed)
- **THEN** data tampilan hari tersebut menggunakan hasil pengambilan yang sama, sehingga tidak diperlukan pengambilan ulang setelah seed

### Requirement: Invalidasi Cache Setelah Mutasi Hari

Sistem SHALL meng-invalidate cache data hari ini setelah mutasi yang mengubah hari tersebut — simpan input pagi, simpan input malam, tandai libur, dan buka lagi — sehingga view lain yang menampilkan status/detail hari tersebut otomatis menampilkan data terbaru tanpa menunggu kedaluwarsa cache atau reload halaman.

#### Scenario: Simpan pagi lalu kembali ke halaman utama

- **WHEN** pengguna menyimpan input pagi (status menjadi `pagi_selesai`) lalu kembali ke `/`
- **THEN** halaman utama menampilkan status `pagi_selesai` seketika dari cache yang di-invalidate

#### Scenario: Tandai libur memperbarui status

- **WHEN** pengguna menandai warung libur dari halaman utama
- **THEN** status hari langsung berubah menjadi `libur` di semua view yang menampilkannya

### Requirement: Client State Terpisah dari Cache

Sistem SHALL menyimpan client state (sesi autentikasi dan tanggal aktif) di Pinia, terpisah dari server state yang ter-cache di vue-query. Status autentikasi SELALU berasal dari store sesi yang disinkronkan dengan listener Supabase, bukan dari cache query.

#### Scenario: Login/logout tidak bergantung pada cache query

- **WHEN** pengguna melakukan login atau logout
- **THEN** status sesi diperbarui langsung oleh store sesi Pinia dan router bereaksi pada status tersebut tanpa perantara cache query
