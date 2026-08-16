# Product Requirement Document (PRD)

## Sistem Rekonsiliasi Mundur — Manajemen Profit Warung Nasi Campur Tradisional

| Metadata      | Keterangan                                          |
| ------------- | --------------------------------------------------- |
| Nama Produk   | _(working title)_ Warunk — Rekonsiliasi Mundur   |
| Versi Dokumen | 1.0                                                 |
| Tipe Proyek   | Personal Project / Impact-Driven untuk UMKM Kuliner |
| Platform      | Mobile-First Progressive Web App (PWA)              |
| Status        | Draft — Siap Pakai untuk Development                |

---

## 1. Product Overview & Objectives

### 1.1 Deskripsi Produk

Warunk adalah aplikasi web mobile-first (PWA) yang membantu pemilik warung nasi campur tradisional menghitung **keuntungan bersih harian secara otomatis**, tanpa mengganggu kecepatan pelayanan di jam sibuk. Berbeda dengan POS konvensional yang mencatat _setiap transaksi_ di kasir (dan terbukti gagal karena memperlambat antrean saat jam ramai), aplikasi ini menggunakan pendekatan **Backward Reconciliation (Rekonsiliasi Mundur)**: sistem tidak pernah mencatat apa yang dijual, melainkan menghitung apa yang **habis dikonsumsi** dengan membandingkan stok awal (pagi) dan stok akhir (malam) dari setiap jenis lauk/masakan.

Prinsip inti: _"Kita tidak perlu tahu siapa membeli apa. Kita cukup tahu apa yang hilang dari stok, dan itu adalah apa yang terjual."_

Beban input data digeser sepenuhnya ke waktu senggang pemilik warung — pagi sebelum buka dan malam setelah tutup — sehingga jam operasional sibuk (siang) berjalan 100% seperti biasa tanpa aplikasi.

### 1.2 Masalah Utama yang Diselesaikan

- Pemilik warung **tidak pernah tahu profit bersih harian** secara akurat karena:
  - HPP (Harga Pokok Penjualan) bahan baku bersifat dinamis/fluktuatif per hari (harga pasar berubah-ubah).
  - Kombinasi pesanan pelanggan sangat acak (nasi campur = kombinasi bebas dari banyak jenis lauk), sehingga mustahil dicatat manual per transaksi saat ramai.
  - Sistem POS konvensional gagal diterapkan karena menambah waktu antre di kasir pada jam sibuk — sudah dibuktikan tidak layak (validated failure).
- Tidak ada mekanisme untuk mendeteksi **kebocoran uang** (selisih antara uang kas fisik dengan uang yang seharusnya ada berdasarkan hasil rekonsiliasi stok).
- Tidak ada pencatatan sistematis untuk **stok basi/rusak**, sehingga kerugian riil tidak pernah terukur dan sering "hilang" begitu saja dari perhitungan.

### 1.3 Metrik Kesuksesan Produk (Success Metrics)

| Kategori        | Metrik                                                  | Target                                                  |
| --------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| Adopsi Pengguna | Konsistensi input harian (pagi + malam)                 | ≥ 90% hari operasional dalam sebulan terisi lengkap     |
| Adopsi Pengguna | Waktu pengisian modul malam                             | ≤ 5 menit per sesi                                      |
| Akurasi Bisnis  | Selisih kas (uang fisik vs uang hasil rekonsiliasi)     | Termonitor tiap hari, tren mengecil dari waktu ke waktu |
| Akurasi Bisnis  | Akurasi HPP campuran (weighted average)                 | Deviasi < 5% dibanding perhitungan manual akuntan       |
| Dampak (Impact) | Pemilik warung dapat menjawab "untung berapa hari ini?" | Dalam < 10 detik setelah input malam selesai            |
| Retensi         | Pemakaian aktif berkelanjutan                           | Digunakan tanpa jeda > 3 hari berturut-turut            |

---

## 2. User Persona & Workflow

### 2.1 Persona: Pemilik Warung Nasi Campur

**Nama Persona:** Bu Sri, 48 tahun, pemilik warung nasi campur tradisional.

