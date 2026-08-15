# Spesifikasi Fitur Aplikasi Manajemen Warung Makan

Pencatatan penjualan, manajemen stok & bahan baku, serta kalkulasi HPP dan keuntungan otomatis.

## Referensi Masalah

| Kode   | Masalah                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------ |
| **M1** | Tidak pernah tahu keuntungan bersih; yang diketahui hanya pendapatan kotor di akhir waktu penjualan          |
| **M2** | Tidak tahu modal yang harus dikeluarkan untuk jumlah porsi yang akan dijual pada hari itu                    |
| **M3** | Tidak tahu keuntungan yang didapat dari hasil kalkulasi modal dan pendapatan                                 |
| **M4** | Tidak tahu HPP yang harus ditentukan agar keuntungan maksimal                                                |
| **M5** | Sulit melakukan kalkulasi rekap per periode (harian, bulanan, tahunan) karena masih manual dengan kalkulator |

Setiap fitur di bawah mencantumkan kode masalah yang dijawab. **"Menjawab langsung"** = fitur ini secara langsung menyelesaikan masalah tsb. **"Mendukung"** = fitur ini fondasi/data pendukung agar fitur lain bisa menjawab masalah tsb.

---

## Modul 1 — Manajemen Bahan Baku & Stok

_Fondasi data harga dan ketersediaan bahan baku untuk seluruh kalkulasi modal (M2) dan HPP (M4)._

### 1.1 Data Master Bahan Baku

**Mendukung:** M2, M4 (fondasi data)

- CRUD (tambah/lihat/ubah/hapus) bahan baku dengan field: nama bahan baku, satuan ukur (kg, gram, liter, ml, pcs, ikat, dll.), harga beli per satuan terbaru, jumlah stok saat ini, batas stok minimum
- Field opsional: kategori bahan baku, nama supplier
- Satuan pada tiap bahan baku wajib konsisten dengan satuan yang dipakai di resep (Modul 2) dan pencatatan pembelian (1.2)

### 1.2 Pencatatan Pembelian Bahan Baku (Stok Masuk)

**Mendukung:** M2, M4 (akurasi harga terkini)

- Input: bahan baku yang dibeli, jumlah, harga beli (total atau per satuan), tanggal pembelian
- Sistem otomatis menambah stok bahan baku terkait dan memperbarui "harga beli per satuan terbaru" pada 1.1
- Opsional: kalkulasi harga rata-rata tertimbang (weighted average) bila harga bahan baku sering berubah, agar HPP di Modul 2 tidak bias ke satu harga pembelian terakhir saja

### 1.3 Pemantauan Stok & Notifikasi Stok Menipis

**Mendukung:** M2 (kepastian ketersediaan sebelum produksi)

- Status tiap bahan baku ditampilkan sebagai Aman / Menipis / Habis, dibandingkan terhadap batas stok minimum (1.1)
- Notifikasi otomatis saat stok bahan baku mencapai atau di bawah batas minimum

### 1.4 Pengurangan Stok Otomatis

**Mendukung:** M2, M5 (data stok & histori selalu akurat tanpa input manual berulang)

- Saat transaksi penjualan tersimpan (Modul 4), sistem otomatis mengurangi stok tiap bahan baku sesuai resep (Modul 2) dikali jumlah porsi terjual

### 1.5 Kartu Stok (Riwayat Mutasi)

**Mendukung:** M2 (transparansi pergerakan stok)

- Log seluruh mutasi stok tiap bahan baku: masuk (pembelian), keluar (terpakai penjualan), penyesuaian — masing-masing dengan tanggal, jumlah, dan keterangan

### 1.6 Stok Opname (Penyesuaian Manual)

**Mendukung:** M2 (akurasi stok agar kalkulasi kecukupan modal tidak salah)

- Form koreksi jumlah stok sistem saat berbeda dari stok fisik (misal bahan baku rusak/susut), dengan kolom alasan penyesuaian

---

## Modul 2 — Manajemen Resep & Kalkulasi HPP

_Menjawab langsung kebutuhan mengetahui HPP ideal (M4), sekaligus menjadi dasar kalkulasi modal (M2) dan keuntungan (M1, M3)._

### 2.1 Data Master Menu

**Mendukung:** M4 (fondasi)

- CRUD menu/produk: nama menu, kategori (opsional), harga jual saat ini

### 2.2 Definisi Resep (Bill of Materials)

**Mendukung:** M4 (fondasi)

- Setiap menu dipetakan ke satu/lebih bahan baku beserta takaran pemakaian per satu porsi (contoh: 1 porsi "Nasi Goreng" = 200 gr beras + 1 butir telur + 50 gr ayam)
- Satu bahan baku bisa dipakai di banyak resep menu; satu menu bisa memakai banyak bahan baku

### 2.3 Kalkulasi HPP Otomatis per Porsi

**Menjawab langsung:** M4

