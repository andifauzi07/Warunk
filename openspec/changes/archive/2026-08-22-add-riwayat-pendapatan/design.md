## Context

Dashboard saat ini (`src/views/DashboardView.vue`) menampilkan pemasukan harian hanya lewat grafik batang "Tren keuntungan" (query `tren` dari `rekonsiliasi_harian`, kolom terbatas: `tanggal, status, keuntungan_bersih`). Data lengkap per hari (`total_pendapatan_estimasi`, `total_porsi_dikonsumsi`, `keuntungan_bersih`, `tanggal`) sebenarnya sudah tersedia di VIEW `ringkasan_harian` (`supabase/migrations/20260815000004_agregat_trigger_view.sql:50`) — VIEW tersebut join `rekonsiliasi_harian` + agregat `detail_stok_harian`, dengan `total_porsi_dikonsumsi` di-compute via `coalesce(sum(d.porsi_dikonsumsi), 0)`.

Kartu dashboard menggunakan konvensi `rounded-2xl bg-white p-5 shadow-sm`, `formatRupiah`, dan `tabular-nums`. Toggle rentang 7/30 hari dikelola oleh `useAnalitik` via `ref rentang` dan `dari` (computed).

## Goals / Non-Goals

**Goals:**
- Menambahkan panel list "Riwayat pendapatan" yang ramah mobile & eye-catchy, konsisten gaya dengan kartu lain.
- Menyediakan data 4 field per hari dari sumber yang sudah ada (VIEW `ringkasan_harian`) tanpa migrasi skema.
- Mengikuti konvensi loading/error per-panel dan toggle rentang non-blokir yang sudah ada.

**Non-Goals:**
- Tidak mengubah skema DB / migrasi.
- Tidak menambah interaksi tap-to-expand atau breakdown detail per hari (cukup 4 field).
- Tidak menampilkan hari `libur` / lupa input.
- Tidak mengubah panel Tren atau Ranking yang ada.

## Decisions

### D1. Ambil data dari VIEW `ringkasan_harian`, bukan `rekonsiliasi_harian`
- **Pilihan**: fungsi service baru `fetchRiwayatPendapatan(dari, sampai)` melakukan `from('ringkasan_harian').select('tanggal, status, total_pendapatan_estimasi, total_porsi_dikonsumsi, keuntungan_bersih').eq('status','malam_selesai').order('tanggal', { ascending: false })`.
- **Alasan**: VIEW sudah punya keempat kolom yang dibutuhu; `rekonsiliasi_harian` (sumber `tren`) tidak memilih `total_pendapatan_estimasi`/`total_porsi_dikonsumsi`. Menggunakan VIEW menghindari query agregat manual di klien.
- **Alternatif dipertimbangkan**: memperluas `fetchRekonsiliasiRange` untuk ikut memilih kolom tambahan — ditolak karena mencampur kepentingan chart (yang butuh semua hari termasuk libur/lupa) dengan list (hanya `malam_selesai`); lebih bersih pakai query terpisah.

### D2. Query baru di-composables `useAnalitik`
- Tambah `useQuery` `riwayat` dengan `queryKey: ['riwayat-pendapatan', rentang, tanggal]` dan `placeholderData: keepPreviousData` (sama pola dengan `tren`/`ranking`) agar saat ganti rentang, data lama tetap tampil (memenuhi requirement Transisi Rentang Non-Blokir).

### D3. Komponen baru `RiwayatPendapatanCard.vue`
- Menerima prop `rows: RiwayatRow[]` (array sudah diurutkan desc). Merender:
  - Header "Riwayat pendapatan" + label rentang (7/30 hari) untuk konsistensi konteks.
  - Wrapper list `max-h-[420px] overflow-y-auto` (scroll internal).
  - Tiap baris: aksen vertikal kiri berwarna profit (`bg-green-600` laba / `bg-red-500` rugi), kanan-atas pendapatan (besar), kanan-bawah keuntungan (warna profit), bawah porsi dengan emoji 🍚 + `formatAngka`.
- Skeleton/loading & error state mengikuti pola panel lain (`animate-pulse`, `pesanError`).

### D4. Helper format tanggal+hari pendek
- Tambah helper kecil di `src/lib/format.ts` (mis. `tanggalPendek(t)` → `{ hari: 'Sabtu', tgl: '22 Agt' }` dan `tanggalPendekAngka(t)` → `'22/08'`) agar baris compact di mobile. Bisa derivasi dari `new Date(t+'T00:00:00')` + `toLocaleDateString('id-ID', ...)` seperti `tanggalBaca` yang ada.

### D5. Penempatan
- Di `DashboardView.vue`, inject `<RiwayatPendapatanCard>` persis di antara penutup div panel "Tren keuntungan" (setelah legenda, ~baris 312) dan pembuka `<div class="mt-4 grid ...">` Ranking (baris 315), dibungkus satu section `rounded-2xl bg-white p-5 shadow-sm`.

## Risks / Trade-offs

- [Scroll internal nested di mobile] → Mitigasi: `max-h-[420px]` + `overflow-y-auto` dengan `-webkit-overflow-scrolling: touch`; tinggi kartu tetap sehingga tidak layout shift.
- [VIEW `ringkasan_harian` mungkin lambat untuk 30 hari] → Mitigasi: sudah di-agregasi di DB (bukan di klien); volumenya hanya 30 baris, risiko rendah.
- [Duplikasi query dengan `tren`/`ranking`] → Mitigasi: query terpisah sengaja (filter & kolom beda); tidak ada penggabungan yang menguntungkan.
- [Kolom `total_porsi_dikonsumsi` di VIEW menggunakan `left join` + `coalesce`] → Mitigasi: sudah aman untuk hari tanpa detail (hasil 0), tapi kita sudah filter `malam_selesai` sehingga hari tersebut pasti punya detail.

## Migration Plan

Tidak ada migrasi DB. Deploy = penambahan kode front-end. Rollback = hapus komponen & panggilan (revert commit).

## Open Questions

- Batasan `max-h-[420px]` bersifat perkiraan; bisa disesuaikan saat implementasi/QA mobile.
- Apakah label rentang di header kartu perlu meniru toggle interaktif atau cukup teks statis "7/30 hari"? (Keputusan: teks statis mengikuti `rentang` agar sederhana.)
