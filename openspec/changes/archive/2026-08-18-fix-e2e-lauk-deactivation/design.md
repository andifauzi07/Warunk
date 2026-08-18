## Context

E2E test `lauk-deactivation.spec.ts` mengalami 2 kegagalan dengan akar masalah yang sama: `getCarryOverForLauk()` mengembalikan 0 padahal seed data menetapkan `porsi_carry_over: 5`.

### Analisis Akar Masalah

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ALUR E2E TEST YANG GAGAL                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. seedTestData() insert detail_stok_harian dengan                 │
│     porsi_carry_over: 5 untuk Ayam                                  │
│                                                                     │
│  2. Test klik "Aktif" → toggleAktif() dipanggil                    │
│                                                                     │
│  3. getCarryOverForLauk() return 0 (SEHARUSNYA 5)                  │
│                                                                     │
│  4. Dialog tampilkan "Yakin menonaktifkan lauk ini ?"              │
│     (SEHARUSNYA pesan carry-over warning)                          │
│                                                                     │
│  5. zeroCarryOverForLauk TIDAK dipanggil                           │
│                                                                     │
│  6. porsi_carry_over tetap 5                                        │
│                                                                     │
│  Test 1: Dialog text salah → FAIL                                   │
│  Test 2: Carry-over tidak zeroed → FAIL                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Bukti dari Error Context

**Test 1** (error-context.md):
```
Error: expect(locator).toBeVisible() failed
Locator: getByRole('dialog').getByText('Menonaktifkan lauk ini, akan membuat sisa porsi kemarin dianggap basi/rusak !')
Expected: visible
Error: element(s) not found
```
Page snapshot menunjukkan dialog "Yakin menonaktifkan lauk ini ?" — artinya `carryOver === 0`.

**Test 2** (error-context.md):
```
Error: expect(locator).toHaveCount(expected) failed
Locator: locator('div.rounded-xl.border').filter({ hasText: 'Ayam' }).first().getByText('Sisa kemarin')
Expected: 0
Received: 1
```
Page snapshot menunjukkan "Sisa kemarin: 5 porsi" — artinya carry-over tidak di-zero.

### Akar Masalah Sebenarnya (ditemukan saat implementasi)

1. **Insert `detail_stok_harian` hari ini gagal diam-diam**: Batch insert baris Telur tidak menyertakan `hpp_carry_over_porsi` (kolom `not null`). PostgREST mengirim `NULL` untuk key yang hilang pada salah satu baris batch → constraint `not null` dilanggar → seluruh insert gagal. Karena tidak ada error checking, seed lanjut dan `getCarryOverForLauk()` mengembalikan 0.
2. **`zeroCarryOverForLauk()` melanggar `chk_basi_pagi`**: update menyetel `porsi_basi_pagi = porsi_carry_over` sekaligus `porsi_carry_over = 0`, melanggar constraint `porsi_basi_pagi <= porsi_carry_over` (code 23514). Deaktivasi gagal diam-diam di browser.

### Masalah pada Seed Data

Seed function di `lauk-deactivation.spec.ts` memiliki beberapa masalah:

1. **Insert `detail_stok_harian` tanpa error checking** (line 78-97 dan 118-134)
2. **Delete `rekonsiliasi_harian` tanpa error checking** (line 38) — cascade ke `detail_stok_harian` mungkin gagal
3. **Delete `master_lauk` tanpa error checking** (line 39) — bisa gagal karena foreign key `ON DELETE RESTRICT` dari `detail_stok_harian`

## Goals / Non-Goals

**Goals:**
- Perbaiki seed data E2E test agar `getCarryOverForLauk()` mengembalikan nilai yang benar
- Pastikan Test 1 menampilkan dialog carry-over warning yang benar
- Pastikan Test 2 memanggil `zeroCarryOverForLauk` dan carry-over menjadi 0
- Pastikan pengujian hanya menggunakan Supabase lokal (tidak merusak production)
- Jaga agar perilaku deaktivasi lauk tetap teruji dengan benar

