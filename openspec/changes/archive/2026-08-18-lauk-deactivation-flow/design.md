## Context

Saat ini, `toggleAktif(lauk)` di `MasterLaukView.vue` hanya memanggil `updateLauk(id, { is_active: !lauk.is_active })` tanpa memproses carry-over. Baris `detail_stok_harian` milik lauk nonaktif tetap ada di database, sehingga:

1. `seedDetailHariIni()` tidak menghapus baris lama — hanya menambah baris untuk lauk aktif yang belum punya detail.
2. `useDetailRows` memetakan semua `detail` tanpa filter `is_active`, sehingga lauk nonaktif tetap tampil di `/pagi`.
3. Carry-over dari lauk nonaktif "tertinggal" dan bisa muncul kembali saat lauk diaktifkan.

**State saat ini:**
- `MasterLaukView.vue:74` — `toggleAktif` tanpa validasi carry-over
- `rekonsiliasi.ts:87` — `seedDetailHariIni` hanya insert, tidak delete
- `useDetailRows.ts:22` — `initRowsFromDetail` tidak filter inactive

## Goals / Non-Goals

**Goals:**
- Saat deaktivasi lauk, pindahkan carry-over ke basi pagi (zero carry-over)
- Tampilkan popup konfirmasi sesuai kondisi carry-over
- Sembunyikan lauk nonaktif dari UI input pagi/malam
- Pastikan jika lauk diaktifkan kembali, mulai dari 0 tanpa carry-over lama

**Non-Goals:**
- Tidak menghapus baris `detail_stok_harian` dari database (riwayat tetap utuh)
- Tidak mengubah schema database atau migration
- Tidak menangani kasus deaktivasi saat hari sudah `malam_selesai` (carry-over sudah diproses ke hari berikutnya)

## Decisions

### Decision 1: Zero carry-over dilakukan di service layer, bukan database trigger

**Pilihan:** Update `porsi_basi_pagi` dan `porsi_carry_over` via Supabase service function.

**Alternatif yang ditolak:**
- Database trigger on `master_lauk.is_active` change — terlalu implicit, sulit di-test, dan menambah kompleksitas trigger yang sudah ada.
- Soft-delete baris detail — melangkar integritas data riwayat.

**Alasan:** Konsisten dengan pola existing di mana semua business logic ada di service layer. Service function `zeroCarryOverForLauk` bisa di-unit-test dengan mock Supabase.

### Decision 2: Cek carry-over dari baris detail hari ini, bukan dari malam kemarin

**Pilihan:** Query `detail_stok_harian` untuk `rekonsiliasi_harian` tanggal hari ini, filter `lauk_id = lauk yang dinonaktifkan`, periksa `porsi_carry_over`.

**Alternatif yang ditolak:**
- Query hari operasional terakhir — lebih kompleks dan tidak mencerminkan state aktual hari ini.

**Alasan:** Baris detail hari ini sudah berisi carry-over dari malam kemarin (diisi saat `seedDetailHariIni`). Ini adalah sumber kebenaran yang paling langsung.

### Decision 3: Filter di composable, bukan di template

**Pilihan:** `useDetailRows` mengembalikan `rows` yang sudah difilter berdasarkan `is_active` lauk.

**Alternatif yang ditolak:**
- Filter di template `v-for` — memindahkan logika bisnis ke UI layer, sulit di-test.

**Alasan:** Konsisten dengan arsitektur existing di mana composable bertanggung jawab atas data transformation.

### Decision 4: Popup konfirmasi native browser (confirm), bukan custom modal

**Pilihan:** Gunakan `window.confirm()` untuk popup konfirmasi.

**Alternatif yang ditolak:**
- Custom modal component — lebih banyak kode, perlu desain UI, dan untuk konfirmasi sederhana ini berlebihan.

**Alasan:** PRD menekankan "zero-training onboarding" dan UI sederhana. `confirm()` cukup untuk kasus ini dan tidak menambah kompleksitas. Jika nanti perlu custom modal, bisa di-refactor.

### Decision 5: Urutan operasi saat deaktivasi

```
1. Query carry-over dari detail hari ini
2. Tampilkan popup sesuai kondisi
3. [Jika carry-over > 0] Update detail: basi_pagi = carry_over, carry_over = 0
4. Update master_lauk: is_active = false
5. Invalidate cache ['hari-ini', 'master-lauk']
```

**Alasan:** Step 3 dilakukan SEBELUM step 4. Jika user batal setelah popup, tidak ada perubahan. Jika step 3 gagal (network error), step 4 tidak dijalankan. Ini menjaga konsistensi data.

## Risks / Trade-offs

- **[Race condition]** Jika user deaktivasi lauk sementara pagi sudah `pagi_selesai` tapi belum `malam_selesai`, carry-over yang sudah di-zero akan mempengaruhi kalkulasi malam. → Mitigasi: Ini memang desired behavior — lauk nonaktif tidak boleh punya carry-over.

- **[User batal setelah zero carry-over]** Tidak ada rollback otomatis. → Mitigasi: User bisa re-activate lauk dan mengoreksi input pagi secara manual. Atau kita bisa tambah undo, tapi ini di luar scope.

- **[Hari sudah malam_selesai]** Jika user mencoba nonaktifkan lauk setelah hari terkunci, carry-over untuk hari besok (porsi_sisa_layak_jual) sudah "terkunci" di baris malam. → Mitigasi: Nonaktifkan tombol toggle saat status `malam_selesai`, atau izinkan tapi zero carry-over hanya berlaku untuk hari ini (besok tetap ada carry-over dari malam). Yang terakhir lebih berisiko, jadi kita pilih: **tolak deaktivasi saat malam_selesai**.
