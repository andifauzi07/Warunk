## Context

The Warunk app has two input views — `InputPagiView` (244 lines) and `InputMalamView` (420 lines) — that share nearly identical setup code for mapping database rows to local state. Both define similar interfaces (`RowPagi` / `RowMalam`), identical `initRows()` functions, and similar `itemKalkulasi()` converters. The "Ringkasan Hari Ini" card template is also copy-pasted 3 times (twice in malam view, once in dashboard). The codebase also has inconsistent composable return patterns and duplicated query configuration.

Current architecture:
```
views/         → 7 views (two are 300+ lines)
composables/   → 6 composables (inconsistent return shapes)
lib/services/  → 4 Supabase service modules
lib/engine.ts  → Pure calculation functions (well-tested)
```

## Goals / Non-Goals

**Goals:**
- Extract shared row-mapping logic into a single `useDetailRows` composable
- Extract the repeated "Ringkasan Hari Ini" card into a shared component
- Centralize repeated query config (`staleTime`, `refetchOnWindowFocus`)
- Standardize composable return shapes for consistency
- Preserve identical data flow, UI output, and save payloads — zero behavioral change

**Non-Goals:**
- Changing any business logic or calculation (engine.ts is untouched)
- Changing the Supabase service layer or database schema
- Adding new features or UI elements
- Breaking down views into smaller components beyond the two extractions above
- Adding barrel exports (low-value, can be done separately)

## Decisions

### 1. `useDetailRows` composable design

**Decision**: Create a single composable that returns `RowDetail` (always includes all fields: `sisaLayak`, `rusakMalam`, `konsumsi`), with a `toItemKalkulasi()` function that always populates all fields from the DB row.

**Rationale**: The pagi view's `itemKalkulasi()` hardcodes `porsi_sisa_layak_jual: 0`, `porsi_rusak_malam: 0`, `porsi_konsumsi: 0`. These values are never read by `hppBaruPorsi()` (the only engine function called in the pagi save path). So the hardcoded zeros are functionally equivalent to using real values from the DB row (which are 0 for fresh pagi rows). Using real values eliminates the need for a `source` parameter or mode flag.

**Alternative considered**: A `source: 'pagi' | 'malam'` parameter that controls which fields are populated. Rejected because it adds complexity without behavioral difference — the pagi save only reads `hppBaruPorsi()` from the ItemKalkulasi, and that function doesn't use the 3 zeroed fields.

**Shape**:
```typescript
// src/composables/useDetailRows.ts
export function useDetailRows(tanggal: Ref<string>, laukAktif: Ref<MasterLauk[]>) {
  // ... internal: useMasterLauk, useHariStore, useHariIni, rows ref, watch, initRows
  return {
    rows,              // Ref<RowDetail[]>
    hariError,         // ComputedRef<string>
    laukLoading,       // boolean
    toItemKalkulasi,   // (row: RowDetail) => ItemKalkulasi
    resetInitialized,  // () => void  — called after successful save
  }
}
```

### 2. `RingkasanHarianCard` component design

**Decision**: A props-driven component that accepts all financial fields as individual props, with computed color classes for selisih.

**Rationale**: The 3 card instances read from different sources (`rek?`, `agregat`, `ringkasan`) but display the same structure. Props decouple the component from any specific data source.

**Shape**:
```typescript
// src/components/RingkasanHarianCard.vue
interface Props {
  pendapatan: number
  uangDigital?: number
  hppNyata: number
  kerugian: number
  profit: number
  uangLaci: number
  modalKembalian: number
  selisihKas: number
  showDigital?: boolean  // toggle "dari digital" / "tunai" rows
}
```

### 3. Centralize query config

**Decision**: Create a shared `QUERY_DEFAULTS` object in a new `src/lib/queryConfig.ts` file.

```typescript
export const QUERY_DEFAULTS = {
  staleTime: 5 * 60 * 1000,          // 5 minutes
  refetchOnWindowFocus: false,
} as const
```

**Rationale**: 4 composables repeat `staleTime: 5 * 60 * 1000`. Two also set `refetchOnWindowFocus: false` while two don't — making behavior inconsistent. A shared constant fixes both issues.

### 4. Standardize composable returns

**Decision**: All composables should return computed-wrapped refs for `data`, `isLoading`, and `error` — matching the pattern in `useHariIni`.

**Rationale**: `usePengaturan` returns `q.data` directly (a `Ref<Ref<...>>` double-wrap), while `useHariIni` returns `computed(() => q.data.value?.x ?? null)`. The latter is cleaner for consumers. Aligning on one pattern reduces cognitive load.

**Change**: `usePengaturan` and `useMasterLauk` will wrap their returns in computed. `useAnalitik` already returns raw query objects but is only consumed internally — its shape stays as-is since it's not a public-facing composable.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| **Mapping error in `useDetailRows`** — wrong field name silently breaks UI | Type-check (`vue-tsc`), existing 22 tests, new test for `toItemKalkulasi` equivalence |
| **Pagi save payload changes** — accidentally including `sisaLayak`/`rusakMalam`/`konsumsi` in `DetailPagiInput` | The save mapping in `InputPagiView.simpan()` stays in the view, not in the composable. Only `toItemKalkulasi()` moves. |
| **Dashboard ringkasan card reads different data shape** | Props-based design means each caller passes its own values — no assumption about data source |
| **Composable return change breaks existing consumers** | `usePengaturan` is consumed in `PengaturanView`, `InputMalamView`, `DashboardView` — all use `.value` access which works with both raw Ref and computed |
