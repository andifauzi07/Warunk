## Context

Proyek Warunk (`D:/Proyek/Vue/Warunk`) adalah PWA Vue 3 + Supabase dengan ~5.950 LOC. Dokumentasi saat ini:

- `README.md` (373 baris): overview, arsitektur box, setup, skema ringkas, engine logic, navigasi, data fetching, testing.
- `PRD.md` (395 baris): produk, persona, requirement fungsional.
- `openspec/specs/` (21): perilaku tiap fitur (WHEN/THEN).
- `openspec/changes/archive/` (16): catatan desain & keputusan per change.
- JSDoc di `src/lib/engine.ts` dan sebagian service/composable.

Yang **tidak** ada: narasi "bagaimana bekerja di codebase ini" dan diagram alur. Developer baru bisa menghafal 21 spec tapi tetap bingung: *composable taruh di mana? kapan pakai store vs query? urutan mutasi sampai invalidate bagaimana?*

Fakta kode yang jadi landasan `docs/` (sudah diverifikasi):

- Bootstrap: `src/main.ts` — `registerSW` → `createPinia` → `VueQueryPlugin` → `session.init()` (await) → `router` → `mount`; direktif `v-currency` didaftarkan di sini.
- Guard: `src/router/index.ts` — 7 lazy routes, `beforeEach` → `await session.waitForSession()` → `arahkanKe()` (predikat tunggal di `src/lib/sessionNavigation.ts`).
- Session: `src/stores/session.ts` — `user`/`loading` ref, `init()` (getSession + onAuthStateChange), `waitForSession()` (watch-based), `login`/`logout`.
- State split: Pinia = client (`session`, `hari`); TanStack = server. `src/lib/queryConfig.ts` → `QUERY_DEFAULTS` (`staleTime: 5m`, `refetchOnWindowFocus: false`). Auth selalu dari session store.
- Composable pattern: `src/composables/useHariIni.ts` — `queryKey` factory (`hariIniKey`), `useQuery`, `useMutation` + `onSuccess` → `invalidateHari()` (invalidate `['hari-ini']`,`['hari-status']`); `simpanMalam` juga invalidate `['ringkasan-harian']`,`['tren']`,`['ranking-lauk']`.
- DB: `supabase/migrations/20260815000004_agregat_trigger_view.sql` — trigger `hitung_agregat_rekonsiliasi()` dengan guard `status <> 'malam_selesai'`, VIEW `ringkasan_harian` (`security_invoker=on`). `20260815000005_rls.sql` — 4 policy owner-scoped `user_id = auth.uid()`.
- Pitfall: `bun test` (runner native) gagal resolve alias `@/` → harus `bun run test` (README § Testing).

## Goals / Non-Goals

**Goals:**
- Memberi developer baru panduan setup ulang + konvensi + resep tambah fitur dalam satu tempat.
- Menggambarkan alur (3-fase, mutasi→invalidasi, session guard) via diagram Mermaid yang bisa di-render GitHub/VS Code.
- Menyediakan referensi DB kolom-demi-kolom + indeks ADR terpusat yang men-link ke archive.

**Non-Goals:**
- Tidak mengganti/menduplikasi README atau OpenSpec spec — hanya men-link.
- Tidak menulis ulang perilaku fitur (bukan spec delta).
- Tidak membuat auto-generated API docs (TypeDoc) — di luar scope awal; bisa jadi follow-up.
- Tidak mengubah kode aplikasi apa pun.

## Decisions

### D1. `docs/` terpisah, bukan perluas README
- **Pilihan**: buat folder `docs/` dengan 5 file, dan tambahkan 1 baris pointer di README Daftar Isi.
- **Alasan**: README sudah 373 baris & gemuk; menambah narasi panjang ke sana akan mengurangi keterbacaan overview. `docs/` scalable kalau kelak perlu sub-dokumen (mis. `docs/runbook/`).
- **Alternatif**: `CONTRIBUTING.md` di root — ditolak karena topiknya ("seluruh aplikasi") lebih dari sekadar kontribusi; butuh struktur bersarang.

### D2. Diagram pakai Mermaid, bukan ASCII
- **Pilihan**: semua diagram ditulis dalam `mermaid` fenced block.
- **Alasan**: Mermaid di-render native oleh GitHub & ekstensi VS Code; ASCII (seperti di README) tidak bisa di-render & rawan usang saat di-edit.

### D3. `docs/adr.md` men-link, tidak mencopas
- **Pilihan**: `adr.md` hanya berisi daftar keputusan + 1 kalimat alasan + link ke `openspec/changes/archive/<nama>/design.md`.
- **Alasan**: duplikasi akan menyebabkan drift (keputusan ada di dua tempat). Archive sudah jadi sumber kebenaran ADR; `adr.md` cukup jadi indeks.

### D4. `docs/database.md` grounded ke SQL asli
- **Pilihan**: cantumkan nama tabel/kolom/trigger/VIEW/RLS persis seperti di `supabase/migrations/`, bukan rangkuman bebas.
- **Alasan**: developer yang debug query butuh nama objek persis (mis. `hitung_agregat_rekonsiliasi`, `ringkasan_harian`, `security_invoker`).

### D5. Walkthrough "cara tambah fitur" mengikuti pola nyata
- **Pilihan**: resep 5 langkah (spec → `lib/services/_x.ts` → `composables/useX.ts` → `views/XView.vue` → `src/__tests__/`) diilustrasikan dengan referensi file yang sudah ada (`useHariIni.ts`, `services/rekonsiliasi.ts`).
- **Alasan**: ini mengisi celah terbesar README — dev baru tahu *apa* tiap layer, tapi tidak tahu *urutan* membuat fitur baru.

## Risks

- **Dokumentasi usang**: kode berubah, `docs/` tidak. Mitigasi: `docs/` men-link ke sumber (code/OpenSpec/migrasi)而不是 mencopas nilai; ADR di-link bukan di-copas.
- **Mermaid tidak ke-render di tool tertentu**: mitigasi dengan menyebut di `docs/README.md` bahwa diagram butuh GitHub/VS Code Mermaid preview.
