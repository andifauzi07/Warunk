# Edit Malam Flow Specification

## Purpose

Mendefinisikan alur koreksi input malam setelah hari terkunci, termasuk tombol dari HomeView, mode edit di InputMalamView, dan guard status revert saat simpan ulang.

## Requirements

### Requirement: Tombol Koreksi Input Malam di HomeView

Sistem SHALL menampilkan tombol "Koreksi Input Malam" di HomeView saat status hari adalah `malam_selesai`, menggantikan link "Input Malam" yang biasanya muncul di semua status.

#### Scenario: Tombol muncul saat malam selesai

- **WHEN** status hari adalah `malam_selesai`
- **THEN** HomeView menampilkan tombol "Koreksi Input Malam" (bukan RouterLink "Input Malam")

#### Scenario: Tombol tidak muncul saat belum selesai

- **WHEN** status hari bukan `malam_selesai`
- **THEN** HomeView menampilkan RouterLink "Input Malam" seperti biasa

### Requirement: AlertDialog Konfirmasi dari HomeView

Sistem SHALL menampilkan AlertDialog konfirmasi saat pengguna menekan "Koreksi Input Malam" di HomeView, sebelum navigasi ke halaman Input Malam.

#### Scenario: Konfirmasi ditampilkan

- **WHEN** pengguna menekan "Koreksi Input Malam" di HomeView
- **THEN** sistem menampilkan AlertDialog dengan pesan konfirmasi dan dua tombol: "Batal" dan "Ya"

#### Scenario: Pengguna membatalkan

- **WHEN** pengguna menekan "Batal" pada AlertDialog
- **THEN** AlertDialog tertutup dan navigasi tidak terjadi

#### Scenario: Pengguna mengkonfirmasi

- **WHEN** pengguna menekan "Ya" pada AlertDialog
- **THEN** sistem navigasi ke `/malam?edit=1` dan InputMalamView masuk mode edit

### Requirement: Mode Edit di InputMalamView

Sistem SHALL menyediakan mode edit pada InputMalamView yang memungkinkan pengguna mengubah semua field input malam setelah tersimpan.

#### Scenario: Tombol edit muncul di ringkasan terkunci

- **WHEN** status hari adalah `malam_selesai` dan pengguna membuka InputMalamView
- **THEN** sistem menampilkan ringkasan read-only beserta tombol "Ubah Input Malam"

#### Scenario: Konfirmasi sebelum masuk edit mode

- **WHEN** pengguna menekan "Ubah Input Malam"
- **THEN** sistem menampilkan AlertDialog konfirmasi sebelum masuk mode edit

#### Scenario: Masuk edit mode

- **WHEN** pengguna mengkonfirmasi di AlertDialog
- **THEN** semua field input malam menjadi editable (sisa layak, rusak, konsumsi, uang laci, uang digital) dan tombol simpan muncul

#### Scenario: Mode edit dari navigasi HomeView

- **WHEN** pengguna navigasi dari HomeView dengan query param `edit=1`
- **THEN** InputMalamView langsung masuk mode edit tanpa perlu menekan tombol "Ubah Input Malam" lagi

### Requirement: Semua Field Bisa Diedit

Sistem SHALL mengizinkan pengguna mengedit semua field input malam saat dalam mode edit: sisa layak jual, porsi rusak/basi, dimakan sendiri, uang laci, dan uang digital.

#### Scenario: Edit sisa layak jual

- **WHEN** pengguna mengubah nilai sisa layak jual saat mode edit
- **THEN** sistem memperbarui nilai dan menghitung ulang porsi dikonsumsi secara real-time

#### Scenario: Edit uang laci

- **WHEN** pengguna mengubah total uang di laci kasir saat mode edit
- **THEN** sistem memperbarui nilai dan menghitung ulang selisih kas secara real-time

#### Scenario: Simpan ulang setelah edit

- **WHEN** pengguna menekan "Simpan & Kunci Hari Ini" setelah mengedit
- **THEN** sistem menyimpan perubahan, status tetap `malam_selesai`, dan agregat dihitung ulang

### Requirement: Toggle Makan Sendiri di-Derive dari Data

Sistem SHALL meng-derive nilai toggle "Makan Sendiri" dari data tersimpan saat masuk mode edit.

#### Scenario: Ada data konsumsi

- **WHEN** pengguna masuk mode edit dan terdapat lauk dengan porsi_konsumsi > 0
- **THEN** toggle "Makan Sendiri" dalam posisi aktif (ada yang dimakan sendiri)

#### Scenario: Tidak ada data konsumsi

- **WHEN** pengguna masuk mode edit dan semua lauk memiliki porsi_konsumsi = 0
- **THEN** toggle "Makan Sendiri" dalam posisi non-aktif (tidak ada yang dimakan sendiri)

### Requirement: Guard Status Revert di Simpan Malam

Sistem SHALL melakukan revert status dari `malam_selesai` ke `pagi_selesai` sebelum upsert detail saat pengguna menyimpan ulang input malam, sehingga database trigger dapat menghitung ulang agregat.

#### Scenario: Revert sebelum upsert

- **WHEN** pengguna menyimpan input malam pada hari yang sudah berstatus `malam_selesai`
- **THEN** sistem mengubah status ke `pagi_selesai` terlebih dahulu, lalu melakukan upsert detail, lalu mengembalikan status ke `malam_selesai`

#### Scenario: Agregat terupdate setelah edit

- **WHEN** penyimpanan ulang input malam berhasil
- **THEN** agregat di `rekonsiliasi_harian` (pendapatan, HPP, kerugian, profit, selisih kas) sesuai dengan data terbaru

### Requirement: Field Modal Dihapus dari UI Malam

Sistem SHALL tidak menampilkan input modal bahan pada layar Input Malam. Field `modal_baru_total` tetap tersimpan di database dari input pagi.

#### Scenario: Tidak ada input modal di malam

- **WHEN** pengguna membuka InputMalamView dalam mode input atau edit
- **THEN** tidak ada input atau tampilan untuk modal bahan per lauk

#### Scenario: Warning HPP estimasi tidak ditampilkan

- **WHEN** pengguna membuka InputMalamView
- **THEN** tidak ada peringatan "HPP memakai estimasi" terkait modal yang belum diisi
