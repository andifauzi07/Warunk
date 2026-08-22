# Architecture Decision Records (ADR) — Warunk

Indeks keputusan desain penting. **Setiap entri men-link ke `design.md` di `openspec/changes/archive/`** — jangan copas isinya di sini (sumber kebenaran tetap di archive).

## Keputusan

### 1. Modal kembalian (float) di-snapshot per hari
Snap `modal_kembalian_pakai` saat simpan malam agar perubahan pengaturan tidak menggeser selisih kas hari yang sudah terkunci.
→ `openspec/changes/archive/2026-08-15-warungk-mvp/design.md`

### 2. Kunci final di `malam_selesai`
Setelah malam terkunci, tidak ada perubahan retroaktif; trigger agregat tidak berjalan bila `status = 'malam_selesai'`.
→ `openspec/changes/archive/2026-08-15-warungk-mvp/design.md`

### 3. HPP estimasi sebagai fallback
Bila modal porsi baru belum diinput, pakai `hpp_estimasi_porsi` dari master lauk dan tandai hari "estimasi belum final".
→ `openspec/changes/archive/2026-08-15-warunk-mvp/design.md`

### 4. Pembayaran digital masuk selisih kas
Uang digital (QRIS/GoPay) dihitung dalam `selisih_kas` bila toggle aktif.
→ `openspec/changes/archive/2026-08-15-warunk-mvp/design.md`

### 5. Pemisahan TanStack Query + Pinia
Server state di TanStack (cache, dedupe, invalidate); client state (auth, tanggal aktif) di Pinia. Auth selalu dari session store, bukan cache query.
→ `openspec/changes/archive/2026-08-16-optimize-hari-ini-fetching/design.md`

### 6. Tidak pakai POS konvensional (validated failure)
Warunk menghitung mundur dari stok, bukan mencatat transaksi — POS terbukti gagal memperlambat antrean.
→ `openspec/changes/archive/2026-08-15-warungk-mvp/design.md`
