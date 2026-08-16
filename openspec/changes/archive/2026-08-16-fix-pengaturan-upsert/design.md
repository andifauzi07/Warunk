## Context

`pengaturan_warung` adalah tabel single-row per pengguna (migrasi `20260815000003_pengaturan_warung.sql`): kolom `id` PK dengan `default gen_random_uuid()`, dan `user_id uuid not null unique` (constraint `pengaturan_warung_user_id_key`).

Halaman `/pengaturan` (`PengaturanView.vue`) menyimpan lewat `simpanSemua()` → `usePengaturan().simpan` → `upsertPengaturan(input)` di `src/lib/services/pengaturan.ts`. Payload hanya berisi `user_id` + nilai form — **tanpa `id`** dan tanpa `onConflict`.

Perilaku PostgREST `.upsert(payload)` tanpa argumen kedua memakai **primary key (`id`)** sebagai target konflik. Karena `id` tidak pernah dikirim, setiap pemanggilan pada dasarnya adalah `INSERT` dengan `id` acak baru. Simpan pertama (baris belum ada) sukses; simpan berikutnya gagal karena bentrok dengan unique `user_id`.

Masalah laten kedua: `PengaturanView.vue:43` memakai `form.modal_kembalian_default ?? 0`. Input `type="number"` yang dibersihkan memberi `''` (string) lewat `v-model.number`, bukan `null`, sehingga `?? 0` tidak menangkapnya dan `''` terkirim ke kolom `numeric` → error `invalid input syntax for type numeric`.

## Goals / Non-Goals

**Goals:**
- Menyimpan pengaturan selalu sukses, baik saat baris belum ada (insert) maupun sudah ada (update).
- Memastikan tetap ada tepat satu baris pengaturan per pengguna.
- Menutup error laten input kosong pada field numerik.

**Non-Goals:**
- Tidak mengubah skema database (tidak ada migrasi SQL).
- Tidak mengubah cara fetch/load pengaturan (`fetchPengaturan` tetap seperti sekarang).
- Tidak menangani migrasi data pengguna yang terlanjur punya baris duplikat (belum ada bukti duplikat terbentuk; unique constraint mencegahnya).

## Decisions

### D1: Gunakan `onConflict: 'user_id'` pada upsert

`upsertPengaturan` diubah menjadi:

```ts
.from('pengaturan_warung')
.upsert(input, { onConflict: 'user_id' })
.select()
.single()
```

- Baris belum ada → tidak ada konflik → INSERT.
- Baris sudah ada → konflik pada `user_id` → kolom dalam payload diperbarui; kolom di luar payload (mis. `created_at`, `id`) tidak tersentuh.
- Karena `user_id` ada di payload, tidak perlu mengambil `id` dari hasil fetch dan membawanya melalui form.

**Alternatif yang dipertimbangkan:**
- *Kirim `id` baris dari hasil fetch*: eksplisit, tapi menambah state (harus simpan `id` di form) dan gagal bila fetch berjalan lambat/belum selesai. Ditolak demi kesederhanaan.
- *Pisah insert vs update via deteksi `data === null` di view*: logika cabang di UI, rawan salah deteksi. Ditolak.

### D2: Normalisasi input kosong numerik di `simpanSemua`

Ubah payload ke bentuk yang normal (mis. helper `keAngka()` atau konversi eksplisit) sehingga `''` / `null` / `undefined` menjadi `0` untuk `modal_kembalian_default` dan `toleransi_selisih_persen`. Validasi toleransi 0–100 tetap dijalankan setelah normalisasi.

**Alternatif:** `@input` handler per field. Berat dan berulang; sentralisasi di satu titik submit lebih mudah diuji.

### D3: Verifikasi hanya satu baris per pengguna tetap berlaku

Tidak ada perubahan schema; constraint `user_id unique` (sudah ada) tetap penjaga terakhir. Migrasi tidak diperlukan. Jika di masa depan ada data duplikat dari versi lama, ditangani terpisah.

## Risks / Trade-offs

- [Upsert dengan `onConflict` memperbarui HANYA kolom payload] → Payload `simpanSemua` selalu memuat ketiga kolom pengaturan (`modal_kembalian_default`, `toleransi_selisih_persen`, `terima_pembayaran_digital`) + `user_id`, jadi tidak ada nilai lama yang tertinggal. Dipastikan lewat spec scenario.
- [RLS `with check (user_id = auth.uid())` menolak baris dengan `user_id` lain] → Payload selalu berisi `session.user.id`; perilaku sama dengan sekarang.
- [Normalisasi `'' → 0` mengubah makna input kosong] → Nilai 0 adalah default tabel (`numeric(12,2) not null default 0`) dan default form; konsisten dengan perilaku saat ini untuk field yang sengaja di-0-kan.

## Migration Plan

- Perubahan terbatas pada 2 file sumber frontend; tidak ada langkah database.
- Rollback: kembalikan 2 baris yang diubah; tanpa dampak data.
- Verifikasi manual: buka `/pengaturan`, simpan dua kali berturut-turut, ubah modal → 0 lalu simpan, toggle digital lalu simpan — semua harus berhasil tanpa error.