- **Latar belakang:** Menjalankan warung 6 hari/minggu, tidak familiar dengan aplikasi kompleks, terbiasa dengan HP Android sederhana untuk WhatsApp dan sosial media.
- **Kondisi kerja:** Sangat sibuk pada jam makan siang (11.00–14.00) dan makan malam ringan (17.00–19.00); relatif senggang pada pagi hari sebelum buka (05.00–08.00) dan malam setelah tutup (20.00–21.00).
- **Kebutuhan utama:** UI sangat sederhana, minim ketik, berbasis tap/pilih angka, tidak butuh pelatihan panjang.
- **Ketakutan utama:** Takut aplikasi ribet, takut proses tambahan memperlambat pelayanan, takut data hilang/salah input dan tidak bisa dikoreksi.
- **Tujuan akhir:** Ingin tahu secara pasti "hari ini untung berapa" tanpa harus menghitung manual dengan kalkulator dan buku catatan setiap malam.

### 2.2 Alur Kerja Pengguna (3 Fase)

#### FASE 1 — PAGI (Sebelum Buka, ± 05.00–08.00)

**Tujuan:** Menetapkan baseline stok hari ini.

1. Pemilik membuka aplikasi, memilih menu **"Input Stok Pagi"**.
2. Sistem otomatis menampilkan **carry-over stock** (sisa lauk kemarin malam yang masih layak jual) sebagai baris awal per item.
3. Pemilik mengecek fisik lauk sisa kemarin:
   - Jika masih layak → dikonfirmasi masuk sebagai stok aktif hari ini (carry-over).
   - Jika basi/rusak → dicatat di **"Porsi Basi Pagi"**, otomatis dikeluarkan dari stok aktif dan dicatat sebagai kerugian (loss) langsung.
4. Pemilik menambahkan jumlah porsi masakan baru yang dimasak hari ini per jenis lauk, beserta estimasi total modal bahan baku hari ini (untuk kalkulasi HPP fluktuatif).
5. Sistem otomatis menghitung **Total Stok Aktif Awal** per lauk = carry-over layak jual + porsi baru.

#### FASE 2 — SIANG (Jam Operasional, ± 08.00–20.00)

**Tujuan:** Warung beroperasi normal 100% tanpa aplikasi.

- Tidak ada input apa pun ke sistem.
- Pemilik/karyawan melayani pembeli seperti biasa, tanpa mencatat transaksi apa pun.
- Uang hasil penjualan dikumpulkan di laci kasir seperti biasa.

#### FASE 3 — MALAM (Setelah Tutup, ± 20.00–21.00)

**Tujuan:** Rekonsiliasi mundur untuk menghitung apa yang terjual dan profit bersih.

1. Pemilik membuka menu **"Input Malam"**.
2. Untuk setiap jenis lauk, pemilik menghitung sisa fisik (stok opname) dan menginput:
   - Jumlah porsi sisa yang **masih layak jual besok (carry-over)**.
   - Jumlah porsi yang **rusak/basi hari ini** (loss).
3. Sistem otomatis menghitung **Porsi Dikonsumsi** = Stok Aktif Awal − Sisa Layak Jual − Porsi Rusak.
4. Pemilik menginput **Total Uang di Laci Kasir** (satu angka saja, hasil hitung uang fisik).
5. Sistem menampilkan ringkasan: Total HPP Nyata, Estimasi Pendapatan (berdasarkan harga jual per porsi), Keuntungan Bersih, dan **Selisih Kas** (deteksi potensi kebocoran).
6. Data tersimpan, dashboard otomatis ter-update.

---

## 3. Logika Matematika & Inventory Core System

### 3.1 Alur Kalkulasi Inti

```
[Stok Aktif Awal] = [Carry-Over Layak Jual (dari kemarin)] + [Porsi Masak Baru Hari Ini]

[Porsi Dikonsumsi] = [Stok Aktif Awal] − [Sisa Layak Jual Malam Ini] − [Porsi Rusak Malam Ini]

[Total HPP Nyata] = Σ ( [Porsi Dikonsumsi per Lauk] × [HPP per Porsi (Weighted Average)] )

[Total Pendapatan Estimasi] = Σ ( [Porsi Dikonsumsi per Lauk] × [Harga Jual per Porsi] )

[Keuntungan Bersih Harian] = [Total Pendapatan Estimasi] − [Total HPP Nyata] − [Total Nilai Kerugian (Basi/Rusak)]
```

