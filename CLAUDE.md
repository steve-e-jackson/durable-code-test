- Don't run tests locally, always used docker or make
- Run all linting via make targets don't call linting directly.
- Always prefer makefile targets for terraform operations.
# Trigger CI rebuild - logging fixes applied
- Never create anything, not one single thing, on the main branch.
- Nevery bypass or skip pre commit hooks. They must be made to pass.
- When creating a PR always check for un-commited code, don't leave anything behind.
- Always use make targets for terraform operation when available.
- NEVER force unlock Terraform state without explicit user permission. State locks protect against corruption and concurrent modifications.
