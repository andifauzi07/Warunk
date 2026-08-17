# Refactoring Contract

## Purpose

Documents invariant contracts that MUST hold true during and after refactoring. This is a pure refactoring spec with no user-facing behavior changes.

## Requirements

### Requirement: Save Payload Equivalence

The refactored code SHALL produce identical save payloads to the pre-refactoring code for both pagi and malam flows.

#### Scenario: Pagi save payload unchanged

- **WHEN** user saves input pagi with carry-over 5, basi 1, masak baru 10, modal 70000
- **THEN** the `DetailPagiInput` sent to `svc.simpanPagi()` contains exactly: `{ id, lauk_id, porsi_carry_over: 5, hpp_carry_over_porsi, porsi_basi_pagi: 1, porsi_baru_dimasak: 10, modal_baru_total: 70000, hpp_baru_porsi }` — no additional fields

#### Scenario: Malam save payload unchanged

- **WHEN** user saves input malam with sisa layak 3, rusak 1, konsumsi 2
- **THEN** the `DetailMalamInput` sent to `svc.simpanMalam()` contains exactly the same fields as before refactoring, including `porsi_sisa_layak_jual: 3, porsi_rusak_malam: 1, porsi_konsumsi: 2`

### Requirement: UI Output Equivalence

The refactored views SHALL render identical UI for all states: loading, empty, input mode, review mode, locked mode.

#### Scenario: Ringkasan card displays same values

- **WHEN** user views the "Ringkasan Hari Ini" card after saving malam
- **THEN** the card shows identical values for pendapatan, HPP, kerugian, profit, selisih as the pre-refactoring version
