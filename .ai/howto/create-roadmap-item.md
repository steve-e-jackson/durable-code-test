# How to Create a New Roadmap Item

**Purpose**: Step-by-step guide for AI agents to create comprehensive roadmap items for new features or initiatives

**Scope**: Complete roadmap item creation from initial planning through documentation structure

**Overview**: This guide helps AI agents create well-structured roadmap items that facilitate collaboration between humans and AI. Each roadmap item includes a progress tracker (the primary handoff document), contextual documentation, and breakdown of work into manageable PRs.

---

## 🎯 When to Create a Roadmap Item

Create a roadmap item when:
- Planning a significant feature that requires multiple PRs
- Implementing infrastructure changes with multiple components
- Coordinating complex refactoring efforts
- Establishing new architectural patterns
- Building features that require phased rollout

## 📋 Prerequisites

Before creating a roadmap item, gather the following information from the user:

### Required Information
1. **Feature Name**: Clear, descriptive name for the initiative
2. **Scope**: What the feature will and won't include
3. **Goals**: What success looks like
4. **Dependencies**: External systems, libraries, or features required
5. **Constraints**: Budget, timeline, technical limitations

### Information to Clarify

Ask the user about:
- **Priority Level**: Is this urgent, important, or nice-to-have?
- **Target Users**: Who will benefit from this feature?
- **Performance Requirements**: Any specific metrics to meet?
- **Security Considerations**: Authentication, authorization, data protection needs?
- **Integration Points**: How does this connect with existing features?
- **Rollback Strategy**: How can we safely revert if needed?
- **Success Metrics**: How will we measure success?

## 🚀 Step-by-Step Creation Process

### Step 1: Create the Roadmap Directory

```bash
# Create a new directory in the roadmap folder
mkdir -p roadmap/{{feature-name}}/
```

Use kebab-case for the directory name (e.g., `ai-contributions`, `deployment`, `frontend-upgrade`)

### Step 2: Create the Progress Tracker (Primary Document)

Using the template at `.ai/templates/roadmap-progress-tracker.md.template`, create:

```
roadmap/{{feature-name}}/PROGRESS_TRACKER.md
```

This is the **most important document** as it serves as:
- The primary AI-human handoff point
- Current status tracker
- Next action guide
- Completion checklist

#### Key Sections to Complete:

1. **Document Purpose**: Explain this is the primary handoff document
2. **Current Status**: Start with "Planning Phase"
3. **Required Documents Location**: List all documents in the folder
4. **Next PR to Implement**: Initially "PR1" with clear starting point
5. **PR Status Dashboard**: Create a table with all planned PRs
6. **Detailed PR Checklists**: Break down each PR into specific tasks
7. **Update Protocol**: Instructions for keeping document current

### Step 3: Create the AI Context Document

Using the template at `.ai/templates/roadmap-ai-context.md.template`, create:

```
roadmap/{{feature-name}}/AI_CONTEXT.md
```

This provides comprehensive background for AI agents, including:
- Project background and rationale
- Feature vision and goals
- Current application context
- Target architecture
- Key decisions and tradeoffs
- Integration requirements
- AI-specific guidance

### Step 4: Create the PR Breakdown Document

Using the template at `.ai/templates/roadmap-pr-breakdown.md.template`, create:

```
roadmap/{{feature-name}}/PR_BREAKDOWN.md
```

This contains detailed implementation steps for each PR:
- Files to create/modify
- Specific implementation steps
- Code examples
- Testing requirements
- Success criteria

### Step 5: Add Specialized Documents (Optional)

Depending on the feature, you might also create:

- **SECURITY_STRATEGY.md**: For features with security implications
- **TESTING_STRATEGY.md**: For complex testing requirements
- **DEPLOYMENT_CHECKLIST.md**: For infrastructure changes
- **MIGRATION_GUIDE.md**: For database or API changes
- **workflow.html**: Visual diagrams of complex flows

## 📝 Information Gathering Prompts

When the user hasn't provided enough detail, use these prompts:

### For Technical Features
```
To create a comprehensive roadmap for {{feature}}, I need to understand:

1. **Architecture Choice**: Should we use [Option A] or [Option B]?
   - Option A benefits: {{benefits}}
   - Option B benefits: {{benefits}}

2. **Performance Requirements**:
   - Expected load/traffic?
   - Response time targets?
   - Resource constraints?

3. **Data Considerations**:
   - What data needs to be stored?
   - Privacy/compliance requirements?
   - Backup/recovery needs?
```

