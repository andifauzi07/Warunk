## Why

Proyek Warunk belum memiliki linter atau formatter. Style kode dijaga secara manual dan konsisten berkat disiplin tim, tetapi tidak ada enforcement otomatis. Tanpa linter, error-prone patterns (unused variables, implicit any, console.log di production) bisa lolos ke main branch. Tanpa formatter, style bisa perlahan divergen seiring bertambahnya contributor atau files.

## What Changes

- Tambahkan **ESLint** dengan flat config untuk linting rules (TypeScript + Vue 3)
- Tambahkan **Prettier** untuk auto-formatting style (quotes, semicolons, spacing)
- Tambahkan **lint-staged + husky** sebagai pre-commit hook agar hanya file yang di-stage yang di-lint/format
- Tambahkan **`.git-blame-ignore-revs`** agar commit formatting besar tidak mengganggu `git blame`
- Tambahkan **script `lint`, `lint:fix`, dan `format`** ke `package.json`
- Tambahkan **lint job** ke GitHub Actions CI sebagai quality gate sebelum test dan auto-merge

## Capabilities

### New Capabilities

- `eslint-config`: Konfigurasi ESLint flat config dengan rules TypeScript, Vue 3, dan stylistic
- `prettier-config`: Konfigurasi Prettier yang selaras dengan style yang sudah ada
- `pre-commit-hooks`: Setup husky + lint-staged untuk linting otomatis saat commit
- `ci-lint`: Integrasi linting ke pipeline GitHub Actions CI

### Modified Capabilities

<!-- Tidak ada capability yang diubah -->

## Impact

- **Dependencies baru (devDependencies):** `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-vue`, `eslint-config-prettier`, `prettier`, `prettier-plugin-tailwindcss`, `husky`, `lint-staged`
- **Config files baru:** `eslint.config.js`, `.prettierrc`, `.prettierignore`, `.husky/pre-commit`, `.git-blame-ignore-revs`
- **package.json:** Tambahan scripts (`lint`, `lint:fix`, `format`, `prepare`)
- **GitHub Actions:** `.github/workflows/ci.yml` ditambah lint job
- **Git history:** 1 commit formatting besar di awal (dijaga dengan `.git-blame-ignore-revs`)
