# Design: Fix Simpan Pagi Error 403

## Context

`simpanPagi` (`src/lib/services/rekonsiliasi.ts`) menyimpan input pagi lewat `upsert` ke `detail_stok_harian`. Payload upsert TIDAK menyertakan `user_id`, padahal kolom `user_id` tidak punya default (`20260815000002_detail_stok_harian.sql:6`) dan tabel memakai RLS `with check (user_id = auth.uid())` (`20260815000005_rls.sql:16`).

Postgres mengevaluasi `WITH CHECK` dari kebijakan INSERT pada kandidat baris SEBELUM resolusi `ON CONFLICT (id) DO UPDATE`. Karena `user_id` kandidat adalah `NULL`, hasil evaluasi `NULL = auth.uid()` adalah `FALSE` → error `42501` → PostgREST membalas HTTP 403, walau baris yang dituju sudah ada. Di sisi UI, `pesanError()` (`src/lib/format.ts`) hanya menangkap `instanceof Error`; error PostgREST berupa plain object `{ code, message, details, hint }` sehingga pesan yang tampil hanya generik "Terjadi kesalahan".

## Goals / Non-Goals

**Goals:**
- Menyimpan input pagi (dan malam) berhasil untuk baris baru maupun baris yang sudah ada.
- Pesan error mencerminkan penyebab sesungguhnya bila penulisan tetap gagal.
- Tidak mengubah skema database atau kebijakan RLS.

**Non-Goals:**
- Tidak mengubah logika bisnis engine (`hitungAgregat`, HPP, dsb).
- Tidak merombak arsitektur auth/session.
- Tidak membersihkan data duplikat/orphan yang mungkin sudah ada (diluar lingkup; tidak diwajibkan untuk fix ini).

## Decisions

### 1. Kirim seluruh state baris pada payload upsert (pagi & malam)

`upsert` di Postgres memvalidasi kandidat tuple INSERT terhadap SEMUA constraint (RLS `WITH CHECK`, NOT NULL, CHECK, FK) SEBELUM resolusi `ON CONFLICT (id) DO UPDATE`. Konsekuensinya, payload yang parsial selalu disempurnakan dengan nilai DEFAULT (atau NULL untuk kolom tanpa default) saat validasi kandidat — sehingga error muncul berurutan walau baris target sudah ada.

Error yang diamati beruntun mengonfirmasi pola ini:

1. HTTP 403 (`42501`) — `user_id` NULL gagal RLS `with check (user_id = auth.uid())`.
2. `23502` — `rekonsiliasi_id` NULL (kolom `not null` tanpa default).
3. `23502` — `lauk_id` NULL (kolom `not null` tanpa default).
4. `23514` — `chk_stok_non_negative` gagal karena `porsi_carry_over`, `porsi_basi_pagi`, `porsi_baru_dimasak` memakai default `0` pada kandidat, sehingga `sisa+rusak+konsumsi <= 0` salah; berpotensi juga `chk_basi_pagi` pada simpan pagi bila `porsi_basi_pagi > 0`.

Keputusan: `simpanPagi` dan `simpanMalam` mengirim SELURUH kolom state baris (nilai-nilai yang sudah ada di `detail_stok_harian` ditambah kolom yang diinput), sehingga kandidat INSERT selalu baris yang valid:

- `simpanPagi`: `id`, `lauk_id`, `user_id`, `rekonsiliasi_id`, `porsi_carry_over`, `hpp_carry_over_porsi`, `porsi_basi_pagi`, `porsi_baru_dimasak`, `modal_baru_total`, `hpp_baru_porsi` (kolom malam memakai default `0`).
- `simpanMalam`: seluruh kolom pagi yang sudah tersimpan + `porsi_sisa_layak_jual`, `porsi_rusak_malam`, `porsi_konsumsi`.

`user_id` diambil via `currentUserId()` (throw `"Belum login"` bila null); `rekonsiliasi_id` dan `lauk_id` dibawa dari state view. Nilai pagi pada payload malam dibaca dari baris detail yang dimuat di awal — sumber kebenaran yang sama, tidak ada risiko drift.

