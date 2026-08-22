## Why

Di `/dashboard`, pemasukan harian hanya bisa dibaca lewat grafik batang "Tren keuntungan" — pengguna kesulitan membaca angka pasti per hari (total pendapatan, porsi, keuntungan bersih) dan membandingkan hari secara langsung. Butuh representasi list yang ramah mobile dan eye-catchy, selain chart.

## What Changes

- Menambahkan kartu "Riwayat pendapatan" berupa list harian di antara panel "Tren keuntungan" dan grid "Lauk terlaris" pada `/dashboard`.
- Tiap baris menampilkan tepat 4 field: total pendapatan, tanggal & hari, total porsi dikonsumsi, keuntungan bersih.
- List dibatasi `max-height` + scroll internal; hari dengan status `libur` / lupa input **di-skip** (hanya `malam_selesai`); urutan **baru → lama** (descending).
- Menambah query range baru ke VIEW `ringkasan_harian` yang sudah menyediakan keempat kolom tersebut (tanpa ubah skema DB).
- Gaya kartu & baris konsisten dengan kartu dashboard yang ada (`rounded-2xl bg-white p-5 shadow-sm`), dengan aksen warna profit (hijau laba / merah rugi).

## Capabilities

### New Capabilities

- (tidak ada — perubahan masuk ke capability yang sudah ada)

### Modified Capabilities

- `dashboard-analitik`: menambah requirement "Riwayat Pendapatan Harian" — panel list riwayat pemasukan harian di bawah chart Tren.

## Impact

- Baru: `src/lib/services/analitik.ts` (fungsi `fetchRiwayatPendapatan`), `src/composables/useAnalitik.ts` (query `riwayat`), `src/components/RiwayatPendapatanCard.vue` (komponen baru).
- Diubah: `src/views/DashboardView.vue` (inject kartu baru antara Tren & Ranking), `src/lib/format.ts` (helper format tanggal+hari pendek, bila perlu).
- Tidak ada perubahan migrasi/skema: data diambil dari VIEW `ringkaman_harian` yang sudah ada (`supabase/migrations/20260815000004_agregat_trigger_view.sql`).
- Mengikuti konvensi Transisi Rentang Non-Blokir: panel ini mengikuti toggle 7/30 hari dan menampilkan loading/error per-panel.
