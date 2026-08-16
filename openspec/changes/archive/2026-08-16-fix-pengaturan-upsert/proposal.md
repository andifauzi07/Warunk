## Why

Menyimpan pengaturan warung untuk kedua kalinya (atau setelahnya) selalu gagal dengan error `duplicate key value violates unique constraint "pengaturan_warung_user_id_key"`. Akar masalah: `upsert` dipanggil tanpa `id` baris dan tanpa `onConflict`, sehingga setiap simpan berperilaku sebagai INSERT baru — simpan pertama sukses, simpan berikutnya bentrok dengan unique constraint `user_id`. Ini memblokir semua perubahan pengaturan setelah penyimpanan awal, termasuk mengganti modal kembalian ke 0 dan mengaktifkan toggle pembayaran digital.

## What Changes

- Perbaiki `upsertPengaturan` di `src/lib/services/pengaturan.ts` agar benar-benar meng-*update* baris yang sudah ada (`onConflict: 'user_id'`), bukan selalu insert.
- Tangani input kosong pada field numerik form pengaturan agar nilai `''` tidak terkirim sebagai string ke kolom `numeric` (error `invalid input syntax for type numeric`).
- Tambahkan scenario spec yang menjamin penyimpanan berulang (update) pada satu baris per pengguna berhasil dan tidak menduplikasi baris.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `pengaturan-warung`: Menambahkan requirement bahwa menyimpan pengaturan harus selalu berhasil dengan mem-*update* baris tunggal milik pengguna — tidak boleh gagal atau membuat baris duplikat saat disimpan berulang kali.

## Impact

- `src/lib/services/pengaturan.ts` — service `upsertPengaturan` (payload `onConflict`).
- `src/views/PengaturanView.vue` — normalisasi input kosong numerik saat submit (opsional, koreksi laten).
- Tidak ada perubahan skema database; migrasi SQL tidak diperlukan.
- Spec: delta `openspec/changes/fix-pengaturan-upsert/specs/pengaturan-warung/spec.md`.
