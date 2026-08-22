# Dokumentasi Developer Warunk

> Indeks dokumentasi teknis untuk developer yang bekerja di codebase Warunk.
> Dokumen ini melengkapi [`../README.md`](../README.md) (overview & setup) dan [`../openspec/specs/`](../openspec/specs/) (perilaku tiap fitur).

## Falsafah: Backward Reconciliation

Warunk **bukan** POS. Ia tidak mencatat transaksi; ia **menghitung apa yang habis dikonsumsi** dengan membandingkan stok awal (pagi) dan stok akhir (malam) per lauk. Beban input digeser ke waktu senggang pemilik (pagi & malam) agar jam siang berjalan 100% tanpa aplikasi. Detail produk ada di [`../PRD.md`](../PRD.md).

## Daftar Dokumen

| Dokumen | Isi |
| --- | --- |
| [development.md](development.md) | Setup ulang, bootstrap, konvensi state, pola composable, **cara tambah fitur**, pitfall |
| [architecture.md](architecture.md) | Mental model + diagram alur (Mermaid): 3-fase, mutasi→invalidasi, session guard |
| [database.md](database.md) | Referensi skema DB (tabel, generated columns, trigger, VIEW, RLS) — grounded ke migrasi |
| [adr.md](adr.md) | Indeks keputusan desain — men-link ke `openspec/changes/archive/*` |

## Cara membaca diagram

Diagram ditulis dalam `mermaid`. Untuk melihatnya ter-render, buka di GitHub atau pasang ekstensi Mermaid di VS Code. Di editor plain, blok akan tampak sebagai teks — itu normal.
