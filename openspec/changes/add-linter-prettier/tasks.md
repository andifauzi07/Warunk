## 1. Install Dependencies

- [x] 1.1 Install ESLint packages: `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-vue`, `eslint-config-prettier`
- [x] 1.2 Install Prettier packages: `prettier`, `prettier-plugin-tailwindcss`
- [x] 1.3 Install pre-commit hook packages: `husky`, `lint-staged`

## 2. ESLint Configuration

- [x] 2.1 Create `eslint.config.js` with flat config format, TypeScript + Vue 3 rules
- [x] 2.2 Configure ESLint ignores for `dist/`, `node_modules/`, `*.d.ts`
- [x] 2.3 Add `lint` and `lint:fix` scripts to `package.json`
- [x] 2.4 Verify `bun run lint` runs without config errors

## 3. Prettier Configuration

- [x] 3.1 Create `.prettierrc` with single quotes, semicolons, 2-space indentation, trailing commas
- [x] 3.2 Create `.prettierignore` for `dist/`, `node_modules/`, `*.md`
- [x] 3.3 Add `format` script to `package.json`
- [x] 3.4 Verify `bun run format` runs without config errors

## 4. Pre-commit Hooks

- [x] 4.1 Initialize husky with `bunx husky init`
- [x] 4.2 Configure `.husky/pre-commit` to run `bunx lint-staged`
- [x] 4.3 Add lint-staged config to `package.json`: run ESLint fix + Prettier on `*.{ts,vue}` files
- [x] 4.4 Test pre-commit hook with a sample commit

## 5. Initial Formatting

- [x] 5.1 Run `bun run format` to format all files with Prettier
- [x] 5.2 Run `bun run lint:fix` to auto-fix ESLint issues
- [x] 5.3 Review changes and ensure no unexpected modifications
- [x] 5.4 Get commit hash from `git log --oneline -1` after committing formatting changes
- [x] 5.5 Create `.git-blame-ignore-revs` with the formatting commit hash

## 6. CI Integration

- [x] 6.1 Add `lint` job to `.github/workflows/ci.yml` (checkout + setup-bun + install + lint)
- [x] 6.2 Add `needs: lint` dependency to `unit-component` job
- [x] 6.3 Verify CI configuration is valid YAML

## 7. Verification

- [x] 7.1 Run `bun run lint` — should pass with no errors
- [x] 7.2 Run `bun run format --check` — should report no files need formatting
- [x] 7.3 Run `bun run type-check` — should still pass
- [x] 7.4 Run `bun run test` — should still pass
- [x] 7.5 Commit `.git-blame-ignore-revs` and run `git config blame.ignoreRevsFile .git-blame-ignore-revs`
