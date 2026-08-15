## Context

Greenfield: repo saat ini hanya template Vite default (Vue 3 + TS, satu file `App.vue`). PRD v1.0 sudah lengkap (skema SQL + rumus di Bab 3 & 5). Hasil eksplorasi menambahkan lima keputusan desain yang menyempurnakan PRD (porsi konsumsi, snapshot float, kunci final malam, hari libur, pembayaran digital). Dokumen ini merinci cara implementasi.

## Goals / Non-Goals

**Goals:**
- PWA mobile-first satu tangan; input berbasis stepper/tap, minim ketik; sesi malam ≤ 5 menit.
- Engine rekonsiliasi mundur akurat dan dapat diaudit: stok aktif awal, HPP weighted average, porsi dikonsumsi, pendapatan estimasi, HPP nyata, kerugian, profit, selisih kas.
- Prinsip snapshot: semua angka terkunci saat `malam_selesai`; tidak ada perubahan retroaktif.
- Arsitektur sederhana single-owner (1 warung, 1 pengguna).

**Non-Goals:**
- Multi-warung / multi-tenant / multi-user.
- Offline queue & sync (fitur lanjutan PRD §5.1, ditunda).
- Inventori FIFO/ketelusuran batch presisi; HPP weighted average adalah aproksimasi yang disengaja.
- Variance pagi vs catatan malam (Utas 5, ditunda).
- Pembayaran non-tunai terperinci per saluran — cukup satu angka total.

## Decisions

### D1. Tech Stack (mengikuti rekomendasi PRD §5.1)

| Layer | Pilihan | Catatan |
|---|---|---|
| Frontend | Vue 3 (Composition API) + TypeScript + Vite + Tailwind CSS | Sudah basis template |
| Router | `vue-router` | 4 layar utama: Beranda, Pagi, Malam, Dashboard (+ Pengaturan) |
| State global | `pinia` | Sesi hari berjalan, status pagi/malam, setting warung |
| Data fetching | `@tanstack/vue-query` | Cache + optimistic update saat tap tombol |
| PWA | `vite-plugin-pwa` | Manifest + service worker, installable |
| Backend | Supabase (PostgreSQL + Auth + RLS) | Single-owner; generated columns native |

### D2. State Machine Harian (hasil Utas 3 & 4)

```
                input pagi       input malam (WAJIB, mengunci)
START ────────► pagi_pending ──► pagi_selesai ──► malam_selesai ★LOCKED★
                 │
                 └─ deklarasi libur ─► libur
```

- `malam_selesai` = **final & terkunci**: tidak ada edit/koreksi retroaktif apa pun.
- `libur` = deklarasi eksplisit (default tiap hari buka). Bisa "Buka Lagi" sebelum ada input.
- Dashboard membedakan `libur` vs tanggal tanpa baris (lupa input).

### D3. Skema Database (modifikasi skema PRD §5.2)

Semua perubahan berikut konsisten dengan keputusan eksplorasi:

```sql
-- rekonsiliasi_harian: tambah kolom
status                  TEXT CHECK (status IN ('pagi_pending','pagi_selesai','malam_selesai','libur'))
modal_kembalian_pakai   NUMERIC(12,2) NOT NULL DEFAULT 0,   -- snapshot float saat simpan malam
total_uang_digital      NUMERIC(12,2) NOT NULL DEFAULT 0,   -- pembayaran non-tunai (QRIS/GoPay)

-- selisih_kas BARU (bebas bias float & digital):
--   selisih_kas = (total_uang_laci - modal_kembalian_pakai) + total_uang_digital
--               - total_pendapatan_estimasi

-- detail_stok_harian: tambah kolom + ubah validasi
porsi_konsumsi          INTEGER NOT NULL DEFAULT 0,         -- dimakan sendiri/keluarga/karyawan
CONSTRAINT chk_stok_non_negative CHECK (
    porsi_sisa_layak_jual + porsi_rusak_malam + porsi_konsumsi
    <= (porsi_carry_over - porsi_basi_pagi) + porsi_baru_dimasak
)
```

Tabel baru `pengaturan_warung` (satu baris):

```sql
modal_kembalian_default NUMERIC(12,2) NOT NULL DEFAULT 0,   -- utas 2 (Opsi A)
toleransi_selisih_persen NUMERIC(5,2) NOT NULL DEFAULT 5,    -- ambang kuning/merah
terima_pembayaran_digital BOOLEAN NOT NULL DEFAULT FALSE,    -- gerbang UI input digital
```

- `porsi_konsumsi` dipisah dari pendapatan: pendapatan = `porsi_dikonsumsi × harga_jual` dengan `porsi_dikonsumsi = stok_aktif_awal − sisa − rusak − konsumsi`; HPP tetap membebani semua porsi dikonsumsi (termasuk konsumsi).
- Agregat harian (`total_pendapatan_estimasi`, `total_hpp_nyata`, `total_kerugian`) tetap dihitung via **trigger `AFTER INSERT/UPDATE`** pada `detail_stok_harian` (generated column tidak bisa subquery lintas-tabel) atau **VIEW** untuk kebutuhan dashboard; agregat ditulis permanen saat malam dikunci.
- Harga jual per porsi **tidak** di-snapshot per baris; agregat tersimpan mengunci angka historis. Detail drill-down hari lampau menampilkan harga saat ini (keterbatasan yang disadari).

