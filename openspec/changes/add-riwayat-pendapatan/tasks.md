## 1. Data Layer

- [x] 1.1 Tambah interface `RiwayatPendapatanRow` di `src/lib/services/analitik.ts` (`tanggal`, `status`, `total_pendapatan_estimasi`, `total_porsi_dikonsumsi`, `keuntungan_bersih`)
- [x] 1.2 Tambah fungsi `fetchRiwayatPendapatan(dari, sampai)` yang `select` dari VIEW `ringkuman_harian` dengan filter `.eq('status','malam_selesai')` dan `.order('tanggal', { ascending: false })`
- [x] 1.3 Ekspos query `riwayat` dari `useAnalitik` (`useQuery`, `queryKey: ['riwayat-pendapatan', rentang, tanggal]`, `placeholderData: keepPreviousData`) dan kembalikan lewat return object

## 2. Formatting Helper

- [x] 2.1 Tambah helper `tanggalPendek(t)` dan `tanggalPendekAngka(t)` di `src/lib/format.ts` untuk render "Sabtu, 22 Agt" + "22/08" (derivasi `Date` + `toLocaleDateString('id-ID')`)

## 3. Komponen Baru

- [x] 3.1 Buat `src/components/RiwayatPendapatanCard.vue` dengan prop `rows: RiwayatPendapatanRow[]` dan header "Riwayat pendapatan" + label rentang
- [x] 3.2 Render list dengan wrapper `max-h-[420px] overflow-y-auto` (scroll internal) dan baris: aksen vertikal warna profit, pendapatan (besar), keuntungan bersih (warna profit), porsi (🍚 + `formatAngka`)
- [x] 3.3 Tambah state loading (`animate-pulse` skeleton) dan error (`pesanError`) mengikuti pola panel dashboard lainnya

## 4. Integrasi Dashboard

- [x] 4.1 Di `DashboardView.vue`, ambil `riwayat` dari `useAnalitik` dan binding `data`/`isLoading`/`error` ke komponen
- [x] 4.2 Inject `<RiwayatPendapatanCard>` di antara panel "Tren keuntungan" dan grid "Lauk terlaris" (section `rounded-2xl bg-white p-5 shadow-sm`)

## 5. Verifikasi

- [x] 5.1 Jalankan lint/typecheck (`bun run lint` / `vue-tsc`) dan pastikan tidak ada error
- [x] 5.2 Cek visual di viewport mobile: urutan baru→lama, skip libur/lupa, scroll internal, konsistensi gaya kartu
