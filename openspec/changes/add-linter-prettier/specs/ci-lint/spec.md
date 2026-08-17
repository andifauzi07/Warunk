## ADDED Requirements

### Requirement: Lint job in CI pipeline

The system SHALL add a `lint` job to `.github/workflows/ci.yml` that runs ESLint on all files.

#### Scenario: Lint job runs on push to main

- **WHEN** developer pushes to `main` branch
- **THEN** GitHub Actions runs the `lint` job

#### Scenario: Lint job runs on pull request

- **WHEN** a pull request is created
- **THEN** GitHub Actions runs the `lint` job

#### Scenario: Lint job fails on ESLint errors

- **WHEN** ESLint finds errors in any source file
- **THEN** the `lint` job fails and blocks the pipeline

### Requirement: Unit-component tests depend on lint

The system SHALL configure `unit-component` job to depend on `lint` job.

#### Scenario: Tests run after lint passes

- **WHEN** lint job succeeds
- **THEN** `unit-component` job runs

#### Scenario: Tests are skipped when lint fails

- **WHEN** lint job fails
- **THEN** `unit-component` job is skipped
