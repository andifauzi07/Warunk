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

## 6. Pengujian (unit + component)

- [x] 6.1 Unit: tambah test `tanggalPendek` & `tanggalPendekAngka` di `src/__tests__/format.test.ts` — hari+tgl id-ID (`{ hari, tgl }`), angka `dd/mm`, boundary tahun/bulan, timezone lokal (`T00:00:00`)
- [x] 6.2 Unit: buat `src/__tests__/analitik.test.ts` dengan in-memory supabase mock (niru pola `rekonsiliasi.test.ts`) — seed `ringkasan_harian` campur status (`malam_selesai`, `libur`, `pagi_selesai`); assert hasil hanya `malam_selesai`, urutan tanggal menurun, dan kolom ter-mapping (`total_pendapatan_estimasi`, `total_porsi_dikonsumsi`, `keuntungan_bersih`)
- [x] 6.3 Component: buat `src/__tests__/component/RiwayatPendapatanCard.test.ts` (niru `RingkasanHarianCard.test.ts`, mount + props) — header "Riwayat pendapatan" + label rentang, 4 field per row (hari+tgl, pendapatan Rupiah, keuntungan Rupiah, `🍚 N porsi`), warna profit (akses `bg-green-600`/`bg-red-500` & teks `text-green-700`/`text-red-600`), state loading (`animate-pulse` skeleton), state error (`pesanError`), state kosong ("Belum ada data.")
- [x] 6.4 Component: update `src/__tests__/component/DashboardView.test.ts` — tambah `fetchRiwayatPendapatan: vi.fn()` ke mock factory `@/lib/services/analitik` (WAJIB: mock lama hanya 3 fungsi → 6 test existing break), mock-return sample rows di `mountView()`, dan `it()` baru yang memastikan card muncul + menampilkan baris (pendapatan & porsi)
- [x] 6.5 Jalankan `bun run test` (project unit + component) dan pastikan lolos; pastikan 6 test `DashboardView` yang ada tidak regresi
