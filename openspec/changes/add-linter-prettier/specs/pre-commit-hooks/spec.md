## ADDED Requirements

### Requirement: Husky pre-commit hook

The system SHALL configure husky to run a pre-commit hook that executes lint-staged.

#### Scenario: Pre-commit hook is installed

- **WHEN** developer runs `bun install`
- **THEN** husky installs the pre-commit hook in `.git/hooks/pre-commit`

### Requirement: lint-staged runs ESLint and Prettier on staged files

The system SHALL configure lint-staged to run ESLint fix and Prettier on staged `.ts` and `.vue` files.

#### Scenario: Staged .vue file is linted and formatted

- **WHEN** developer stages a `.vue` file and runs `git commit`
- **THEN** lint-staged runs ESLint fix and Prettier on that file only

#### Scenario: Staged .ts file is linted and formatted

- **WHEN** developer stages a `.ts` file and runs `git commit`
- **THEN** lint-staged runs ESLint fix and Prettier on that file only

#### Scenario: Non-source files are not processed

- **WHEN** developer stages a `.md` file and runs `git commit`
- **THEN** lint-staged does not run ESLint or Prettier on it

### Requirement: .git-blame-ignore-revs

The system SHALL provide a `.git-blame-ignore-revs` file containing the hash of the initial formatting commit.

#### Scenario: git blame skips formatting commit

- **WHEN** developer runs `git blame` on any file
- **THEN** the formatting commit is skipped in the blame output
