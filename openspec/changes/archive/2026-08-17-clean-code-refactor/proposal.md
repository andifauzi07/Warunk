## Why

`InputPagiView` and `InputMalamView` share ~80 lines of nearly identical code (interface definitions, `initRows()` mapping, `itemKalkulasi()` conversion, composable setup boilerplate). This duplication means every bug fix or feature change must be applied twice, and new contributors must mentally diff two files to understand which logic is shared and which is unique. The "Ringkasan Hari Ini" card is also copy-pasted 3 times across views. This refactoring extracts shared logic into composable and component primitives, making the codebase easier to onboard into and maintain.

## What Changes

- **Extract `useDetailRows` composable** — Consolidates the shared setup between `InputPagiView` and `InputMalamView`: the `RowDetail` type (superset of both row types), `initRows()` mapping from `DetailStokLengkap`, `toItemKalkulasi()` conversion, the watch-on-detail pattern, and the composable wiring (`useMasterLauk` + `useHariStore` + `useHariIni`).
- **Extract `RingkasanHarianCard` component** — Replaces the 3 duplicate "Ringkasan Hari Ini" card templates in `InputMalamView` (locked + live) and `DashboardView` with a single props-driven component.
- **Centralize query config** — Replace the 4× repeated `staleTime: 5 * 60 * 1000` with a shared constant. Standardize `refetchOnWindowFocus` across all composables.
- **Standardize composable return shapes** — Align `usePengaturan` and `useAnalitik` to use computed wrappers like `useHariIni` does, instead of exposing raw query objects.

## Capabilities

### New Capabilities

None — this is a pure refactoring. No new user-facing behavior is introduced.

### Modified Capabilities

None — all existing spec requirements remain unchanged. The refactoring preserves identical data flow, UI output, and save payloads.

## Impact

- **Files modified**: `InputPagiView.vue`, `InputMalamView.vue`, `DashboardView.vue`, `useMasterLauk.ts`, `useHariIni.ts`, `useStatusHari.ts`, `usePengaturan.ts`, `useAnalitik.ts`
- **Files created**: `useDetailRows.ts` (composable), `RingkasanHarianCard.vue` (component), shared query config constant
- **No API changes**: Save payloads (`DetailPagiInput`, `DetailMalamInput`) are unchanged
- **No dependency changes**: No new packages added
- **Risk**: Mapping errors in the new composable could silently break data display. Mitigated by: (1) existing 22 unit tests pass, (2) `vue-tsc` type-check, (3) new targeted tests for `toItemKalkulasi` equivalence
