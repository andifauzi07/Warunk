## Context

Proyek Warunk adalah Vue 3 + TypeScript + Vite 8, menggunakan Tailwind CSS v4, Pinia (setup function syntax), TanStack Vue Query, dan Supabase. Semua komponen menggunakan `<script setup lang="ts">` dengan Composition API. Kode sudah konsisten secara manual: single quotes, semicolons, 2-space indentation, trailing commas, PascalCase untuk components/views, `use` prefix untuk composables/stores.

Saat ini belum ada linter/formatter. Pipeline CI hanya menjalankan type-check dan unit/component tests.

## Goals / Non-Goals

**Goals:**

- Enforce style dan quality rules secara otomatis
- Mencegah error-prone patterns (unused vars, console.log, implicit any)
- Auto-format code saat commit melalui pre-commit hooks
- Jaga git blame tetap bersih setelah formatting pertama
- Integrasi linting ke CI sebagai quality gate

**Non-Goals:**

- Auto-fix semua kode yang ada saat pemasangan (hanya file baru/di-stage)
- Mengubah coding style yang sudah ada
- Menambahkan rules yang bertentangan dengan style saat ini
- Auto-import sorting

## Decisions

### 1. ESLint Flat Config (bukan eslintrc)

**Pilihan:** `eslint.config.js` (flat config format)

**Alasan:** ESLint 9+ sudah deprecated legacy config. Flat config adalah standar baru, lebih eksplisit, dan kompatibel dengan TypeScript. Project ini sudah pakai ESM (`"type": "module"`) dan Node 22+.

**Alternatif:** `eslintrc` — deprecated, akan dihapus di ESLint 10.

### 2. ESLint + Prettier (bukan ESLint saja)

**Pilihan:** Gabungan ESLint + Prettier dengan `eslint-config-prettier` untuk mematikan rules yang konflik.

**Alasan:** Prettier memberikan formatting yang lebih konsisten dan sempurna daripada ESLint stylistic rules (line wrapping, template formatting, Vue SFC spacing). `eslint-config-prettier` memastikan tidak ada konflik antara kedua tools.

**Alternatif:** ESLint stylistic rules saja — kurang konsisten untuk hal-hal kecil seperti line wrapping.

### 3. lint-staged + husky (bukan full run di CI saja)

**Pilihan:** Pre-commit hooks via lint-staged + husky, ditambah lint job di CI.

**Alasan:** lint-staged hanya lint/format file yang di-stage → lebih cepat. Husky memastikan hooks berjalan. CI sebagai safety net jika hooks di-bypass.

### 4. .git-blame-ignore-revs untuk formatting commit

**Pilihan:** Commit formatting pertama didaftarkan di `.git-blame-ignore-revs`.

**Alasan:** Satu commit formatting besar akan mengubah banyak baris. File ini memastikan `git blame` melewati commit tersebut. Konfigurasi global via `git config blame.ignoreRevsFile` agar berlaku otomatis.

### 5. Script terpisah: lint vs lint:fix vs format

**Pilihan:**

- `lint` — `eslint .` (check only, untuk CI)
- `lint:fix` — `eslint . --fix` (auto-fix, untuk development)
- `format` — `prettier --write .` (format semua file)

**Alasan:** CI harus gagal jika ada error, bukan auto-fix. Developer perlu command terpisah untuk fix lokal.

### 6. CI: lint sebagai gate pertama

**Pilihan:** Lint job berjalan duluan, `unit-component` depends on lint.

**Alasan:** Jika lint gagal, tidak perlu menjalankan test yang lebih lama. Menghemat waktu CI.

## Risks / Trade-offs

- **[Formatting commit besar]** → Mitigasi: `.git-blame-ignore-revs` + konfigurasi global
- **[False positive dari new rules]** → Mitigasi: Mulai dengan rules yang sesuai existing code, disable rules yang konflik
- **[Developer friction]** → Mitigasi: lint-staged auto-fix saat commit, developer tidak perlu run manual
- **[Dependencies tambahan]** → Trade-off: 10+ devDependencies baru, tetapi ini standard tooling untuk Vue 3 projects