- Formula: `HPP Bahan Baku/Porsi = Σ (takaran bahan baku pada resep × harga beli bahan baku per satuan terbaru)`
- HPP tiap menu otomatis ter-update setiap kali harga bahan baku berubah (dari 1.2), sehingga selalu mencerminkan HPP terkini

### 2.4 Komponen Biaya Operasional per Porsi (Opsional)

**Menjawab langsung:** M4 (akurasi HPP)

- Pengguna dapat menambahkan biaya lain di luar bahan baku yang dialokasikan per porsi (contoh: gas, kemasan, tenaga kerja)
- Formula: `HPP Total/Porsi = HPP Bahan Baku/Porsi + Biaya Operasional/Porsi`

### 2.5 Rekomendasi Harga Jual Berdasarkan Target Margin

**Menjawab langsung:** M4

- Pengguna memasukkan target margin keuntungan (%) per menu atau secara global
- Formula: `Harga Jual Rekomendasi = HPP Total/Porsi ÷ (1 − target margin%)`
- Sistem menampilkan perbandingan: harga jual saat ini vs harga jual rekomendasi vs margin aktual dari harga saat ini, dengan `Margin Aktual = (Harga Jual − HPP Total/Porsi) ÷ Harga Jual × 100%`

### 2.6 Simulasi Skenario (What-If) HPP & Harga Jual

**Menjawab langsung:** M4

- Pengguna dapat mensimulasikan perubahan harga bahan baku atau target margin secara sementara (tanpa mengubah data asli), dan langsung melihat dampaknya terhadap HPP, harga jual ideal, serta keuntungan per porsi

### 2.7 Peringatan Harga Jual di Bawah HPP

**Menjawab langsung:** M4 (mencegah kerugian akibat HPP tidak diketahui)

- Notifikasi otomatis apabila harga jual yang ditetapkan pada menu (2.1) berada di bawah HPP Total/Porsi (2.4) atau di bawah margin minimum yang ditentukan pengguna

---

## Modul 3 — Perencanaan Produksi & Kebutuhan Modal Harian

_Menjawab langsung kebutuhan mengetahui modal untuk rencana penjualan harian (M2)._

### 3.1 Input Rencana Penjualan Harian

**Menjawab langsung:** M2

- Form input sebelum mulai berjualan: jumlah porsi yang direncanakan untuk dijual per menu, pada tanggal tersebut

### 3.2 Kalkulasi Otomatis Total Modal yang Dibutuhkan

**Menjawab langsung:** M2

- Formula: `Total Modal Harian = Σ (rencana porsi per menu × HPP Total/Porsi menu tsb)`, dijumlahkan untuk seluruh menu yang direncanakan
- Ditampilkan sebagai satu angka total sebelum transaksi penjualan pertama terjadi

### 3.3 Rincian Kebutuhan Bahan Baku Harian

**Mendukung:** M2 (rincian pendukung angka modal)

- Sistem menjabarkan total kebutuhan tiap bahan baku: `Kebutuhan Bahan Baku X = Σ (rencana porsi menu × takaran bahan baku X pada resep menu tsb)`, digabung lintas semua menu yang direncanakan

### 3.4 Cek Kecukupan Stok terhadap Rencana Produksi

**Mendukung:** M2 (validasi rencana terhadap stok riil)

- Sistem membandingkan stok bahan baku tersedia (Modul 1) dengan hasil 3.3, menandai bahan baku yang stoknya tidak cukup
- Menampilkan estimasi jumlah porsi maksimal yang bisa diproduksi dari stok saat ini, per menu

### 3.5 Proyeksi Keuntungan dari Rencana Penjualan

**Menjawab langsung:** M2, M3

- Formula: `Proyeksi Pendapatan = Σ (rencana porsi × harga jual)`, lalu `Proyeksi Keuntungan = Proyeksi Pendapatan − Total Modal Harian (3.2)`
- Memberi gambaran keuntungan potensial sebelum berjualan, sebagai pembanding terhadap hasil aktual (Modul 5)

---

## Modul 4 — Pencatatan Transaksi Penjualan

_Menjadi sumber data utama agar kalkulasi keuntungan (M1, M3) dan laporan periode (M5) bisa otomatis, bukan manual._

### 4.1 Input Transaksi Penjualan

**Mendukung:** M1, M3, M5 (sumber data utama)

- Form input: pilih menu, jumlah porsi terjual, harga jual (default dari 2.1, dapat diubah manual per transaksi bila ada potongan/nego harga)
- Tanggal & waktu transaksi tercatat otomatis oleh sistem

### 4.2 Transaksi Multi-Item dalam Satu Nota

**Mendukung:** M1, M5

- Satu transaksi dapat memuat beberapa menu berbeda sekaligus, sesuai kondisi satu pelanggan memesan lebih dari satu menu

### 4.3 Kalkulasi Otomatis Nilai Transaksi

**Mendukung:** M1

