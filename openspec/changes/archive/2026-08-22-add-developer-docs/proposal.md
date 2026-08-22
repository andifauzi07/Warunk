## Why

Warunk sudah punya README (overview, arsitektur box, setup, skema ringkas) dan 21 OpenSpec spec yang mendokumentasikan *perilaku* tiap fitur. Namun untuk developer yang baru masuk (termasuk pemilik di masa depan), masih ada celah besar:

- **Tidak ada panduan "cara kerja di sini"** — setup sudah ada di README, tapi konvensi state (kapan Pinia vs TanStack), pola composable, dan *cara tambah fitur end-to-end* tersebar & tidak pernah disatukan.
- **Tidak ada diagram alur (sequence/flow)** — README cuma punya box arsitektur statis. Urutan mutasi → invalidasi → refetch, session guard, dan 3-fase data flow tidak pernah digambar, padahal itu krusial untuk memahami codebase.
- **Tidak ada referensi DB kolom-demi-kolom** — README merangkum skema, tapi tidak mencantumkan SQL asli (trigger `hitung_agregat_rekonsiliasi`, guard `status <> 'malam_selesai'`, VIEW `ringkasan_harian`, 4 policy RLS).
- **Keputusan desain (ADR) terpendam di `changes/archive/*`** — 16 change berisi rationale penting (float snapshot, kunci final, HPP estimasi fallback) tapi tidak ada indeks terpusat yang men-link-nya.

Dokumentasi ini ditujukan untuk **onboarding developer**, bukan pengganti OpenSpec (yang menjawab "fitur harus berperilaku bagaimana") maupun README (yang menjawab "apa & setup").

## What Changes

Menambahkan folder `docs/` berisi 5 dokumen naratif + diagram (Mermaid):

- `docs/README.md` — indeks navigasi & satu paragraf falsafah *backward reconciliation*.
- `docs/development.md` — getting started, bootstrap order (`main.ts`), konvensi state (Pinia vs TanStack), pola composable (`useHariIni.ts`), **walkthrough cara tambah fitur** (spec → service → composable → view → test), dan daftar pitfall (`bun test` tidak didukung, race session, 403 simpan pagi).
- `docs/architecture.md` — mental model + 4 diagram Mermaid: layered (link README), 3-fase flow, mutasi→invalidasi→refetch, session guard, state ownership map.
- `docs/database.md` — referensi skema grounded ke `supabase/migrations/`: 4 tabel, generated columns, trigger + VIEW, RLS, check constraints.
- `docs/adr.md` — indeks keputusan desain yang **men-link** ke `openspec/changes/archive/*` (tidak menduplikasi isi).

Prinsip: `docs/` **men-link** ke README/OpenSpec/migrasi, tidak mencopas. README § "Spec-Driven Development" dan § "Arsitektur Teknis" tetap jadi sumber, `docs/` melengkapi dengan alur & cara kerja.

## Capabilities

### New Capabilities

- `developer-docs`: dokumentasi onboarding developer (`docs/`) yang melengkapi README & OpenSpec — folder, diagram Mermaid, dan indeks ADR yang men-link ke archive.

### Modified Capabilities

- (tidak ada — tidak mengubah spesifikasi perilaku fitur aplikasi manapun)

## Impact

- Baru: `docs/README.md`, `docs/development.md`, `docs/architecture.md`, `docs/database.md`, `docs/adr.md`.
- Diubah: `README.md` — tambahkan satu baris di Daftar Isi yang men-link ke `docs/README.md` (pointer, bukan duplikasi).
- Tidak ada perubahan kode (`src/`), migrasi, atau spesifikasi perilaku.
- Risiko: dokumentasi bisa usang — mitigasi via `docs/adr.md` yang men-link (bukan copas) agar sumber kebenaran tetap di code/OpenSpec.