### 3.2 Penanganan Porsi Rusak/Basi

Ada **dua titik pencatatan kerugian** yang harus dibedakan secara eksplisit karena berbeda waktu kejadian dan konsekuensi datanya:

| Titik Pencatatan      | Kapan Terjadi                                                         | Efek pada Sistem                                                                                                                                       |
| --------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Porsi Basi Pagi**   | Ditemukan sebelum warung buka, dari sisa carry-over kemarin           | Nilai modal (berdasarkan HPP carry-over) langsung dicatat sebagai _Loss_, dan **tidak pernah masuk ke Stok Aktif Awal hari ini**                       |
| **Porsi Rusak Malam** | Ditemukan saat stok opname malam, dari total stok aktif hari berjalan | Nilai modal (berdasarkan HPP weighted average hari itu) dicatat sebagai _Loss_, dikeluarkan dari perhitungan Porsi Dikonsumsi (bukan dianggap terjual) |

Kedua nilai loss ini dijumlahkan menjadi **Total Nilai Kerugian** dan mengurangi keuntungan bersih harian secara langsung — bukan disembunyikan atau diabaikan.

### 3.3 Skenario Carry-Over Stock

Lauk yang tidak habis terjual namun masih layak konsumsi dapat "dibawa" ke hari berikutnya dan dijual kembali. Sistem wajib:

- Menyimpan jumlah porsi carry-over per lauk beserta **HPP asalnya** (HPP hari kemarin, bukan HPP hari ini).
- Menyatukan carry-over dengan porsi baru dalam satu kolam stok aktif (namun HPP-nya tetap dihitung terpisah lalu digabung via weighted average — lihat 3.4).
- Mencegah carry-over "menumpuk" tanpa batas: jika porsi carry-over ditemukan basi di pagi hari berikutnya, otomatis dicatat sebagai Porsi Basi Pagi (lihat 3.2) dan modalnya keluar dari sirkulasi.

### 3.4 Weighted Average Cost (HPP Campuran)

Karena carry-over punya HPP dari hari kemarin dan masakan baru punya HPP hari ini (fluktuatif), sistem **wajib** menghitung HPP gabungan per porsi menggunakan metode rata-rata tertimbang:

```
HPP Gabungan per Porsi =
    ( [Jumlah Porsi Carry-Over] × [HPP per Porsi Carry-Over, dari data kemarin] )
  + ( [Jumlah Porsi Baru] × [HPP per Porsi Baru, dari total modal ÷ jumlah porsi baru hari ini] )
  ÷
    ( [Jumlah Porsi Carry-Over] + [Jumlah Porsi Baru] )
```

**Contoh perhitungan:**

- Carry-over: 5 porsi ayam goreng sisa kemarin, HPP kemarin Rp 6.000/porsi → subtotal modal Rp 30.000
- Baru: 20 porsi ayam goreng dimasak hari ini, total modal bahan baku Rp 140.000 → HPP baru Rp 7.000/porsi → subtotal modal Rp 140.000
- Total porsi aktif = 25, Total modal = Rp 170.000
- **HPP Gabungan = Rp 170.000 ÷ 25 = Rp 6.800/porsi**

HPP gabungan inilah yang dipakai untuk menghitung Total HPP Nyata dari Porsi Dikonsumsi pada hari tersebut (poin 3.1).

### 3.5 Aturan Penting Tambahan

- Sistem **tidak boleh** mencampur porsi carry-over dari lebih dari satu hari sebelumnya tanpa jejak — setiap batch carry-over menyimpan referensi ke `rekonsiliasi_harian` asalnya untuk audit trail.
- Jika HPP porsi baru tidak diketahui (modal belum diinput), sistem menggunakan **HPP Estimasi** dari master lauk sebagai fallback, dan menandai hari itu sebagai "estimasi belum final" pada dashboard.

---

## 4. Functional Requirements (Fitur Utama)

### 4.1 Manajemen Master Lauk & HPP Estimasi

