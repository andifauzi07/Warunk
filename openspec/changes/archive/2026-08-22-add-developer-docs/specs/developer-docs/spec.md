## ADDED Requirements

### Requirement: Developer Documentation Folder

Repositori SHALL menyediakan folder `docs/` yang berisi dokumentasi onboarding developer dengan tepat lima berkas: `docs/README.md` (indeks navigasi + falsafah *backward reconciliation*), `docs/development.md` (getting started, bootstrap order, konvensi state Pinia vs TanStack, pola composable, walkthrough cara tambah fitur, dan daftar pitfall), `docs/architecture.md` (mental model + diagram alur), `docs/database.md` (referensi skema ter-grounded ke migrasi Supabase), dan `docs/adr.md` (indeks keputusan desain). Dokumentasi SHALL melengkapi — bukan mengganti — README dan OpenSpec spec, serta men-link ke sumber kebenaran ketimbang mencopasnya.

#### Scenario: Kelima berkas docs tersedia

- **WHEN** developer membuka folder `docs/` setelah change ini di-archive
- **THEN** kelima berkas (`README.md`, `development.md`, `architecture.md`, `database.md`, `adr.md`) ada dan README mereferensikan keempat berkas lainnya

#### Scenario: Docs tidak menduplikasi README

- **WHEN** developer membaca `docs/development.md` atau `docs/architecture.md`
- **THEN** bagian arsitektur/setup yang sudah ada di README hanya di-link, tidak ditulis ulang secara penuh

### Requirement: Architecture Diagrams in Mermaid

`docs/architecture.md` SHALL menyajikan alur sistem dalam diagram `mermaid` yang dapat di-render oleh GitHub dan ekstensi VS Code, mencakup minimal: alur tiga fase (pagi→siang→malam→dashboard dengan carry-over), urutan mutasi→invalidasi→refetch (berdasar `useHariIni.ts`), dan session guard (`router.beforeEach` → `waitForSession()` → `arahkanKe()`), serta tabel state ownership (Pinia vs TanStack).

#### Scenario: Diagram alur mutasi ter-render

- **WHEN** `docs/architecture.md` dibuka di GitHub atau VS Code dengan preview Mermaid
- **THEN** blok `mermaid sequenceDiagram` untuk mutasi→invalidasi→refetch ditampilkan sebagai diagram, bukan teks mentah

#### Scenario: State ownership terpetakan

- **WHEN** developer membaca bagian state ownership
- **THEN** tabel menjelaskan tiap state (auth, tanggal aktif, master lauk, rekonsiliasi hari ini, ringkasan/tren/ranking) beserta tempat penyimpanannya (Pinia vs TanStack) dan kapan di-invalidate

### Requirement: ADR Index Links to Archive

`docs/adr.md` SHALL menyediakan indeks keputusan desain yang men-link ke `openspec/changes/archive/*/design.md` ketimbang mencopas isinya, agar sumber kebenaran keputusan tetap tunggal di archive. Indeks SHALL mencakup minimal: float di-snapshot per hari, kunci final `malam_selesai`, HPP estimasi sebagai fallback, pembayaran digital masuk selisih kas, pemisahan TanStack + Pinia, dan penolakan POS konvensional.

#### Scenario: ADR men-link bukan mencopas

- **WHEN** developer membuka `docs/adr.md` dan mengeklik salah satu keputusan
- **THEN** tautan mengarah ke `openspec/changes/archive/<nama>/design.md` yang relevan, dan `adr.md` sendiri hanya berisi satu kalimat alasan per keputusan

#### Scenario: Keputusan kunci tercakup

- **WHEN** developer membutuhkan rasional di balik snapshot float atau kunci final
- **THEN** `adr.md` menyediakan entri + link ke archive yang menjelaskannya
