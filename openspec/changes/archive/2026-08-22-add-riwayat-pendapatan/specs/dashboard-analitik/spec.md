## ADDED Requirements

### Requirement: Riwayat Pendapatan Harian

Sistem SHALL menampilkan kartu "Riwayat pendapatan" berupa list riwayat pemasukan harian di antara panel "Tren keuntungan" dan grid "Lauk terlaris" pada `/dashboard`. Tiap baris SHALL menampilkan tepat empat field: total pendapatan, tanggal & hari, total porsi dikonsumsi, dan keuntungan bersih. Sistem SHALL hanya menampilkan hari dengan status `malam_selesai` (hari `libur` dan hari tanpa input di-skip), SHALL mengurutkan baris dari tanggal terbaru ke terlama, dan SHALL membatasi tinggi list dengan `max-height` + scroll internal. Gaya kartu dan baris SHALL konsisten dengan kartu dashboard lainnya (`rounded-2xl bg-white p-5 shadow-sm`), dengan aksen warna pada profit (hijau untuk laba, merah untuk rugi).

#### Scenario: Menampilkan list riwayat di bawah chart Tren

- **WHEN** pengguna membuka `/dashboard` dan terdapat hari dengan status `malam_selesai` dalam rentang aktif
- **THEN** sistem menampilkan kartu "Riwayat pendapatan" tepat di antara panel "Tren keuntungan" dan grid "Lauk terlaris", dengan baris terbaru di posisi paling atas

#### Scenario: Isi tiap baris sesuai brief

- **WHEN** sebuah baris riwayat dirender
- **THEN** baris tersebut menampilkan total pendapatan (format Rupiah), tanggal beserta nama hari (mis. "Sabtu, 22 Agt" + "22/08"), total porsi dikonsumsi, dan keuntungan bersih (format Rupiah, berwarna sesuai tanda)

#### Scenario: Skip hari libur dan hari tanpa input

- **WHEN** dalam rentang terdapat hari berstatus `libur` atau tidak memiliki data rekonsiliasi
- **THEN** hari tersebut tidak muncul di list riwayat

#### Scenario: List membatasi tinggi dan dapat di-scroll

- **WHEN** jumlah baris melebihi kapasitas tinggi kartu
- **THEN** list menerapkan `max-height` dengan scroll internal tanpa mengubah tinggi kartu secara keseluruhan

#### Scenario: Mengikuti toggle rentang 7/30 hari

- **WHEN** pengguna mengganti rentang tren dari 7 ke 30 hari atau sebaliknya
- **THEN** list riwayat ikut memperbarui isinya ke rentang yang dipilih, dan mematuhi aturan loading/error per-panel seperti panel dashboard lainnya
