## 1. Shared Query Config

- [x] 1.1 Create `src/lib/queryConfig.ts` with `QUERY_DEFAULTS` constant (`staleTime: 5 * 60 * 1000`, `refetchOnWindowFocus: false`)
- [x] 1.2 Update `useMasterLauk.ts` to import and spread `QUERY_DEFAULTS` instead of inline values
- [x] 1.3 Update `useHariIni.ts` to import and spread `QUERY_DEFAULTS`
- [x] 1.4 Update `useStatusHari.ts` to import and spread `QUERY_DEFAULTS`
- [x] 1.5 Update `usePengaturan.ts` to import and spread `QUERY_DEFAULTS`
- [x] 1.6 Run `vue-tsc --noEmit` to verify type-check passes

## 2. Standardize Composable Returns

- [x] 2.1 Refactor `usePengaturan.ts` to wrap `data`, `isLoading`, `error` in computed (match `useHariIni` pattern)
- [x] 2.2 Verify `PengaturanView.vue` still works (accesses `.value` correctly)
- [x] 2.3 Verify `InputMalamView.vue` still works (accesses `data`, `isLoading`)
- [x] 2.4 Verify `DashboardView.vue` still works (accesses `data`)
- [x] 2.5 Run `vue-tsc --noEmit` to verify type-check passes

## 3. Create `useDetailRows` Composable

- [x] 3.1 Create `src/composables/useDetailRows.ts` with `RowDetail` type (superset of `RowPagi` + `RowMalam`)
- [x] 3.2 Implement `initRows()` that maps `DetailStokLengkap[] → RowDetail[]` (always populates all fields including `sisaLayak`, `rusakMalam`, `konsumsi`)
- [x] 3.3 Implement `toItemKalkulasi(row: RowDetail): ItemKalkulasi` that maps row fields to engine input
- [x] 3.4 Wire up `useMasterLauk`, `useHariStore`, `useHariIni` internally
- [x] 3.5 Implement the watch-on-detail + `initialized` flag pattern
- [x] 3.6 Export `rows`, `hariError`, `laukLoading`, `toItemKalkulasi`, `resetInitialized`
- [x] 3.7 Run `vue-tsc --noEmit` to verify the composable compiles

## 4. Refactor `InputPagiView.vue` to Use `useDetailRows`

- [x] 4.1 Remove `RowPagi` interface, `initRows()`, `itemKalkulasi()`, and boilerplate setup
- [x] 4.2 Import and use `useDetailRows(tanggal, laukAktif)` 
- [x] 4.3 Update `tandaiLayak` / `tandaiBasi` to work with `RowDetail` type
- [x] 4.4 Update `simpan()` to use `toItemKalkulasi` from the composable
- [x] 4.5 Verify template bindings still reference correct `row.*` properties
- [x] 4.6 Run `vue-tsc --noEmit` — zero errors
- [x] 4.7 Run `vitest run` — all 22 tests pass

## 5. Refactor `InputMalamView.vue` to Use `useDetailRows`

- [x] 5.1 Remove `RowMalam` interface, `initRows()`, `itemKalkulasi()`, and boilerplate setup
- [x] 5.2 Import and use `useDetailRows(tanggal, laukAktif)`
- [x] 5.3 Update `stokAktif()`, `validRow()`, `semuaValid` to use `toItemKalkulasi` from composable
- [x] 5.4 Update `simpan()` to use `toItemKalkulasi` from the composable
- [x] 5.5 Verify template bindings still reference correct `row.*` properties
- [x] 5.6 Run `vue-tsc --noEmit` — zero errors
- [x] 5.7 Run `vitest run` — all 22 tests pass

## 6. Create `RingkasanHarianCard` Component

- [x] 6.1 Create `src/components/RingkasanHarianCard.vue` with props: `pendapatan`, `uangDigital?`, `hppNyata`, `kerugian`, `profit`, `uangLaci`, `modalKembalian`, `selisihKas`, `showDigital?`
- [x] 6.2 Implement the card template with computed color classes for selisih
- [x] 6.3 Run `vue-tsc --noEmit` — zero errors

## 7. Integrate `RingkasanHarianCard` in Views

- [x] 7.1 Replace locked-state ringkasan in `InputMalamView.vue:189-230` with `<RingkasanHarianCard>`
- [x] 7.2 Replace live-state ringkasan in `InputMalamView.vue:263-304` with `<RingkasanHarianCard>`
- [x] 7.3 Replace ringkasan in `DashboardView.vue:169-199` with `<RingkasanHarianCard>`
- [x] 7.4 Run `vue-tsc --noEmit` — zero errors
- [x] 7.5 Verify all 3 card instances render correctly (manual or test)

## 8. Final Verification

- [x] 8.1 Run `vue-tsc --noEmit` — full type-check passes
- [x] 8.2 Run `vitest run` — all 22 tests pass
- [x] 8.3 Verify `InputPagiView.vue` line count reduced (target: ~180 lines, down from 244)
- [x] 8.4 Verify `InputMalamView.vue` line count reduced (target: ~320 lines, down from 420)
- [x] 8.5 Verify no `as unknown as` casts introduced in new code
- [x] 8.6 Verify `DetailPagiInput` and `DetailMalamInput` save payloads are structurally identical to pre-refactoring
