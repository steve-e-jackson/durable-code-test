---
description: Audit and reconcile project files for accuracy, deduplication, and consistency
argument-hint: "[target: docs, features, howto, templates, roadmap, web-tab:[tab-name], or leave empty for all AI documentation]"
---

I'll reconcile the specified area of the project to ensure accuracy, eliminate duplication, and maintain consistency.

**PROCESS**: Based on the argument provided, I'll execute the appropriate reconciliation workflow.

## Reconciliation Workflow Selection

Based on the provided argument, I'll execute the appropriate workflow:

### Case: "roadmap"
When reconciling roadmap items:

#### Phase 1: Scan All Roadmap Items
1. **Find all PROGRESS_TRACKER.md files** in roadmap/
2. **Extract completion percentages** from each tracker
3. **Identify current directory** for each item

#### Phase 2: Validate Directory Placement
For each roadmap item:
1. **Check completion percentage**:
   - 0% → Should be in `roadmap/planning/`
   - 1-99% → Should be in `roadmap/in_progress/`
   - 100% → Should be in `roadmap/complete/`
2. **Move misplaced items** to correct directories
3. **Log all movements** for reporting

#### Phase 3: Update Master ROADMAP.md
1. **Recalculate all percentages** from source data
2. **Update item locations** based on moves
3. **Refresh overall project completion**
4. **Generate new progress visualizations**
5. **Sort items by priority and status**

#### Phase 4: Generate Report
Provide summary of:
- Items moved between directories
- Percentage corrections made
- New overall completion percentage
- Recommendations for stale items

### Case: "web-tab:journey"
When reconciling the journey tab:

#### Phase 1: Analyze Current Journey Data
1. **Read journey data file** at `durable-code-app/frontend/src/features/journey/data/journeyData.ts`
2. **Extract last entry date** from the timeline
3. **Parse existing milestones** and their metadata

#### Phase 2: Git History Analysis
1. **Run git log** from the last entry date to present:
   ```bash
   git log --since="[last-entry-date]" --pretty=format:"%H|%s|%ad|%an" --date=format:"%b %d, %Y"
   ```
2. **Parse commits** for:
   - Feat/fix/perf/refactor/test prefixes
   - PR numbers from commit messages
   - Impact assessment based on changed files
3. **Group commits** into logical milestones

#### Phase 3: Milestone Classification
For each new commit/milestone:
1. **Determine phase** based on commit type and content:
   - Foundation → Core infrastructure changes
   - Quality → Linting, testing, standards
   - Modernization → UI/UX improvements
   - Architecture → Structural refactoring
   - Performance → Optimization changes
   - Deployment → Infrastructure/deployment
   - Consistency → Visual/behavioral standardization
2. **Assess impact**:
   - major: Core functionality, breaking changes, new features
   - minor: Improvements, non-breaking additions
3. **Extract details** from commit message and changed files

#### Phase 4: Update Journey Data
1. **Append new milestones** to appropriate phases
2. **Maintain chronological order** within phases
3. **Generate unique IDs** for new milestones
4. **Preserve existing milestone data** (no overwrites)
5. **Update the journeyData.ts file** with new entries

#### Phase 5: Validation & Report
1. **Verify TypeScript compilation** of updated file
2. **Check for duplicate entries**
3. **Validate date formatting**
4. **Generate summary** of:
   - New milestones added
   - Phases updated
   - Any gaps in timeline coverage

### Case: "web-tab:[other-tabs]"
Future implementation for other web tabs (repository, planning, etc.):
- Similar pattern to journey tab reconciliation
- Tab-specific data analysis and updates
- Codebase-to-UI synchronization

### Case: "docs", "features", "howto", "templates", or no argument (default)
When reconciling AI documentation:

#### Phase 1: Initial Index Analysis
Read the `.ai/index.yaml` and `.ai/layout.yaml` files to understand the project structure and documentation organization.

#### Phase 2: Parallel Documentation Audit
Launch specialized agents in parallel, each focused on a specific documentation area:

##### Agent 1: Docs Reconciliation
**Scope**: `.ai/docs/` directory
**Tasks**:
1. Scan each `.md` file in the docs directory
2. Verify accuracy against the actual codebase implementation
3. Check for duplicate content within the directory
4. Ensure all docs are properly referenced in `.ai/index.yaml`
5. Validate headers follow standards (Purpose, Scope, Overview, etc.)
6. Fix any discrepancies found

##### Agent 2: Features Reconciliation
**Scope**: `.ai/features/` directory
**Tasks**:
1. Scan each feature documentation file
2. Cross-reference with actual feature implementations in the codebase
3. Identify and eliminate duplicate feature descriptions
4. Verify all features are indexed in `.ai/index.yaml`
5. Standardize headers per FILE_HEADER_STANDARDS.md
6. Update any outdated feature references

##### Agent 3: Howto Reconciliation
**Scope**: `.ai/howto/` directory
**Tasks**:
1. Review all how-to guides for accuracy
2. Verify commands and code examples still work
3. Check for overlapping or duplicate instructions
4. Ensure all guides are indexed properly
5. Validate header structure and completeness
6. Update any obsolete procedures

##### Agent 4: Templates Reconciliation
**Scope**: `.ai/templates/` directory
**Tasks**:
1. Verify each template against current coding patterns
2. Check template variables match actual usage
3. Identify redundant or overlapping templates
4. Confirm all templates are documented in index
5. Ensure template headers describe purpose clearly
6. Update templates to match current best practices

#### Phase 3: Cross-Reference Validation
After individual audits, I'll:
1. Cross-check references between documentation areas
2. Ensure consistent terminology and naming
3. Verify all file paths are accurate
4. Update the index with any new discoveries

#### Phase 4: Report and Fix
I'll provide:
- Summary of discrepancies found
- List of duplications removed
- Index entries added or updated
- Headers standardized
- Files modified with improvements

## Execution

The command will execute based on the argument provided:
- **No argument or "docs"/"features"/"howto"/"templates"**: Run AI documentation reconciliation
- **"roadmap"**: Run roadmap reconciliation with directory organization
- **"web-tab:journey"**: Run journey tab reconciliation with git history analysis
- **"web-tab:[tab-name]"**: Run specific web tab reconciliation (future implementation)
- **Future cases**: Additional reconciliation types can be added here

**Target**: ${ARGUMENTS:-"all AI documentation"}

Let me start the reconciliation process...