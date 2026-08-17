## ADDED Requirements

### Requirement: Prettier config matches existing style

The system SHALL provide a `.prettierrc` configuration that matches the existing code conventions: single quotes, semicolons, 2-space indentation, trailing commas.

#### Scenario: Prettier config is valid

- **WHEN** developer runs `npx prettier --check src/main.ts`
- **THEN** Prettier runs without config errors

#### Scenario: Single quotes are enforced

- **WHEN** a file uses double quotes
- **THEN** Prettier formats them to single quotes

### Requirement: Prettier ignores non-source files

The system SHALL provide a `.prettierignore` file excluding `dist/`, `node_modules/`, and other build artifacts.

#### Scenario: dist folder is not formatted

- **WHEN** Prettier runs on the project
- **THEN** files in `dist/` are not formatted

### Requirement: Prettier format script in package.json

The system SHALL provide a `format` script in `package.json`.

#### Scenario: format script formats all files

- **WHEN** developer runs `bun run format`
- **THEN** Prettier formats all source files in the project
