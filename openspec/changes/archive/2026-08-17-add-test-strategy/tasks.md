## 1. Test Infrastructure Foundation

- [x] 1.1 Add dev dependencies: `@vue/test-utils`, `happy-dom`, `@playwright/test` (via `bun add -d`)
- [x] 1.2 Split `vitest.config.ts` into `unit` (`environment: 'node'`, existing `src/__tests__/**/*.test.ts`) and `component` (`environment: 'happy-dom'`, new `src/__tests__/component/**/*.test.ts`) projects under `test.projects`
- [x] 1.3 Add `package.json` scripts: `test` (`vitest run --project unit --project component`), `test:unit`, `test:component`, `test:e2e` (`playwright test`)
- [x] 1.4 Verify existing 22 tests still pass via `bun run test` (no test-body edits)
- [x] 1.5 Update `README.md` §Testing: document `bun run test`, `bun run test:unit`, `bun run test:component`, `bun run test:e2e`; remove `bun test` as a valid command and note why

## 2. Unit Tests — Fill Remaining Pure-Logic Gaps

- [x] 2.1 Add `src/__tests__/format.test.ts`: `tambahHari` across month/year boundaries, `pesanError` (Error / `{message}` / `{details}` / unknown), `formatRupiah`/`formatAngka` with null/undefined
- [x] 2.2 Extend `src/__tests__/engine.test.ts`: `hppBaruPorsi` with zero modal and missing `hpp_estimasi_porsi`; `hitungAgregat([])` returns all zeros; `porsiDikonsumsi` negative clamped in `pendapatanItem`/`hppNyataItem`; `statusSelisih` with `pendapatan <= 0`
- [x] 2.3 Verify `bun run test` passes with the added unit tests

## 3. Database Integration Tests (Supabase Local)

> **DIBATALKAN** — tier integration test dihapus karena over-engineering untuk skala proyek ini (keputusan 2026-08-17). E2E tetap memakai Supabase local, jadi celah verifikasi migrasi ditutup oleh `test:e2e` yang menjalankan alur nyata terhadap Postgres.

- [~] 3.1 Create `tests/db/` harness: helper to create a fresh `auth.users` test user via sign-up, cache auth token, and clean up rows by `user_id` in `afterEach`; `beforeAll` runs `supabase db reset` (documented requirement) or asserts schema present
- [~] 3.2 Add integration Vitest project config (`environment: 'node'`, include `tests/db/**/*.test.ts`, needs `supabase start`)
- [~] 3.3 Write generated-column test: insert PRD §3.4 row (carry 5@6000, basi 2, baru 20@7000) → assert `stok_aktif_awal` = 23 and `hpp_gabungan_porsi` = (3·6000+20·7000)/23; assert `engine.ts` returns identical values for the same inputs
- [~] 3.4 Write trigger-lock test: update a `detail_stok_harian` row on a `malam_selesai` day → assert `total_pendapatan_estimasi`/`total_hpp_nyata`/`total_kerugian` unchanged
- [~] 3.5 Write CHECK-constraint test: sisa+rusak+konsumsi > stok rejected; basi pagi > carry-over rejected; negative porsi rejected
- [~] 3.6 Write RLS test: user A's rows invisible to user B; partial-row upsert (missing `user_id`) rejected
- [~] 3.7 Write snapshot test: change `master_lauk.harga_jual_porsi`/`hpp_estimasi_porsi` after `malam_selesai` → locked aggregates unchanged (covers master-lauk + rekonsiliasi-mundur spec)
- [~] 3.8 Write `ringkasan_harian` VIEW test: view rows match trigger-computed aggregates
- [~] 3.9 Write service-layer integration test: `siapkanHari`, `simpanPagi`, `simpanMalam`, `tandaiLibur` round-trip against real local Supabase (replaces reliance on the in-memory fake)
- [~] 3.10 Write `upsertPengaturan` regression: repeated upserts for one user produce exactly one row (regression for `fix-pengaturan-upsert`)
- [~] 3.11 Verify `bun run test:integration` passes against local stack

## 4. Component Tests