### For User-Facing Features
```
To design the {{feature}} experience, please clarify:

1. **User Journey**:
   - How do users discover this feature?
   - What's the primary use case?
   - What happens after they use it?

2. **UI/UX Preferences**:
   - Prominent or subtle placement?
   - Mobile-first or desktop-first?
   - Accessibility requirements?

3. **Success Metrics**:
   - User engagement targets?
   - Conversion goals?
   - Performance benchmarks?
```

### For Infrastructure Changes
```
For the {{infrastructure}} roadmap, I need details on:

1. **Scale Requirements**:
   - Current vs. projected load?
   - Geographic distribution?
   - High availability needs?

2. **Cost Constraints**:
   - Monthly budget target?
   - Acceptable tradeoffs?
   - Cost optimization priorities?

3. **Operational Requirements**:
   - Monitoring needs?
   - Alerting thresholds?
   - Maintenance windows?
```

## 🎯 Best Practices

### DO:
- ✅ Break work into 3-10 atomic PRs
- ✅ Make each PR independently valuable
- ✅ Include rollback procedures
- ✅ Define clear success metrics
- ✅ Add comprehensive checklists
- ✅ Provide example code/configs
- ✅ Include testing strategies
- ✅ Document manual steps clearly

### DON'T:
- ❌ Create PRs larger than 1 week of work
- ❌ Make assumptions about architecture
- ❌ Skip security considerations
- ❌ Forget about monitoring/observability
- ❌ Omit rollback procedures
- ❌ Leave success criteria vague

## 🔄 Progress Document Maintenance

The PROGRESS_TRACKER.md is a **living document** that must be updated:

### After Each PR Completion:
1. Update PR status to 🟢 Complete
2. Record completion date
3. Update overall progress percentage
4. Move "Next PR" pointer
5. Document any deviations or learnings
6. Note any new blockers or dependencies

### When Blocked:
1. Mark PR as 🔵 Blocked
2. Document the blocker clearly
3. Add resolution steps if known
4. Update when unblocked

### For Scope Changes:
1. Document the change in the change log
2. Update affected PR descriptions
3. Adjust timelines if needed
4. Note impact on other PRs

## 📊 Example Roadmap Structure

Here's a complete example for an "API Rate Limiting" feature:

```
roadmap/api-rate-limiting/
├── PROGRESS_TRACKER.md     # Primary handoff document
├── AI_CONTEXT.md           # Background and architecture
├── PR_BREAKDOWN.md         # Detailed implementation
├── TESTING_STRATEGY.md     # Load testing approach
└── rate-limit-flow.html    # Visual flow diagram
```

### PR Structure Example:
- **PR1**: Core rate limiting middleware (Backend)
- **PR2**: Redis integration for distributed counting
- **PR3**: API endpoint annotations and configuration
- **PR4**: Admin dashboard for monitoring/overrides
- **PR5**: Client-side retry logic and error handling
- **PR6**: Documentation and load testing

## 🤝 Collaboration with /done Command

When working on a roadmap item, the `/done` command should:

1. **Detect Roadmap Work**: Check if PROGRESS_TRACKER.md was modified
2. **Update Progress**:
   - Mark current PR/task as complete
   - Update completion percentages
   - Add completion timestamp
3. **Prepare Next Steps**:
   - Identify next PR to implement
   - Create summary for handoff
4. **Commit Updates**: Include progress tracker in commit

## 🎯 Success Criteria for Roadmap Items

A well-created roadmap item has:
- ✅ Clear scope and objectives
- ✅ Atomic, manageable PRs
- ✅ Comprehensive progress tracking
- ✅ AI-friendly documentation
- ✅ Defined success metrics
- ✅ Testing strategies
- ✅ Rollback procedures
- ✅ Security considerations

## 📚 Templates Reference

All templates are located in `.ai/templates/`:
- `roadmap-progress-tracker.md.template` - Primary progress document
- `roadmap-ai-context.md.template` - Context for AI agents
- `roadmap-pr-breakdown.md.template` - Detailed PR instructions

## 💡 Tips for AI Agents

1. **Always start with questions** - Don't assume requirements
2. **Seek clarity on tradeoffs** - Present options with pros/cons
3. **Think in iterations** - Plan for MVPs and enhancements
4. **Consider operations** - How will this be maintained?
5. **Document decisions** - Why choices were made
6. **Plan for failure** - What could go wrong?
7. **Enable progress tracking** - Make handoffs smooth

---

Remember: The goal is to create roadmap items that any AI agent can pick up and continue, with clear progress tracking and comprehensive context. The PROGRESS_TRACKER.md is the heart of this system - keep it current and accurate!