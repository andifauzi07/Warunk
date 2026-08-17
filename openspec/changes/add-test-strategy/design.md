## Context

Warunk has **two sources of truth** for reconciliation math:

- `src/lib/engine.ts` — pure functions for live UI feedback (currently the only tested layer, 16 tests).
- `supabase/migrations/*` — PostgreSQL generated columns + `hitung_agregat_rekonsiliasi()` trigger + CHECK constraints + RLS, which produce the **authoritative, locked** values.

Current test setup: single Vitest project, `environment: 'node'`, include glob `src/__tests__/**/*.test.ts`. 22 tests total (engine 16, sessionNavigation 4, rekonsiliasi 2 with an in-memory fake of `@/lib/supabase`). There is no jsdom/happy-dom, no `@vue/test-utils`, no Playwright/Cypress, no DB test harness, and `.github/workflows/` is empty (no CI).

Two concrete frictions found during exploration:
1. `README.md` says to run `bun test`; that command uses bun's native runner, which ignores `vitest.config.ts` and fails to resolve the `@/` alias in `rekonsiliasi.test.ts` (20 pass, 1 fail, 1 error). The working command is `bun run test` (`vitest run`).
2. The in-flight `clean-code-refactor` change declares a `refactoring-contract` spec (save-payload and UI-output equivalence) whose invariants are its **highest-risk failure mode**, yet its `tasks.md` only re-runs the existing 22 tests — the contract is never actually asserted by tests.

## Goals / Non-Goals

**Goals:**
- Establish three test tiers, each verifying a distinct layer: unit (pure logic), component (Vue SFC behavior), E2E (full user journey against real Postgres via Supabase local).
- Verify the two sources of truth agree on the PRD §3.4 example and across edge cases.
- Convert every archived fix (`openspec/changes/archive/*`) and the refactoring-contract scenarios into permanent, runnable regression tests.
- Fix the documented test command and add a CI gate.

**Non-Goals:**
- Changing any product behavior, schema, save payload, or engine formula.
- Rewriting the existing 22 unit tests (they stay as-is).
- Full component coverage of every view — only the highest-value interactive components and state-gated views (Input Pagi/Malam, Dashboard range switch).
- A dedicated DB integration test tier (`tests/db/` + `test:integration`) — dropped (2026-08-17) as over-engineering for this project's scale; migration behaviors are instead verified end-to-end by Playwright against Supabase local.
- Testing the Supabase-hosted cloud environment; all E2E runs against **Supabase local**.

## Decisions

### 1. Vitest projects instead of a single environment

**Decision**: Split Vitest into two projects in `vitest.config.ts` — `unit` (`environment: 'node'`, existing `src/__tests__/**/*.test.ts`) and `component` (`environment: 'happy-dom'`, new `src/__tests__/component/**/*.test.ts`). Keep the root config for common settings (`@` alias, etc.).

**Rationale**: The current single config hardcodes `environment: 'node'`; mounting SFCs requires a DOM. A second project avoids dragging DOM globals into pure-logic tests (which should stay fast and environment-agnostic).

**Alternative considered**: One environment with per-file `// @vitest-environment happy-dom` comments. Rejected — mixing environments in one run is fragile and the comment directive is easy to miss.

### 2. DB integration tier — dropped (was: Vitest + Supabase local (PostgREST), not pgTAP)

**Original decision**: Write DB integration tests in Vitest under `tests/db/`, using the real `supabase-js` client pointed at `supabase start` (port 54321).

**Reversal (2026-08-17)**: The integration tier (`tests/db/`, integration Vitest project, `test:integration`, CI job `integration-e2e`) was removed as over-engineering for this small project. The behaviors it would assert (generated columns, trigger lock, CHECK constraints, RLS, VIEW) are instead exercised through the E2E tier, which already runs the full user journey against real Postgres. The `supabase-js` constants helpers were moved to `e2e/constants.ts` so Playwright no longer imports from `tests/db/`.

### 3. Test isolation strategy per tier

| Tier | Isolation mechanism |
|------|--------------------|
| Unit | Pure functions, no IO |
| Component | Mock `@/lib/services/*` + `@/lib/supabase` (same `vi.mock` pattern as `rekonsiliasi.test.ts`); provide Pinia + Vue Query plugins on mount |
| E2E | Dedicated seeded test user + `supabase db reset` before run; independent of dev data |

### 4. Component test targets (highest value first)

- `Stepper.vue` — increment/decrement, clamp at `min`/`max`, live `v-model` update.
- `RingkasanHarianCard.vue` — renders correct values per prop and correct selisih color classes (green/amber/red) — this doubles as the `refactoring-contract` UI-output regression test.
- `InputMalamView.vue` — `semuaValid` gating (sisa+rusak+konsumsi > stok → block save + red row), `uangLaci` required, `makanSendiri` toggle hiding/showing the consumption stepper, HPP-estimasi warning list, locked read-only mode.
- `InputPagiView.vue` — review mode after `pagi_selesai`, "Ubah Input Pagi" re-entering edit mode, "Basi — Catat Rugi" setting `basiPagi` to full carry-over.
- `DashboardView.vue` — 7↔30 range switch keeps previous data (`keepPreviousData`) and shows per-panel loading, not a global one — the `fix-dashboard-loading-flash` regression.