### D4. Engine Kalkulasi (prinsip dari PRD §3, dengan modifikasi)

```
stok_aktif_awal   = (porsi_carry_over − porsi_basi_pagi) + porsi_baru_dimasak
hpp_gabungan      = ( (carry−basi_pagi) × hpp_carry_over + baru × hpp_baru ) / stok_aktif_awal
porsi_dikonsumsi  = stok_aktif_awal − sisa_layak − rusak_malam − porsi_konsumsi   ← BARU
pendapatan        = porsi_dikonsumsi × harga_jual_porsi
hpp_nyata         = porsi_dikonsumsi × hpp_gabungan
kerugian          = basi_pagi × hpp_carry_over + rusak_malam × hpp_gabungan
profit            = pendapatan − hpp_nyata − kerugian
selisih_kas       = (uang_laci − modal_kembalian_pakai) + uang_digital − pendapatan  ← BARU
```

Nilai operasional yang perlu dicek konsistensinya: `porsi_dikonsumsi ≥ 0` (dijamin check constraint) dan `hpp_baru = modal_baru_total / porsi_baru_dimasak` (division by zero → fallback `hpp_estimasi_porsi` dari master lauk, ditandai "estimasi").

### D5. UI/UX (sesuai PRD §6)

- Layout mobile-first: grid kartu per lauk, stepper besar `−`/angka/`+`, tombol aksi minimal 48px, dalam thumb zone.
- Layar Malam menampilkan per lauk tiga kolom stepper: **Sisa Layak Jual**, **Rusak/Basi**, **Dimakan Sendiri** (kolom ketiga hanya muncul saat toggle "Hari ini makan sendiri?" = Ya).
- Layar Malam menampilkan **peringatan inline** jika ada lauk dengan modal belum diinput ("HPP akan pakai estimasi Rp 6.500 — isi sekarang?") sebelum tombol "Simpan & Kunci".
- Ringkasan naratif pasca-simpan: Pendapatan Estimasi → (digital nyata / tunai diharapkan) → uang laci net → selisih kas + indikator warna.
- Indikator warna: hijau/kuning/merah berdasar toleransi (`pengaturan_warung.toleransi_selisih_persen`).
- Layar hari libur tampil tenang; tanggal tanpa baris & bukan libur = peringatan "lupa input".

## Risks / Trade-offs

| Risiko | Mitigasi |
|---|---|
| HPP weighted average mengaburkan nilai batch asal (rusak malam dikenai HPP gabungan, padahal stok tertua paling mungkin basi) | Diterima untuk MVP; alternatif FIFO = over-engineering |
| Modal lupa diisi saat malam → hari terkunci permanen dengan HPP estimasi (akurasi profit tersakiti) | Peringatan inline + isi modal di layar malam; akurasi estimasi cukup untuk MVP |
| Membaca "pendapatan digital hari ini" repot bila pemilik punya >1 saluran (QRIS bank, GoPay, transfer) | Satu angka agregat, default 0; **spike/pilot** sebelum dikunci; dokumentasi asumsi |
| Asumsi "laci & saldo digital tidak diutak-atik di tengah hari" dilanggar (beli sayur, ambil untung) → selisih meledak tanpa sebab | Dokumentasi eksplisit; toleransi dapat dinaikkan; kandidat untuk fitur pengeluaran di versi berikutnya |
| Agregat via trigger/VIEW menambah kompleksitas Supabase migration | Gunakan VIEW untuk display + trigger untuk persist saat lock; hanya satu sumber logika |
| Harga jual diedit setelah hari terkunci → drill-down historis menampilkan harga terbaru | Agregat terkunci tetap akurat; ketidakakuratan hanya pada detail drill-down (minor) |

## Migration Plan

- Supabase: jalankan migrasi SQL (buat tabel, generated columns, trigger/VIEW, kebijakan RLS).
- Frontend: membangun dari template Vite; tambah dependensi (D1).
- Rollback: data terkunci di database; menghapus aplikasi frontend tidak menghapus data. Migrasi tabel dilakukan sekali (belum ada data produksi).

## Open Questions

1. **Backend**: konfirmasi Supabase final, atau preferensi backend lain (mis. backend lokal untuk pembelajaran)? — keputusan ini hanya mengubah lapisan data, tidak mengubah logika produk.
2. **Pilot saluran digital**: apakah pemilik contoh (Bu Sri) bisa membaca "pendapatan hari ini" dari app merchant dalam ≤ 1 menit? Mempengaruhi apakah fitur digital tetap satu angka atau perlu rincian.
3. **Nilai default toleransi**: mulai dari 5% pendapatan? Perlu divalidasi dengan data nyata.