- CRUD daftar jenis lauk/masakan (nama, foto opsional, satuan porsi).
- Set **Harga Jual per Porsi** default (dapat diubah sewaktu-waktu).
- Set **HPP Estimasi per Porsi** default — dipakai sebagai fallback ketika modal harian belum diinput atau untuk proyeksi cepat.
- Toggle aktif/nonaktif lauk (untuk lauk musiman yang tidak selalu ada).

### 4.2 Modul Input Pagi (Stok Awal Masakan)

- Menampilkan daftar carry-over otomatis dari sesi malam kemarin (read-only, hasil sistem).
- Untuk setiap carry-over: tombol besar **"Masih Layak Jual"** / **"Basi — Catat Rugi"** (Porsi Basi Pagi).
- Input jumlah porsi baru per lauk menggunakan stepper/tombol +/− besar (bukan keyboard angka manual) untuk kecepatan.
- Input total modal bahan baku harian per lauk (angka bulat, opsional per item, boleh diisi belakangan sebelum malam).
- Tombol simpan tunggal: **"Selesai Input Pagi"**.

### 4.3 Modul Input Malam (Sisa Lauk, Basi, & Uang Laci)

- Daftar semua lauk yang aktif hari ini dengan Stok Aktif Awal sudah terisi otomatis dari data pagi.
- Untuk tiap lauk: dua kolom input stepper — **Sisa Layak Jual** dan **Porsi Rusak**.
- Validasi otomatis: Sisa Layak Jual + Porsi Rusak tidak boleh melebihi Stok Aktif Awal.
- Satu input tunggal: **Total Uang di Laci Kasir Malam Ini**.
- Setelah simpan, sistem langsung menampilkan **Ringkasan Hari Ini** (lihat 4.4) sebagai konfirmasi visual instan.

### 4.4 Dashboard Analisis Pemilik

- **Ringkasan Hari Ini:** Total Pendapatan Estimasi, Total HPP Nyata, Total Kerugian (basi pagi + malam), Keuntungan Bersih, dan **Selisih Kas** (Uang Laci Fisik − Total Pendapatan Estimasi).
- **Detektor Selisih/Kebocoran Uang:** indikator warna (hijau = selisih wajar dalam toleransi, kuning = selisih sedang, merah = selisih besar/berpotensi kebocoran), dengan ambang batas toleransi yang dapat dikonfigurasi pemilik.
- **Tren Profit Harian/Mingguan:** grafik sederhana (bar/line chart) untuk 7 dan 30 hari terakhir.
- **Ranking Lauk Terlaris & Paling Sering Basi:** membantu pemilik menyesuaikan jumlah masak besok.
- Semua visual didesain untuk dibaca sekilas (glanceable), bukan tabel data mentah.

---

## 5. Technical Architecture & Data Model

### 5.1 Rekomendasi Tech Stack

| Layer                               | Rekomendasi                                                                                                                                                     | Alasan                                                                                                                                  |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend                            | **Vue 3 (Composition API) + TypeScript + Vite**, styling dengan **Tailwind CSS**, dikonfigurasi sebagai **PWA** (`vite-plugin-pwa` / manifest + service worker) | Mobile-first, installable ke home screen tanpa app store, type-safety untuk logika kalkulasi HPP yang kompleks, cepat dikembangkan solo |
| Backend & Auth                      | **Supabase** (PostgreSQL + Auth + Row Level Security)                                                                                                           | Backend-as-a-service, cocok untuk proyek personal, generated columns native di Postgres                                                 |
| State/Data Fetching                 | **Supabase JS Client + Pinia** (state management) **+ TanStack Query for Vue**                                                                                  | Pinia untuk state global (sesi hari berjalan, status pagi/malam), TanStack Query untuk caching & optimistic update saat tap tombol      |
| Hosting                             | **Vercel** atau **Netlify** (frontend, static/SSR build via Vite) + **Supabase Cloud** (database)                                                               | Free tier cukup untuk skala 1 warung, deploy langsung dari Git                                                                          |
| Offline Support (opsional lanjutan) | Service Worker caching + local queue sebelum sync ke Supabase                                                                                                   | Antisipasi warung dengan koneksi internet tidak stabil saat input pagi/malam                                                            |

### 5.2 Skema Database Minimalis (PostgreSQL / Supabase)