- **Mengapa ini**: Dengan kandidat yang selalu valid, `WITH CHECK` RLS, NOT NULL, dan CHECK semua lolos; `ON CONFLICT` bekerja untuk baris yang ada (nilai pagi yang ditulis ulang identik dengan yang tersimpan), dan INSERT tetap valid untuk baris baru. Konsisten dengan seluruh penulisan lain di codebase.
- **Alternatif yang dipertimbangkan**: (a) Menambah `default auth.uid()` — ditolak, mengubah skema dan tidak menyelesaikan CHECK/NOT NULL lain. (b) Mengganti malam dengan `update()` per baris — ditolak, berisiko melewatkan baris yang tidak ada secara diam-diam dan membutuhkan banyak round-trip. (c) Memisahkan `INSERT` untuk baris baru vs `UPDATE` untuk baris lama — ditolak, menambah kompleksitas tanpa keuntungan karena payload lengkap sudah menyelesaikan keduanya sekaligus.

### 2. Perbaiki `pesanError` untuk error PostgREST

Mengubah `pesanError` agar mengekstrak `message` (dan bila ada `details`) dari objek yang memilikinya — tidak terbatas pada `instanceof Error` — dengan fallback tetap `"Terjadi kesalahan"`.

- **Mengapa ini**: Plain object PostgREST (dan respon error lain yang bertipe non-`Error`) adalah penyebab pesan generik. Menampilkan `message`/`details` membuat kegagalan ke depan bisa didiagnosis langsung dari UI.
- **Alternatif yang dipertimbangkan**: `throw new Error(...)` di service. Tetap bisa dipakai, tapi memperbaiki `pesanError` menutup seluruh titik pemakaian (pagi, malam, home) sekaligus tanpa mengubah kontrak throw di service.

### 3. Umpan balik sukses + mode ringkasan pada Input Pagi & Malam

Setelah simpan berhasil, kedua layar beralih ke mode ringkasan read-only yang menampilkan konfirmasi dan informasi penting dalam bentuk card:

- **Input Pagi**: banner hijau "Input pagi tersimpan", card ringkasan per lauk (sisa kemarin, basi, masak baru, modal, stok aktif), dan tombol "Ubah Input Pagi" untuk kembali ke mode input selama hari belum terkunci. Ditampilkan juga saat kunjungan berikutnya selama status `pagi_selesai`, serta saat terkunci tanpa tombol ubah.
- **Input Malam**: banner hijau "Input malam tersimpan", card Ringkasan Hari Ini (pendapatan, HPP, kerugian, profit, uang laci, selisih kas) yang diambil dari nilai persisten `rekonsiliasi_harian` (akurat walau halaman dimuat ulang), dan card ringkasan per lauk (stok awal, terjual, sisa layak besok, rusak/basi, dimakan sendiri, modal). Tidak ada tombol ubah karena hari terkunci permanen; seluruh kontrol edit disembunyikan.

- **Mengapa ini**: Memberi konfirmasi visual bahwa data tersimpan tanpa navigasi paksa; ringkasan dari nilai tersimpan (bukan state form) membuat mode ringkasan malam tetap benar setelah reload.
- **Alternatif yang dipertimbangkan**: Navigasi otomatis ke Home / layar lain. Ditolak — navigasi paksa dianggap mengganggu; ringkasan read-only memberi kendali ke pengguna.

## Risks / Trade-offs

- [Baris duplikat/orphan yang sudah terlanjur ada di DB] → Bukan bagian dari perbaikan ini; tidak menghalangi simpan berjalan setelah `user_id` disertakan. Pembersihan data dapat dijadikan pekerjaan lanjutan bila ditemukan.
- [`currentUserId()` bisa mengembalikan null] → Service sudah melempar `"Belum login"` dengan jelas (pola yang sama dipakai `seedDetailHariIni`); setelah fix `pesanError`, pesan ini ikut tampil apa adanya.
- [Umpan balik pagi menambah state lokal `editMode`] → Ringan dan lokal di view; tidak mengubah kontrak service atau store.

## Migration Plan

- Tidak ada migrasi database.
- Deploy hanya mengganti file frontend (`rekonsiliasi.ts`, `format.ts`, `InputPagiView.vue`); rollback = revert commit.
- Verifikasi manual: simpan pagi berhasil (status `pagi_selesai`, banner sukses + card ringkasan), lalu simpan malam berhasil (status `malam_selesai`).

## Open Questions

- Tidak ada.
