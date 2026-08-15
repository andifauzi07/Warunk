# Proposal: Fix Simpan Pagi Error 403

## Why

Simpan Input Pagi selalu gagal: menekan "Selesai Input Pagi" memunculkan "Terjadi kesalahan" karena request `upsert` ke `detail_stok_harian` ditolak PostgREST dengan HTTP 403 / `code 42501` ("new row violates row-level security policy"). Penyebabnya payload `simpanPagi` tidak menyertakan `user_id`, sehingga kandidat baris INSERT dievaluasi RLS `with check (user_id = auth.uid())` dengan nilai NULL dan ditolak — bahkan untuk baris yang sudah ada. Pesan error asli juga disembunyikan karena `pesanError()` hanya menangkap `instanceof Error`, sedangkan error PostgREST berupa plain object.

## What Changes

- `simpanPagi` di `src/lib/services/rekonsiliasi.ts` menyertakan `user_id` (dari `currentUserId()`) pada payload upsert `detail_stok_harian`, mengikuti pola `seedDetailHariIni`/`createLauk`.
- `simpanMalam` di file yang sama turut menyertakan `user_id` pada upsert-nya (bug laten identik yang akan menyala begitu layar malam dipakai).
- `pesanError()` di `src/lib/format.ts` menampilkan `message`/`details` untuk error PostgREST (plain object) alih-alih pesan generik "Terjadi kesalahan".

## Capabilities

### New Capabilities

Tidak ada.

### Modified Capabilities

- `input-pagi`: Requirement "Simpan Input Pagi" — simpan harus berhasil dengan konteks user yang benar dan menampilkan pesan error yang sesungguhnya bila gagal.
- `input-malam`: Requirement "Simpan dan Kunci Hari" — simpan malam harus memiliki konteks user yang benar pada upsert (bug laten yang sama).

## Impact

- `src/lib/services/rekonsiliasi.ts` — payload upsert `simpanPagi` (baris ~139-153) dan `simpanMalam` (baris ~162-184).
- `src/lib/format.ts` — fungsi `pesanError`.
- Spec delta: `specs/input-pagi/spec.md`, `specs/input-malam/spec.md`.
- Tidak ada perubahan skema database (RLS tetap membutuhkan `user_id` eksplisit).
- Pengguna tidak perlu melakukan migrasi data.
