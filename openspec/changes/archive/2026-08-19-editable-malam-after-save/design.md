## Context

Input Malam adalah langkah terakhir dalam alur rekonsiliasi harian. Setelah disimpan, status berubah ke `malam_selesai` dan semua field terkunci. Database trigger `hitung_agregat_rekonsiliasi()` menghitung ulang agregat (pendapatan, HPP, kerugian) hanya saat status BUKAN `malam_selesai` — sehingga setelah terkunci, trigger skip dan agregat menjadi snapshot permanen.

Input Pagi sudah punya pola edit-after-save (`editMode` ref + tombol "Ubah Input Pagi"). Input Malam belum.

## Goals / Non-Goals

**Goals:**
- Pengguna bisa mengedit semua field input malam setelah tersimpan (sisa layak, rusak, konsumsi, uang laci, uang digital)
- Database trigger tetap menghitung ulang agregat saat edit (guard di service layer)
- Konfirmasi AlertDialog sebelum masuk mode edit, baik dari HomeView maupun dari InputMalamView
- Hapus field modal bahan dari UI malam (sudah ditangani di pagi)
- HomeView menampilkan tombol "Koreksi Input Malam" saat `malam_selesai`

**Non-Goals:**
- Auto-update carry-over hari berikutnya saat sisa layak diedit (biarkan manual)
- Edit input pagi dari layar malam
- Riwayat revisi / audit trail edit

## Decisions

### 1. Guard status revert di service layer (bukan di database)

**Pilihan:** Revert status ke `pagi_selesai` sementara sebelum upsert detail, lalu set balik ke `malam_selesai`.

**Alternatif yang ditolak:**
- Modify database trigger untuk selalu jalan → melanggar prinsip "snapshot terkunci" yang sudah ada
- Buat function baru `recalculateAgregat()` → lebih banyak code, trigger tetap skip
- Tambah status baru `malam_editable` → kompleks, bikin confusion di UI

**Rationale:** Revert sementara paling sederhana. Trigger yang sudah ada langsung jalan tanpa perubahan database. Status akhir tetap `malam_selesai`.

### 2. Modal field dihapus dari UI malam

**Pilihan:** Hapus input modal bahan dan warning `daftarEstimasi` dari InputMalamView. Nilai `modal_baru_total` tetap dikirim ke database (dari data pagi yang sudah tersimpan).

**Alternatif yang ditolak:**
- Tetap tampilkan tapi read-only → user bingung kenapa tidak bisa edit
- Sembunyikan tapi tetap bisa diisi via hidden input → tidak transparan

**Rationale:** Konsisten dengan prinsip "modal diisi di pagi". User yang lupa isi modal di pagi akan pakai HPP estimasi — ini sudah di-handling di pagi dengan warning.

### 3. MakanSendiri di-derive dari data tersimpan

**Pilihan:** Saat masuk edit mode, cek apakah ada row dengan `konsumsi > 0`. Kalau ya, set `makanSendiri = true`; kalau tidak, `makanSendiri = false`.

**Alternatif yang ditolak:**
- Default selalu `true` → misleading kalau data aslinya konsumsi = 0
- Tambah kolom `makan_sendiri` ke database → over-engineering

**Rationale:** Derive dari data yang ada paling akurat tanpa perubahan schema.

### 4. Navigasi dari HomeView via router.push setelah konfirmasi

**Pilihan:** AlertDialog konfirmasi → `router.push('/malam')`. InputMalamView menerima state `editMode: true` via route query param atau simply set `editMode = true` when `terkunci && initiatedFromHome`.

**Alternatif yang ditolak:**
- Link langsung tanpa dialog → user bisa salah tap
- Dialog di InputMalamView saja → user sudah navigate dulu, baru tahu ada konfirmasi

**Rationale:** Konfirmasi di HomeView lebih natural — user tahu mereka mau edit sebelum navigate.

### 5. Route query param untuk trigger editMode

**Pilihan:** HomeView navigasi ke `/malam?edit=1`. InputMalamView cek `route.query.edit === '1'` dan set `editMode = true` jika terkunci.

**Alternatif yang ditolak:**
- Shared state / store → tight coupling, state management overhead
- Always show edit button di malam selesai → tetap perlu konfirmasi

**Rationale:** Query param paling sederhana, stateless, dan bisa di-share via URL.

## Risks / Trade-offs

- **Carry-over stale** → User edit `sisaLayak` hari ini, tapi carry-over hari besok sudah terlanjur pakai nilai lama. **Mitigation:** Tidak di-auto-update; user perlu sadar untuk koreksi hari besok juga. Ini acceptable untuk skala warunk kecil.

- **Race condition edit** → Dua device edit malam yang sama bersamaan. **Mitigation:** Sudah di-handle oleh Supabase RLS (user yang sama) dan upsert terakhir menang. Tidak ada real-time collaboration di app ini.

- **Trigger skip selama edit** → Saat status di-revert ke `pagi_selesai`, trigger jalan normal. Tapi jika user buka input pagi di device lain saat edit malam, mereka bisa edit pagi juga. **Mitigation:** Acceptable — flow edit malam dari HomeView sudah dikonfirmasi, dan ini edge case yang jarang.

- **Data konsistensi** → Setelah edit, agregat di `rekonsiliasi_harian` dihitung ulang oleh trigger, lalu `simpanMalam` update uang fields. Jika trigger skip (karena status sudah `malam_selesai` di akhir `simpanMalam`), uang fields mungkin tidak sinkron dengan agregat. **Mitigation:** `simpanMalam` harus revert → upsert → set balik dalam satu transaction.
