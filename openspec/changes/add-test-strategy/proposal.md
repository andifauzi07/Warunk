## Why

The app has two sources of truth for the same reconciliation math — the pure `engine.ts` (live UI feedback) and the authoritative PostgreSQL generated columns + trigger — yet only the frontend side is tested. The current 22 unit tests cover pure logic only; there are zero component or E2E tests, so a silent divergence between `engine.ts` and the migrations could ship as a business bug. The README also documents `bun test` as the test command, which is broken (`bun`'s runner ignores `vitest.config.ts` aliases and fails to resolve `@/lib/supabase`).

## What Changes

- **Fix the documented test command**: README §Testing will instruct `bun run test` (Vitest) instead of the broken `bun test`.
- **Add component tests** (`@vue/test-utils` + happy-dom) for `Stepper`, `RingkasanHarianCard`, and view-level behaviors: validation gating in Input Pagi/Malam, mode transitions (input/review/locked), and the non-blocking 7↔30 day range switch on the dashboard.
- **Add end-to-end tests** (Playwright) covering the full day cycle: login → input pagi → input malam → lock → dashboard, plus session-navigation redirects. E2E runs against the real Postgres (Supabase local), so the migration behaviors (generated columns, trigger lock, RLS) are verified end-to-end rather than via a dedicated DB test tier.
- **Turn archived fixes into permanent regression tests**: each `openspec/changes/archive/*` fix gets a regression test at the appropriate layer (session race, dashboard loading flash, save-payload shape).
- **Wire the `clean-code-refactor` behavioral contract to tests**: the `refactoring-contract` spec's save-payload and UI-output equivalence scenarios will be asserted by tests, not just manual verification.
- **Add a CI workflow** (GitHub Actions) running type-check + vitest on every push/PR.

## Capabilities

### New Capabilities

- `automated-testing`: defines the tiered testing strategy for the project — unit, component, E2E, and regression coverage requirements, the test runner/commands, and the CI gate. This is the only new capability; it verifies behavior, it does not change any existing product behavior.

### Modified Capabilities

None — no existing spec requirement changes. All requirements in `openspec/specs/*` remain unchanged; this change only adds verification of them.

## Impact

- **Dependencies added** (dev): `@vue/test-utils`, `happy-dom`, `@playwright/test`.
- **Config**: `vitest.config.ts` gains a component-test environment (happy-dom); Playwright config added.
- **New directories**: `src/__tests__/component/`, `e2e/`.
- **Files modified**: `README.md` (testing instructions), `vitest.config.ts`, `.github/workflows/` (new CI), possibly `package.json` (test scripts).
- **External services**: Supabase local (`supabase start`) required for E2E tests; test user seeded.
- **No API / schema / product-behavior changes**: migrations, save payloads, and UI output are untouched.