```sql
-- =========================================================
-- 1. MASTER LAUK
-- =========================================================
CREATE TABLE master_lauk (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_lauk           TEXT NOT NULL,
    harga_jual_porsi    NUMERIC(12,2) NOT NULL DEFAULT 0,
    hpp_estimasi_porsi  NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- 2. REKONSILIASI HARIAN (1 baris = 1 hari operasional warung)
-- =========================================================
CREATE TABLE rekonsiliasi_harian (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanggal                 DATE NOT NULL UNIQUE,
    status                  TEXT NOT NULL DEFAULT 'pagi_pending'
                             CHECK (status IN ('pagi_pending','pagi_selesai','malam_selesai')),
    total_uang_laci         NUMERIC(12,2),

    -- Kolom agregat, diisi via trigger/fungsi setelah detail_stok_harian lengkap
    total_pendapatan_estimasi NUMERIC(12,2) DEFAULT 0,
    total_hpp_nyata            NUMERIC(12,2) DEFAULT 0,
    total_kerugian              NUMERIC(12,2) DEFAULT 0,

    -- Generated column: keuntungan bersih dihitung otomatis oleh Postgres
    keuntungan_bersih GENERATED ALWAYS AS (
        total_pendapatan_estimasi - total_hpp_nyata - total_kerugian
    ) STORED,

    -- Generated column: selisih kas untuk detektor kebocoran
    selisih_kas GENERATED ALWAYS AS (
        total_uang_laci - total_pendapatan_estimasi
    ) STORED,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- 3. DETAIL STOK HARIAN (1 baris = 1 lauk pada 1 hari tertentu)
-- =========================================================
CREATE TABLE detail_stok_harian (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rekonsiliasi_id         UUID NOT NULL REFERENCES rekonsiliasi_harian(id) ON DELETE CASCADE,
    lauk_id                 UUID NOT NULL REFERENCES master_lauk(id),

    -- Referensi carry-over: batch asal dari hari sebelumnya (nullable jika tidak ada carry-over)
    carry_over_dari_id      UUID REFERENCES detail_stok_harian(id),

    -- ===== INPUT PAGI =====
    porsi_carry_over        INTEGER NOT NULL DEFAULT 0,      -- sisa layak jual dari kemarin
    hpp_carry_over_porsi    NUMERIC(12,2) NOT NULL DEFAULT 0, -- HPP asal dari batch kemarin
    porsi_basi_pagi         INTEGER NOT NULL DEFAULT 0,      -- carry-over yang ternyata basi pagi ini
    porsi_baru_dimasak      INTEGER NOT NULL DEFAULT 0,
    modal_baru_total        NUMERIC(12,2) NOT NULL DEFAULT 0, -- total modal bahan baku porsi baru hari ini

    -- ===== INPUT MALAM =====
    porsi_sisa_layak_jual   INTEGER NOT NULL DEFAULT 0,      -- carry-over untuk besok
    porsi_rusak_malam       INTEGER NOT NULL DEFAULT 0,

    -- ===== GENERATED COLUMNS (kalkulasi otomatis) =====

    -- Stok Aktif Awal = carry-over layak (sudah dikurangi basi pagi) + porsi baru
    stok_aktif_awal GENERATED ALWAYS AS (
        (porsi_carry_over - porsi_basi_pagi) + porsi_baru_dimasak
    ) STORED,

    -- HPP porsi baru dihitung manual di sisi aplikasi (modal_baru_total / porsi_baru_dimasak)
    -- disimpan sebagai kolom biasa agar bisa diisi via trigger setelah insert
    hpp_baru_porsi NUMERIC(12,2) NOT NULL DEFAULT 0,

    -- HPP Gabungan (Weighted Average) — generated column
    hpp_gabungan_porsi GENERATED ALWAYS AS (
        CASE
            WHEN ( (porsi_carry_over - porsi_basi_pagi) + porsi_baru_dimasak ) = 0 THEN 0
            ELSE (
                ( (porsi_carry_over - porsi_basi_pagi) * hpp_carry_over_porsi )
                + ( porsi_baru_dimasak * hpp_baru_porsi )
            ) / ( (porsi_carry_over - porsi_basi_pagi) + porsi_baru_dimasak )
        END
    ) STORED,

    -- Porsi Dikonsumsi = Stok Aktif Awal - Sisa Layak Jual - Rusak Malam
    porsi_dikonsumsi GENERATED ALWAYS AS (
        ( (porsi_carry_over - porsi_basi_pagi) + porsi_baru_dimasak )
        - porsi_sisa_layak_jual - porsi_rusak_malam
    ) STORED,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_stok_non_negative CHECK (
        porsi_sisa_layak_jual + porsi_rusak_malam
        <= (porsi_carry_over - porsi_basi_pagi) + porsi_baru_dimasak
    )
);

-- =========================================================
-- INDEX PENDUKUNG
-- =========================================================
CREATE INDEX idx_detail_rekonsiliasi ON detail_stok_harian(rekonsiliasi_id);
CREATE INDEX idx_detail_lauk ON detail_stok_harian(lauk_id);
CREATE INDEX idx_rekonsiliasi_tanggal ON rekonsiliasi_harian(tanggal);
```

