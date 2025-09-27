---
description: Audit and reconcile AI documentation files for accuracy, deduplication, and consistency
argument-hint: "[optional: specific directory to reconcile, e.g., docs, features, howto, templates]"
---

I'll audit and reconcile the AI documentation files to ensure accuracy, eliminate duplication, verify index representation, and standardize headers across the project.

**PROCESS**: I will launch four parallel agents to audit different documentation areas, then fix any discrepancies found.

## Phase 1: Initial Index Analysis
First, I'll read the `.ai/index.yaml` and `.ai/layout.yaml` files to understand the project structure and documentation organization.

## Phase 2: Parallel Documentation Audit
I'll launch four specialized agents in parallel, each focused on a specific documentation area:

### Agent 1: Docs Reconciliation
**Scope**: `.ai/docs/` directory
**Tasks**:
1. Scan each `.md` file in the docs directory
2. Verify accuracy against the actual codebase implementation
3. Check for duplicate content within the directory
4. Ensure all docs are properly referenced in `.ai/index.yaml`
5. Validate headers follow standards (Purpose, Scope, Overview, etc.)
6. Fix any discrepancies found

### Agent 2: Features Reconciliation
**Scope**: `.ai/features/` directory
**Tasks**:
1. Scan each feature documentation file
2. Cross-reference with actual feature implementations in the codebase
3. Identify and eliminate duplicate feature descriptions
4. Verify all features are indexed in `.ai/index.yaml`
5. Standardize headers per FILE_HEADER_STANDARDS.md
6. Update any outdated feature references

### Agent 3: Howto Reconciliation
**Scope**: `.ai/howto/` directory
**Tasks**:
1. Review all how-to guides for accuracy
2. Verify commands and code examples still work
3. Check for overlapping or duplicate instructions
4. Ensure all guides are indexed properly
5. Validate header structure and completeness
6. Update any obsolete procedures

### Agent 4: Templates Reconciliation
**Scope**: `.ai/templates/` directory
**Tasks**:
1. Verify each template against current coding patterns
2. Check template variables match actual usage
3. Identify redundant or overlapping templates
4. Confirm all templates are documented in index
5. Ensure template headers describe purpose clearly
6. Update templates to match current best practices

## Phase 3: Cross-Reference Validation
After individual audits, I'll:
1. Cross-check references between documentation areas
2. Ensure consistent terminology and naming
3. Verify all file paths are accurate
4. Update the index with any new discoveries

## Phase 4: Report and Fix
I'll provide:
- Summary of discrepancies found
- List of duplications removed
- Index entries added or updated
- Headers standardized
- Files modified with improvements

**Execution**: ${ARGUMENTS:-"all directories"}

Let me start the reconciliation process...