**Non-Goals:**
- Tidak mengubah implementasi `getCarryOverForLauk` atau `zeroCarryOverForLauk` (asumsi implementasi sudah benar) — **direvisi saat implementasi**: `zeroCarryOverForLauk` ditemukan melanggar constraint `chk_basi_pagi`; perbaikan minimal disetujui (hanya nol-kan `porsi_carry_over`, tanpa memindahkan ke `porsi_basi_pagi`)
- Tidak mengubah schema database
- Tidak menambah test case baru
- Tidak memodifikasi test lain yang sudah berjalan benar

## Decisions

### Decision 1: Tambahkan error checking pada semua operasi seed

**Pilihan:** Tambahkan pengecekan error pada setiap operasi Supabase di `seedTestData()`.

**Alternatif yang ditolak:**
- Hanya menambahkan `.select()` pada insert — tidak cukup untuk menangkap semua jenis error
- Mengabaikan error dan hanya menambahkan retry — terlalu kompleks untuk test

**Alasan:** Error checking memastikan test gagal dengan pesan yang jelas jika seed data tidak berhasil dimasukkan, bukan gagal di assertion dengan pesan yang membingungkan.

### Decision 2: Hapus `detail_stok_harian` secara eksplisit sebelum seed

**Pilihan:** Tambahkan delete `detail_stok_harian` sebelum delete `rekonsiliasi_harian` dan `master_lauk`.

**Alternatif yang ditolak:**
- Bergantung pada cascade delete saja — cascade bisa gagal jika ada constraint lain
- Menggunakan TRUNCATE CASCADE — terlalu agresif, bisa menghapus data user lain

**Alasan:** Menghapus `detail_stok_harian` secara eksplisit memastikan tidak ada foreign key constraint yang menghalangi delete `master_lauk` (karena `lauk_id` memiliki `ON DELETE RESTRICT`).

### Decision 3: Verifikasi `getCarryOverForLauk` dengan logging sementara

**Pilihan:** Tambahkan console.log sementara di `getCarryOverForLauk` untuk debug, lalu hapus setelah test berjalan.

**Alternatif yang ditolak:**
- Mengubah return value — akan merusak logic aplikasi
- Mock Supabase client — terlalu kompleks untuk E2E test

**Alasan:** Logging membantu memahami exact nilai yang dikembalikan fungsi, sehingga bisa memastikan apakah masalah ada di seed atau di implementasi.

### Decision 4: Pastikan Supabase URL dan key mengarah ke lokal

**Pilihan:** Verifikasi bahwa `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di environment test mengarah ke Supabase lokal (bukan production).

**Alternatif yang ditolak:**
- Menggunakan environment variable terpisah — sudah dilakukan di playwright.config.ts
- Menambahkan flag production di test — tidak diperlukan

**Alasan:** Playwright config sudah mengatur `VITE_SUPABASE_URL` ke `http://127.0.0.1:54321` (Supabase lokal). Pastikan ini berfungsi dengan benar.

## Risks / Trade-offs

- **[Seed insert gagal tanpa error]** Jika insert `detail_stok_harian` gagal karena constraint, test akan lanjut ke assertion dan gagal dengan pesan yang membingungkan. → Mitigasi: Tambahkan error checking pada semua operasi seed.

- **[Cascade delete tidak sempurna]** Jika delete `rekonsiliasi_harian` tidak cascade ke `detail_stok_harian` karena alasan tertentu, delete `master_lauk` akan gagal. → Mitigasi: Hapus `detail_stok_harian` secara eksplisit terlebih dahulu.

- **[Supabase lokal tidak berjalan]** Jika Supabase lokal tidak berjalan atau port berbeda, semua test akan gagal. → Mitigasi: Pastikan Supabase lokal berjalan di port default (54321).
