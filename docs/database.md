# Database Reference — Warunk

Referensi skema PostgreSQL 17 / Supabase, **grounded ke `supabase/migrations/`**. Nama objek persis seperti di migrasi; jangan tebak.

## 1. Tabel

### `master_lauk` — master lauk (migrasi `20260815000000`)

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | uuid PK | |
| `user_id` | uuid FK `auth.users` ON DELETE CASCADE | owner (RLS) |
| `nama_lauk` | text | |
| `harga_jual_porsi` | numeric(12,2) | default 0 |
| `hpp_estimasi_porsi` | numeric(12,2) | fallback HPP |
| `is_active` | boolean | default true |
| `created_at` | timestamptz | |

Index: `idx_master_lauk_user(user_id)`.

### `rekonsiliasi_harian` — 1 baris = 1 hari (migrasi `20260815000001`)

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | uuid PK | |
| `user_id` | uuid FK `auth.users` ON DELETE CASCADE | owner |
| `tanggal` | date | |
| `status` | text | `pagi_pending` / `pagi_selesai` / `malam_selesai` / `libur` (check) |
| `total_uang_laci` | numeric(12,2) | nullable |
| `total_uang_digital` | numeric(12,2) | default 0 |
| `modal_kembalian_pakai` | numeric(12,2) | snapshot float saat simpan malam |
| `total_pendapatan_estimasi` | numeric(12,2) | diisi trigger |
| `total_hpp_nyata` | numeric(12,2) | diisi trigger |
| `total_kerugian` | numeric(12,2) | diisi trigger |
| `keuntungan_bersih` | numeric(12,2) **generated** | lihat §2 |
| `selisih_kas` | numeric(12,2) **generated** | lihat §2 |
| `created_at` | timestamptz | |

Constraint: `UNIQUE(user_id, tanggal)`. Index: `idx_rekonsiliasi_user_tanggal(user_id, tanggal)`.

### `detail_stok_harian` — 1 baris = 1 lauk/hari (migrasi `20260815000002`)

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | uuid PK | |
| `user_id` | uuid FK `auth.users` | owner (RLS) |
| `rekonsiliasi_id` | uuid FK `rekonsiliasi_harian` ON DELETE CASCADE | |
| `lauk_id` | uuid FK `master_lauk` ON DELETE RESTRICT | |
| `carry_over_dari_id` | uuid FK `detail_stok_harian` | audit trail batch asal |
| `porsi_carry_over` | integer | sisa layak dari kemarin |
| `hpp_carry_over_porsi` | numeric(12,2) | HPP asal (kemarin) |
| `porsi_basi_pagi` | integer | carry-over basi pagi ini |
| `porsi_baru_dimasak` | integer | |
| `modal_baru_total` | numeric(12,2) | total modal bahan hari ini |
| `hpp_baru_porsi` | numeric(12,2) | = modal / porsi baru |
| `porsi_sisa_layak_jual` | integer | carry-over untuk besok |
| `porsi_rusak_malam` | integer | |
| `porsi_konsumsi` | integer | dimakan sendiri (pemilik) |
| `stok_aktif_awal` | integer **generated** | §2 |
| `hpp_gabungan_porsi` | numeric(12,2) **generated** | §2 |
| `porsi_dikonsumsi` | integer **generated** | §2 |
| `created_at` | timestamptz | |

> Catatan: kolom "dimakan sendiri" di UI = `porsi_konsumsi` di DB.
> Index: `idx_detail_rekonsiliasi`, `idx_detail_lauk`, `idx_detail_user`.

### `pengaturan_warung` — 1 baris / pengguna (migrasi `20260815000003`)

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | uuid PK | |
| `user_id` | uuid FK `auth.users` UNIQUE | owner |
| `modal_kembalian_default` | numeric(12,2) | float default |
| `toleransi_selisih_persen` | numeric(5,2) | default 5 |
| `terima_pembayaran_digital` | boolean | default false |
| `created_at` | timestamptz | |

## 2. Generated Columns

| Kolom | Rumus (Postgres) |
| --- | --- |
| `detail.stok_aktif_awal` | `(porsi_carry_over - porsi_basi_pagi) + porsi_baru_dimasak` |
| `detail.hpp_gabungan_porsi` | `CASE WHEN stok_aktif_awal = 0 THEN 0 ELSE ((carry_over-basi)*hpp_carry_over + baru*hpp_baru) / stok_aktif_awal END` (weighted average) |
| `detail.porsi_dikonsumsi` | `stok_aktif_awal - porsi_sisa_layak_jual - porsi_rusak_malam - porsi_konsumsi` |
| `rekonsiliasi.keuntungan_bersih` | `total_pendapatan_estimasi - total_hpp_nyata - total_kerugian` |
| `rekonsiliasi.selisih_kas` | `(total_uang_laci - modal_kembalian_pakai) + total_uang_digital - total_pendapatan_estimasi` |

## 3. Trigger & VIEW

`supabase/migrations/20260815000004_agregat_trigger_view.sql`:

- **`hitung_agregat_rekonsiliasi()`** (trigger `AFTER INSERT/UPDATE/DELETE` pada `detail_stok_harian`): menghitung ulang `total_pendapatan_estimasi`, `total_hpp_nyata`, `total_kerugian` di `rekonsiliasi_harian` **hanya jika `status <> 'malam_selesai'`** — prinsip snapshot terkunci.
- **VIEW `ringkasan_harian`** (`security_invoker = on`): join `rekonsiliasi_harian` + agregat `detail_stok_harian`, menambah `total_porsi_dikonsumsi` dan `jumlah_lauk`. Dipakai dashboard & analitik.

## 4. Row Level Security

`supabase/migrations/20260815000005_rls.sql` — model single-owner. Tiap tabel enable RLS + satu policy owner-scoped:

```sql
create policy "<tabel>_owner_all" on public.<tabel>
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

Berlaku untuk: `master_lauk`, `rekonsiliasi_harian`, `detail_stok_harian`, `pengaturan_warung`.

## 5. Check Constraints

| Constraint | Aturan |
| --- | --- |
| `chk_stok_non_negative` | `porsi_sisa_layak_jual + porsi_rusak_malam + porsi_konsumsi <= stok_aktif_awal` |
| `chk_basi_pagi` | `porsi_basi_pagi <= porsi_carry_over` |
| `chk_porsi_non_negative` | semua porsi >= 0 |
