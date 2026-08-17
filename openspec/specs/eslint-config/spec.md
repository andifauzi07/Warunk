# ESLint Config

## Purpose

ESLint flat config for TypeScript + Vue 3 project code quality enforcement.

## Requirements

### Requirement: ESLint flat config for TypeScript + Vue 3

The system SHALL provide an `eslint.config.js` file using ESLint flat config format with TypeScript and Vue 3 support.

#### Scenario: ESLint config exists and is valid

- **WHEN** developer runs `npx eslint --print-config src/main.ts`
- **THEN** system returns valid ESLint configuration with TypeScript and Vue rules applied

#### Scenario: Unused variables are caught as errors

- **WHEN** a TypeScript or Vue file contains an unused variable
- **THEN** ESLint reports an error

#### Scenario: console.log is caught as warning

- **WHEN** a source file (not test files) contains `console.log`
- **THEN** ESLint reports a warning

#### Scenario: var keyword is caught as error

- **WHEN** a file uses `var` instead of `const` or `let`
- **THEN** ESLint reports an error

### Requirement: ESLint ignores build artifacts

The system SHALL configure ESLint to ignore `dist/`, `node_modules/`, and other build artifacts.

#### Scenario: dist folder is not linted

- **WHEN** ESLint runs on the project
- **THEN** files in `dist/` are not checked

### Requirement: ESLint script in package.json

The system SHALL provide `lint` and `lint:fix` scripts in `package.json`.

#### Scenario: lint script checks all files

- **WHEN** developer runs `bun run lint`
- **THEN** ESLint checks all source files without auto-fixing

#### Scenario: lint:fix script auto-fixes issues

- **WHEN** developer runs `bun run lint:fix`
- **THEN** ESLint checks and auto-fixes all fixable issues
