## 1. Index & Falsafah

- [x] 1.1 Buat `docs/README.md`: indeks 4 dokumen (`development.md`, `architecture.md`, `database.md`, `adr.md`) + satu paragraf falsafah *backward reconciliation* (singkat, rujukan PRD, tidak copas).
- [x] 1.2 Di `README.md`, tambahkan 1 baris di "Daftar Isi" yang men-link ke `docs/README.md` (pointer, bukan duplikasi).

## 2. Development Guide

- [x] 2.1 Buat `docs/development.md` § Getting started: `bun install`, salin `.env.example` → `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`), `bun dev`. Sertakan ⚠️ bahwa `bun test` **tidak** didukung → pakai `bun run test`.
- [x] 2.2 § Bootstrap order: diagram/urutan dari `src/main.ts` (`registerSW` → `createPinia` → `VueQueryPlugin` → `session.init()` → `router` → `mount`) + pendaftaran direktif `v-currency`.
- [x] 2.3 § Konvensi state: aturan Pinia (client: `stores/session.ts`, `stores/hari.ts`) vs TanStack (server; `QUERY_DEFAULTS` `staleTime:5m`, `refetchOnWindowFocus:false` dari `src/lib/queryConfig.ts`); auth selalu dari session store.
- [x] 2.4 § Pola composable: template dari `src/composables/useHariIni.ts` — `queryKey` factory, `useQuery`, `useMutation` + `onSuccess` → `invalidateHari()`; sebutkan daftar query key (`['hari-ini']`, `['hari-status']`, `['master-lauk']`, `['ringkasan-harian']`, `['tren']`, `['ranking-lauk']`).
- [x] 2.5 § Walkthrough "cara tambah fitur": resep 5 langkah (spec `openspec/specs/` → `lib/services/_x.ts` → `composables/useX.ts` → `views/XView.vue` → `src/__tests__/`), diilustrasikan dengan referensi `useHariIni.ts` / `services/rekonsiliasi.ts`.
- [x] 2.6 § Pitfall: `bun test` tidak didukung; race session (arsip `2026-08-15-fix-session-race`); 403 simpan pagi (arsip `2026-08-15-fix-simpan-pagi-error-403`).

## 3. Architecture Diagrams

- [x] 3.1 Buat `docs/architecture.md` § Layered: link ke README § "Arsitektur Teknis" (tidak copas).
- [x] 3.2 § 3-Fase flow: diagram `mermaid flowchart` (PAGI `InputPagiView` → SIANG → MALAM `InputMalamView` → DASHBOARD; carry-over melompati hari libur).
- [x] 3.3 § Mutasi→invalidasi→refetch: diagram `mermaid sequenceDiagram` berdasar `useHariIni.ts` (`simpanMalam` → `services/rekonsiliasi` → Supabase trigger → `invalidateQueries` → DashboardView refetch).
- [x] 3.4 § Session guard: diagram `mermaid sequenceDiagram` (`router.beforeEach` → `waitForSession()` → `arahkanKe()` → `useAuthGuard` watch).
- [x] 3.5 § State ownership map: tabel (state, tempat, kapan invalid/reset) — ground ke `stores/session.ts`, `useHariIni.ts`.
- [x] 3.6 § Engine: 1 paragraf link ke `src/lib/engine.ts` (pure functions + snapshot DB).

## 4. Database Reference

- [x] 4.1 Buat `docs/database.md` § Tabel: 4 tabel (`master_lauk`, `rekonsiliasi_harian`, `detail_stok_harian`, `pengaturan_warung`) dengan kolom & tipe, merujuk `supabase/migrations/2026081500000[1-3].sql`.
- [x] 4.2 § Generated columns: rumus `stok_aktif_awal`, `hpp_gabungan_porsi`, `porsi_dikonsumsi`, `keuntungan_bersih`, `selisih_kas` (dari migrasi 02/03).
- [x] 4.3 § Trigger & VIEW: `hitung_agregat_rekonsiliasi()` (tekan guard `status <> 'malam_selesai'`) + VIEW `ringkasan_harian` (`security_invoker=on`) — dari `20260815000004`.
- [x] 4.4 § RLS: 4 policy owner-scoped `user_id = auth.uid()` — dari `20260815000005`.
- [x] 4.5 § Check constraints: `chk_stok_non_negative`, `chk_basi_pagi`, `chk_porsi_non_negative`.

## 5. ADR Index

- [x] 5.1 Buat `docs/adr.md`: daftar keputusan + 1 kalimat alasan + link ke `openspec/changes/archive/<nama>/design.md` untuk: float snapshot per hari, kunci final `malam_selesai`, HPP estimasi fallback, pembayaran digital masuk selisih kas, TanStack+Pinia terpisah, tidak pakai POS konvensional.

## 6. Verifikasi

- [x] 6.1 Jalankan `openspec validate add-developer-docs` dan pastikan lolos.
- [x] 6.2 Cek semua link internal (`docs/` ↔ README ↔ `openspec/changes/archive/*`) valid.
- [x] 6.3 Pastikan semua blok `mermaid` ter-parse (cek di preview GitHub/VS Code).
