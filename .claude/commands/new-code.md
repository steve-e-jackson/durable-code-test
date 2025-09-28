---
description: Create a new code file with proper structure and error handling
aliases: ["/create-code", "/generate-code", "/new-file"]
requirements: ["Filename or description of the file to create"]
auto: ["Read", "Write", "Edit", "MultiEdit", "Glob", "Grep", "Bash(git status)", "Bash(git diff)", "Bash(git add)", "Bash(git commit)", "Bash(make lint*)", "Bash(make test*)", "Bash(npm run*)", "Bash(poetry run*)"]
ask: ["Bash(git push)", "Bash(gh pr create)", "Bash(SKIP=*)", "Bash(--no-verify)", "SlashCommand"]
---

Create a production-ready code file following project standards and best practices.

**Important Permissions:**
- **Auto-allowed**: File operations, linting, testing, git operations (add, commit)
- **Requires explicit permission**: Creating PRs, pushing to remote, and skipping pre-commit hooks

**Implementation**: Follow the comprehensive guide at `.ai/howto/code-authoring-workflow.md`

This command will:
1. Consult the AI index and layout rules for proper file placement
2. Select the appropriate template based on file type
3. Apply project standards and error handling patterns
4. Generate production-ready code with full documentation
5. Run linting and tests (pre-commit hooks must pass)
6. Stage and commit changes locally

**Note**: PR creation and skipping pre-commit hooks require explicit user approval. Pre-commit hooks cannot be bypassed without permission.

The detailed step-by-step process is maintained in `.ai/howto/code-authoring-workflow.md` to ensure consistency across all code generation.