- Formula: `Subtotal Item = qty × harga jual`; `Total Transaksi = Σ subtotal seluruh item dalam nota`

### 4.4 Sinkronisasi Otomatis ke Stok Bahan Baku

**Mendukung:** M2 (lewat fitur 1.4)

- Setiap transaksi tersimpan otomatis memicu pengurangan stok bahan baku sesuai resep, tanpa input manual terpisah

### 4.5 Riwayat & Pencarian Transaksi

**Mendukung:** M5 (sumber data Modul 6)

- Daftar seluruh transaksi dengan filter berdasarkan tanggal/rentang tanggal dan/atau menu

### 4.6 Edit & Pembatalan Transaksi

**Mendukung:** M1, M3, M5 (akurasi data agar kalkulasi tidak salah)

- Transaksi dapat diedit/dibatalkan, dengan stok bahan baku otomatis dikembalikan (rollback) agar data stok & keuangan tetap konsisten

---

## Modul 5 — Dashboard & Kalkulasi Keuntungan

_Menjawab langsung kebutuhan mengetahui keuntungan bersih (M1) dan keuntungan dari hasil kalkulasi modal-pendapatan (M3)._

### 5.1 Kalkulasi Pendapatan Kotor Otomatis

**Menjawab langsung:** M1 (komponen "pendapatan kotor")

- Formula: `Pendapatan Kotor = Σ Total Transaksi (Modul 4) pada periode yang dipilih` — dihitung otomatis, tanpa penjumlahan manual

### 5.2 Kalkulasi Total Modal Terpakai (HPP Aktual)

**Menjawab langsung:** M1, M3

- Formula: `Total Modal Terpakai = Σ (jumlah porsi terjual aktual per menu × HPP Total/Porsi menu tsb)`, dihitung dari data transaksi riil (Modul 4), bukan dari rencana (Modul 3)

### 5.3 Kalkulasi Keuntungan Bersih Otomatis

**Menjawab langsung:** M1, M3

- Formula: `Keuntungan Bersih = Pendapatan Kotor (5.1) − Total Modal Terpakai (5.2)`
- Formula margin: `Margin Keuntungan = (Keuntungan Bersih ÷ Pendapatan Kotor) × 100%`

### 5.4 Dashboard Ringkasan Real-Time

**Menjawab langsung:** M1, M3

- Tiga angka utama ditampilkan berdampingan: Pendapatan Kotor, Total Modal Terpakai, Keuntungan Bersih — otomatis ter-update setiap ada transaksi baru

### 5.5 Breakdown Keuntungan per Menu

**Menjawab langsung:** M1, M3; **Mendukung:** M4

- Formula: `Keuntungan Menu = jumlah terjual × (harga jual − HPP Total/Porsi)`, ditampilkan terurut dari kontribusi tertinggi ke terendah — membantu evaluasi keputusan HPP/harga di Modul 2

### 5.6 Perbandingan Rencana vs Realisasi

**Menjawab langsung:** M2, M3

- Membandingkan Proyeksi Modal & Keuntungan (3.5) dengan Modal & Keuntungan aktual pada hari yang sama (5.2, 5.3), beserta selisihnya

---

## Modul 6 — Laporan & Analisis per Periode

_Menjawab langsung kesulitan melakukan kalkulasi rekap manual per periode (M5)._

### 6.1 Filter & Pemilihan Periode Laporan

**Menjawab langsung:** M5

- Pilihan periode: Harian, Mingguan, Bulanan, Tahunan, dan Rentang Tanggal Custom

### 6.2 Rekap Otomatis Pendapatan, Modal & Keuntungan per Periode

**Menjawab langsung:** M5

- Sistem otomatis menjumlahkan seluruh data transaksi (Modul 4) dan hasil kalkulasi keuntungan (Modul 5) dalam periode terpilih menjadi satu rekap: total pendapatan, total modal, total keuntungan, jumlah transaksi, rata-rata keuntungan per hari

### 6.3 Grafik Tren Penjualan & Keuntungan

**Menjawab langsung:** M5

- Visualisasi grafik (garis/batang) untuk pendapatan, modal, dan keuntungan dari waktu ke waktu, mengikuti granularitas periode yang dipilih

### 6.4 Perbandingan Antar Periode

**Menjawab langsung:** M5

- Membandingkan dua periode yang setara (misal bulan ini vs bulan lalu, tahun ini vs tahun lalu), termasuk persentase kenaikan/penurunan pendapatan dan keuntungan

### 6.5 Laporan Menu Terlaris & Paling Menguntungkan per Periode

**Menjawab langsung:** M5; **Mendukung:** M4

- Ranking menu berdasarkan jumlah porsi terjual dan berdasarkan kontribusi keuntungan (5.5), difilter sesuai periode terpilih

### 6.6 Ekspor Laporan

**Menjawab langsung:** M5

- Unduh rekap laporan periode terpilih dalam format PDF atau Excel