### 5. Regression catalog: archived fixes → permanent tests

| Archived fix | Regression test | Tier |
|---|---|---|
| `fix-simpan-pagi-error-403` | save payload carries full row state (`user_id`, `rekonsiliasi_id`, `lauk_id`, all NOT NULL/CHECK columns); RLS accepts upsert, rejects partial rows | component + E2E |
| `fix-session-race` | login sets user from response synchronously; guard and `useAuthGuard` watcher agree with `arahkanKe` | component (router-level) |
| `fix-pengaturan-upsert` | `upsertPengaturan` onConflict `user_id` updates once, never duplicates | E2E (via Supabase local) |
| `fix-dashboard-loading-flash` | range switch: previous data retained, per-panel loading, toggle stays clickable | component |
| `optimize-hari-ini-fetching` | `siapkanHari` performs exactly one `detail_stok_harian` GET per cycle | unit (already covered; extend) |
| `clean-code-refactor` (in-flight) | `toItemKalkulasi` equivalence; save-payload equivalence; `RingkasanHarianCard` output equivalence | unit + component |

### 6. E2E with Playwright

**Decision**: Add Playwright (`@playwright/test`) with a `chromium`-only project (mobile-first app; desktop Chromium viewport is sufficient for the core flows, with a `390×844` mobile profile available). E2E runs against a built app (`vite preview`) + Supabase local, seeded with a known test user.

**Core journey** (the money scenario): login → `/` shows `pagi_pending` → `/pagi` → carry-over confirm → stepper masak baru → modal → "Selesai Input Pagi" → status `pagi_selesai` → `/malam` → opname sisa/rusak/konsumsi → uang laci → "Simpan & Kunci" → inline ringkasan, locked (no edit controls) → `/dashboard` → profit + selisih badge, 7/30-day toggle keeps data.

**Also covered**: validation failures (sisa+rusak > stok blocks save with red row), `uangLaci` empty blocks save, hari libur → "Buka Lagi" recovery, logout redirects to `/login`, logged-out deep-link to `/malam` redirects to `/login`.

### 7. README + CI

**Decision**: README §Testing documents `bun run test` (Vitest) for unit/component, `bun run test:unit`, `bun run test:component`, and `bun run test:e2e` (requiring `supabase start`), with a note that `bun test` is not supported. CI (GitHub Actions): a single job runs `bun install` + `type-check` + `vitest run` (unit + component) on every push/PR. E2E is kept local-only (no CI job), consistent with dropping the Supabase-dependent CI job.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| **Divergence between `engine.ts` and migrations not caught** | Unit tests pin the PRD example for `engine.ts`; E2E runs the full journey against real Postgres, so a divergent generated column/trigger fails loudly in `test:e2e`. |
| **Component tests become brittle due to deep mocking** | Mock at the service boundary (`@/lib/services/*`), not inside views; use realistic fixtures. Accept moderate brittleness for the 3 highest-value views only. |
| **E2E requires local Supabase + Docker → not hermetic** | E2E is local-only (manual), never a CI gate; the unit+component job stays hermetic and always runs. |
| **Slow test suite from many test users / sign-ups** | E2E reuses a single seeded user (`e2e/global-setup.ts`); no per-test sign-up churn. |
| **Playwright flakiness on mobile PWA** | Pin to Chromium; keep E2E journeys short and synchronous-dependent; add `expect` retries for network settle. |
| **`clean-code-refactor` merges first and invalidates payload fixtures** | Contract tests derive expected payloads from the `refactoring-contract` spec and are written to pass against both pre/post-refactor views (payload shape is unchanged by design). |

## Migration Plan

Not a runtime deployment — a test-infrastructure addition. Steps:
1. Add dev dependencies (`@vue/test-utils`, `happy-dom`, `@playwright/test`).
2. Split Vitest config into `unit`/`component` projects; move existing tests under the unit project (no edits to test bodies).
3. Add component tests; then Playwright config + E2E.
4. Update README; add CI workflow.
5. Regression catalog applied at each step (each archived fix gets its test alongside).

Rollback: each step is additive and independently revertible (remove config block / package / directory); no product code changes are introduced.

## Open Questions

- ~~Run integration + E2E in CI via Docker+`supabase start`, or keep them local-only initially?~~ **Resolved**: dropped the integration tier; E2E stays local-only.
- Playwright: Chromium-only now, or include the mobile viewport profile in the first pass?
- Should `bun run test` become the single "fast tier" command in `package.json` (`vitest run --project unit --project component`), with `test:unit`/`test:component`/`test:e2e` separate? Naming needs a decision during tasks.