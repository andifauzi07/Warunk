## Context

Aplikasi Warunk adalah manajemen warung makan sederhana dengan flux kerja harian: Input Pagi (stok) → Input Malam (rekonsiliasi). Master lauk dikelola di halaman terpisah (`/lauk`). Saat ini, tombol akses ke Master Lauk hanya ada di header halaman Home, sehingga pengguna harus navigasi bolak-balik saat ingin menambah lauk baru selama proses input pagi.

**State saat ini:**
- `HomeView.vue`: tombol "Lauk" di header → navigasi ke `/lauk`
- `InputPagiView.vue`: empty state menampilkan teks statis "Tambahkan di Master Lauk dulu" (bukan link)
- `useDetailRows.ts`: watcher hanya init rows sekali (flag `initialized`), tidak handle item baru
- `useMasterLauk.ts`: mutation `tambah` sudah invalidate queries `['master-lauk']` dan `['hari-ini']`

## Goals / Non-Goals

**Goals:**
- Pengguna bisa tambah lauk baru langsung dari halaman Input Pagi tanpa navigasi
- Lauk baru otomatis muncul di daftar input setelah ditambahkan
- Form tambah lauk menggunakan bottom sheet (konsisten dengan pattern UI yang ada)
- Validasi nama lauk duplikat dicegah

**Non-Goals:**
- Edit lauk dari halaman Input Pagi (tetap di `/lauk`)
- Tambah lauk dari halaman Input Malam
- Ubah layout atau struktur Master Lauk page
- Tambah field baru ke tabel `master_lauk`

## Decisions

### 1. Bottom sheet untuk form tambah lauk

**Pilihan:** Bottom sheet (modal dari bawah) vs inline expansion vs navigasi ke `/lauk`

**Keputusan:** Bottom sheet

**Rationale:**
- Konsisten dengan pattern yang sudah ada di `MasterLaukView.vue` (form modal dari bawah)
- Pengguna tetap di halaman Input Pagi, tidak kehilangan konteks
- Lebih clean dari inline expansion yang bisa membuat UI cluttered di mobile
- Navigasi ke `/lauk` memaksa user bolak-balik, tidak efisien

### 2. Modifikasi watcher `useDetailRows` untuk append item baru

**Pilihan:** 
- A: `resetInitialized()` setelah tambah lauk (reset semua edit user)
- B: Deteksi item baru di watcher dan append saja
- C: Buat reactive computed dari `hari.detail` langsung

**Keputusan:** Opsi B - deteksi item baru di watcher

**Rationale:**
- Opsi A menghilangkan edit user yang belum tersimpan (buruk untuk UX)
- Opsi C terlalu besar perubahan scope-nya
- Opsi B minimal change, hanya tambah branch `else` di watcher yang sudah ada
- Logic: bandingkan `laukId` yang ada di `rows` vs yang ada di `hari.detail`, append yang baru

### 3. Sembunyi inline button saat hari terkunci

**Keputusan:** Sembunyi tombol inline `[+ Tambah Lauk Baru]` saat `status === 'malam_selesai'`

**Rationale:**
- Konsisten dengan behavior tombol "Ubah Input Pagi" yang juga disembunyikan saat terkunci
- Mencegah user menambah lauk yang tidak akan terpakai (hari sudah selesai)

### 4. Validasi nama duplikat di client-side

**Keputusan:** Cek nama lauk yang sudah ada di `laukList` sebelum submit

**Rationale:**
- Mencegah error dari Supabase (constraint unique)
- UX lebih baik - pesan error langsung muncul di form
- Cukup bandingkan `nama.trim().toLowerCase()` dengan existing lauk names

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Lauk baru belum ter-seed di `detail_stok_harian` saat form dibuka | Setelah tambah lauk, query `hari-ini` di-invalidate → `siapkanHari()` re-run → watcher append item baru |
| User klik "Selesai Input Pagi" sebelum lauk baru muncul di list | Tombol simpan disabled jika ada lauk dengan modal 0 (behavior sudah ada) |
| Race condition antara invalidation dan watcher | TanStack Query handle retry, watcher punya fallback `initialized` check |
| Bottom sheet form duplikat logic dengan `MasterLaukView` | Buat komponen `LaukFormSheet.vue` yang bisa di-reuse (DRY) |