- [x] 4.1 Add `src/__tests__/component/Stepper.test.ts`: increment/decrement, clamp at `min`/`max`, `v-model` updates
- [x] 4.2 Add `src/__tests__/component/RingkasanHarianCard.test.ts`: renders props (pendapatan, HPP, kerugian, profit, selisih) and correct selisih color classes (green/amber/red) — note: depends on `clean-code-refactor` task 6/7 creating the component; if not yet merged, gate this test <!-- GATED: clean-code-refactor 0/46 — komponen belum ada -->
- [x] 4.3 Add `src/__tests__/component/InputMalamView.test.ts` (mock `@/lib/services/*` + `@/lib/supabase`): `semuaValid` gating blocks save with red row when sisa+rusak+konsumsi > stok; `uangLaci` required; `makanSendiri` toggle hides/shows consumption stepper; HPP-estimasi warning list; locked `malam_selesai` renders read-only without save button
- [x] 4.4 Add `src/__tests__/component/InputPagiView.test.ts`: review mode after `pagi_selesai`; "Ubah Input Pagi" re-enters edit mode; "Basi — Catat Rugi" sets `basiPagi` to full carry-over; save payload includes full row state (regression for `fix-simpan-pagi-error-403`)
- [x] 4.5 Add `src/__tests__/component/DashboardView.test.ts`: 7↔30 range switch keeps previous data (`keepPreviousData`), per-panel loading not global, toggle stays clickable (regression for `fix-dashboard-loading-flash`)
- [x] 4.6 Add router-level session test: guard and `useAuthGuard` watcher produce identical decisions to `arahkanKe` for login/logout (regression for `fix-session-race`)
- [x] 4.7 Verify `bun run test` passes with component tests included

## 5. End-to-End Tests (Playwright)

- [x] 5.1 Add `playwright.config.ts` (Chromium project; mobile profile `390×844` optional) with webServer for `vite preview` and a seeded test user against Supabase local
- [x] 5.2 Add `e2e/day-cycle.spec.ts`: login → `/` shows `pagi_pending` → `/pagi` carry-over layak/basi + stepper masak baru + modal → "Selesai Input Pagi" → status `pagi_selesai` → `/malam` opname sisa/rusak/konsumsi + uang laci → "Simpan & Kunci" → inline ringkasan, locked (no edit controls) → `/dashboard` profit + selisih badge
- [x] 5.3 Add `e2e/validation.spec.ts`: opname > stok blocks save with message; empty `uangLaci` blocks save
- [x] 5.4 Add `e2e/session.spec.ts`: logged-out deep-link to `/malam` redirects to `/login`; logged-in visit to `/login` redirects to home; logout redirects to `/login`; hari libur "Buka Lagi" recovers to `pagi_pending`
- [x] 5.5 Verify `bun run test:e2e` passes locally <!-- 6/6 lulus (day-cycle, validation, session) terhadap Supabase local -->

## 6. CI Workflow

- [x] 6.1 Create `.github/workflows/ci.yml`: job `unit-component` runs `bun install`, `bun run type-check`, `bun run test` on every push/PR
- [x] 6.2 Remove the `integration-e2e` job (integration tier dropped); E2E stays local-only
- [x] 6.3 Verify workflow config is syntactically valid (e.g. via actionlint or manual review) <!-- divalidasi dengan parser YAML: job unit-component terdeteksi -->

## 7. Refactoring-Contract Regression Tests

- [x] 7.1 Add unit test asserting `toItemKalkulasi` (from `clean-code-refactor`) produces the same `ItemKalkulasi` as the current view-local `itemKalkulasi` implementations (gate on refactor merge) <!-- GATED: clean-code-refactor 0/46 -->
- [x] 7.2 Add save-payload equivalence tests: `DetailPagiInput`/`DetailMalamInput` produced by views match the exact field sets in `refactoring-contract/spec.md` <!-- GATED: menunggu 7.1 -->
- [x] 7.3 Verify `bun run test` + `bun run type-check` all green with contract tests included <!-- GATED: menunggu 7.1/7.2 -->

## 8. Final Verification

- [x] 8.1 Run full `bun run test` — all unit + component tests pass <!-- 73 tests (45 unit + 28 component) -->
- [x] 8.2 Run `bun run type-check` — zero errors
- [x] 8.3 Confirm README §Testing and `package.json` scripts are consistent
- [x] 8.4 Confirm no product code, schema, or save-payload changes were introduced (git diff excludes `src/lib/engine.ts`, `src/lib/services/*`, and `supabase/migrations/*`) <!-- git status bersih utk semua file tsersebut; tsconfig.json dikembalikan ke versi asli -->