**Catatan implementasi:**

- Kolom agregat pada `rekonsiliasi_harian` (`total_pendapatan_estimasi`, `total_hpp_nyata`, `total_kerugian`) **tidak** dijadikan generated column karena bergantung pada agregasi lintas-tabel (`SUM` dari `detail_stok_harian`) — Postgres generated column tidak mendukung subquery. Solusi: gunakan **trigger** `AFTER INSERT/UPDATE` pada `detail_stok_harian` yang meng-update baris `rekonsiliasi_harian` terkait, atau hitung on-the-fly via **VIEW**.
- Disarankan membuat `VIEW ringkasan_harian` yang meng-`JOIN` kedua tabel untuk kebutuhan dashboard, agar logika agregasi tidak terduplikasi di frontend.
- Row Level Security (RLS) Supabase cukup diset satu kebijakan sederhana (single-owner access) karena ini proyek personal untuk satu warung.

---

## 6. UI/UX Design Guidelines

### 6.1 Prinsip Desain Utama

- **Mobile-first, satu tangan:** Semua elemen interaktif utama berada dalam jangkauan ibu jari (thumb zone) karena kemungkinan digunakan sambil berdiri/bergegas.
- **Tombol grid besar, minim mengetik:** Gunakan stepper (`−` / angka / `+`) dan grid kartu per lauk dengan foto, bukan form panjang bergaya tabel. Input angka manual hanya untuk nominal uang (total laci, total modal).
- **Zero-training onboarding:** Alur pagi dan malam harus bisa dipahami tanpa penjelasan tertulis — gunakan ikon besar, warna, dan label kata kerja langsung ("Masih Layak Jual", "Catat Rugi").
- **Warna kontras sebagai indikator status:**
  - Hijau → aman/normal (stok sesuai, selisih kas dalam toleransi).
  - Kuning → perlu perhatian (selisih kas sedang, stok basi lebih tinggi dari rata-rata).
  - Merah → kritis (selisih kas besar, indikasi kebocoran, atau lupa input).
- **Progress state yang jelas:** Status harian (`pagi_pending` → `pagi_selesai` → `malam_selesai`) ditampilkan sebagai badge/progress bar di halaman utama, agar pemilik langsung tahu tahap mana yang belum diselesaikan.
- **Konfirmasi instan, bukan laporan tertunda:** Setelah input malam disimpan, ringkasan untung/rugi hari itu langsung tampil di layar yang sama — tanpa perlu berpindah menu ke dashboard.
- **Toleransi kesalahan:** Sediakan opsi edit/undo untuk input hari yang sama sebelum status berubah menjadi `malam_selesai`, mengingat pengguna awam rentan salah tap.
- **Tipografi besar & jelas:** Ukuran font minimum 16px untuk teks, 24–32px untuk angka hasil kalkulasi (profit, selisih kas) agar mudah dibaca sekilas oleh pengguna berusia menengah ke atas.

---

_Dokumen ini disusun sebagai spesifikasi siap-implementasi. Struktur skema database dan rumus kalkulasi pada Bab 3 & 5 dapat langsung digunakan sebagai acuan pengembangan MVP._
