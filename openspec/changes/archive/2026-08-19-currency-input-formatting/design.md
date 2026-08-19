## Context

Aplikasi Warunk adalah PWA mobile-first untuk rekonsiliasi warung nasi campur. Saat ini semua input mata uang menggunakan `type="number"` tanpa pemisah ribuan. Pengguna melihat angka mentah seperti `170000` saat mengetik, yang kurang nyaman dibaca. Selain itu, tombol simpan belum disabled secara otomatis saat field required kosong — validasi hanya terjadi setelah klik simpan.

Stack: Vue 3.5 + Composition API, TypeScript, Tailwind CSS 4, Pinia, TanStack Vue Query. Tidak ada component library — semua UI custom-built.

## Goals / Non-Goals

**Goals:**
- Input mata uang menampilkan pemisah ribuan Indonesia (`.`) real-time saat mengetik
- Tombol simpan disabled saat input required masih kosong/nol
- Tidak ada perubahan schema database
- Tidak ada dependency baru

**Non-Goals:**
- Input desimal (field toleransi persen tidak diformat)
- Currency prefix "Rp " di dalam input (label sudah menampilkan "(Rp)")
- Validasi max value / max length (bukan prioritas untuk warung)
- Perubahan tampilan ringkasan/reports

## Decisions

### 1. Vue Directive `v-currency` (bukan composable atau library)

**Pilihan:** Custom Vue directive yang diregister secara global.

**Alternatif yang dipertimbangkan:**
- **Composable `useCurrency()`**: Butuh boilerplate lebih banyak di tiap view. Harus inisialisasi manual di script setup. Tidak bisa langsung dipakai di template.
- **Library `vue-currency-input`**: Menambah dependency baru. Over-engineered untuk kebutuhan sederhana. Risk maintenance.
- **Vue Directive**: Paling bersih di template (`v-currency`), logic terpusat di satu file, zero dependency.

**Implementasi:**
- File baru: `src/directives/currency.ts`
- Register di `src/main.ts` sebagai `app.directive('currency', vCurrency)`
- Directive menangani event `input`, `focus`, `paste`, `keydown`
- Menggunakan `formatAngka()` dari `format.ts` yang sudah ada

### 2. `type="text"` dengan `inputmode="numeric"` (bukan `type="number"`)

**Pilihan:** Input menggunakan `type="text"` agar directive bisa mengontrol display value.

**Alasan:** `type="number"` tidak memungkinkan manipulasi display value secara programatis — browser mengontrol format tampilan. Dengan `type="text"`, directive bisa menulis `"170.000"` ke `input.value` sementara v-model tetap menyimpan `170000` (number).

`inputmode="numeric"` tetap dipertahankan agar keyboard numerik muncul di mobile.

### 3. Fungsi `parseCurrency()` di `format.ts`

**Pilihan:** Tambah fungsi baru untuk reverse parsing.

**Implementasi:**
- Strip semua karakter non-digit dari string input
- Return `number` (integer)
- Digunakan oleh directive untuk update v-model

### 4. Save button validation dengan computed property

**Pilihan:** Tambah computed property yang mengecek apakah semua field required terisi.

**InputPagiView:**
- `semuaModalTerisi = rows.value.every(r => r.modalBaru > 0)`
- `:disabled="simpanLoading || !semuaModalTerisi"`

**InputMalamView:**
- Tambah `uangLaci` ke kondisi disabled
- `:disabled="simpanLoading || !semuaValid || uangLaci === null || uangLaci < 0"`
- Hapus validasi uangLaci dari dalam fungsi `simpan()` (sudah di-handle oleh disabled)

### 5. Cursor management

**Pilihan:** Setelah format, reposition cursor relatif terhadap digit, bukan posisi absolut.

**Alasan:** Saat user mengetik di posisi tengah, insert digit lalu format ulang akan menggeser cursor. Solusinya: hitung jumlah digit sebelum cursor sebelum format, lalu posisikan cursor setelah format sehingga jumlah digit sebelum cursor tetap sama.

## Risks / Trade-offs

- **[Cursor position glitch]** → Mitigasi: Test dengan insert di tengah string, paste, dan backspace. Cursor management adalah bagian paling kompleks dari directive ini.
- **[v-model.number compatibility]** → Mitigasi: Directive akan mengatur v-model secara manual via `emit('update:modelValue')` atau直接 manipulate binding. Perlu pastikan kompatibilitas dengan Vue 3 reactivity.
- **[Input kosong vs nol]** → Mitigasi: `parseCurrency('')` return `0`. Input kosong = model `0`. User harus ketik `0` eksplisit jika memang nol.
- **[Break existing tests]** → Mitigasi: Cek test yang ada di `format.test.ts` — tidak ada yang terpengaruh karena `formatRupiah` dan `formatAngka` tidak diubah.
