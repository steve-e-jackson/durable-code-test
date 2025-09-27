---
description: Conduct a thorough multi-agent code review with customizable depth levels and scope targeting
argument-hint: [depth: light|medium|heavy] [scope: frontend|backend|all]
---

# Code Review Command

## Purpose
Perform a comprehensive, multi-agent code review of the codebase using specialized AI reviewers working in parallel. This command provides rigorous, constructive feedback focused on code quality, architecture, performance, and best practices.

## Command Overview
The `/review` command deploys specialized AI agents to conduct thorough code reviews with configurable depth and scope:

**Arguments:**
- **Depth** (optional): `light` (quick scan), `medium` (default, balanced), or `heavy` (exhaustive)
- **Scope** (optional): `frontend`, `backend`, or `all` (default)

**Examples:**
```bash
/review                          # Medium depth, all code
/review light                    # Quick review of all code
/review heavy frontend           # Exhaustive frontend review
/review medium backend           # Balanced backend review
```

## Context
This repository serves as a demonstration project authored entirely by AI to showcase modern development practices, comprehensive testing, and strict code quality enforcement. The review process maintains these high standards through rigorous analysis.

## Review Depth Levels

### Light Review (Quick Scan)
- Focus on critical issues only
- Basic code structure validation
- Obvious bugs and security issues
- Runtime errors and type mismatches
- ~5-10 minute analysis

### Medium Review (Balanced - Default)
- All light review checks plus:
- Code organization and patterns
- Performance bottlenecks
- Testing coverage gaps
- Documentation completeness
- ~15-20 minute analysis

### Heavy Review (Exhaustive)
- All medium review checks plus:
- Detailed architectural analysis
- Scalability considerations
- Edge case handling
- Optimization opportunities
- Code smell detection
- ~30-45 minute analysis

## Multi-Agent Review Strategy

The command deploys 5 specialized review agents in parallel, each focusing on specific domains:

### Agent 1: Frontend Architecture Specialist
**Focus Areas:**
- React component design patterns and hooks optimization
- State management and data flow analysis
- UI/UX consistency and accessibility compliance
- Frontend performance and bundle optimization
- CSS architecture and responsive design

**Review Criteria:**
- Component structure and reusability
- Props validation and type safety
- Side effect management
- Render optimization
- Accessibility standards (WCAG)

### Agent 2: Backend Systems Reviewer
**Focus Areas:**
- API design and RESTful architecture
- Database schema and query optimization
- Service layer patterns and dependency injection
- Error handling and logging strategies
- Security patterns and input validation

**Review Criteria:**
- API consistency and documentation
- Database performance and indexing
- Service separation and cohesion
- Error recovery mechanisms
- Authentication and authorization

### Agent 3: DevOps & Infrastructure Analyst
**Focus Areas:**
- Docker configuration and containerization best practices
- CI/CD pipeline efficiency and reliability
- Development workflow and tooling setup
- Build optimization and caching strategies
- Environment configuration management

**Review Criteria:**
- Container security and size
- Pipeline speed and reliability
- Development ergonomics
- Build performance
- Configuration consistency

### Agent 4: Code Quality & Testing Auditor
**Focus Areas:**
- Test coverage analysis and testing patterns
- Code organization and module structure
- Linting rules effectiveness and code consistency
- Documentation completeness and clarity
- Technical debt identification

**Review Criteria:**
- Test completeness and quality
- Code maintainability metrics
- Style guide adherence
- Documentation accuracy
- Refactoring opportunities

### Agent 5: Performance & Security Specialist
**Focus Areas:**
- Runtime performance bottlenecks
- Memory usage and resource optimization
- Security vulnerabilities and best practices
- Scalability considerations
- Monitoring and observability gaps

**Review Criteria:**
- Algorithm efficiency
- Resource utilization
- Security vulnerability scanning
- Horizontal scaling readiness
- Logging and metrics coverage

## Review Process Flow

### 1. Scope Determination
```bash
# Determine files to review based on arguments
if scope == "frontend":
    files = frontend_files
elif scope == "backend":
    files = backend_files
else:
    files = all_files

# Apply depth-based filtering
if depth == "light":
    focus_on_critical_files()
elif depth == "heavy":
    include_all_files_and_configs()
```

### 2. Parallel Agent Deployment
Launch all 5 agents simultaneously with scope-specific prompts:
```
🚀 Deploying Review Agents:
  ✓ Frontend Specialist → React, TypeScript, CSS
  ✓ Backend Reviewer → API, Database, Services
  ✓ DevOps Analyst → Docker, CI/CD, Config
  ✓ Quality Auditor → Tests, Docs, Standards
  ✓ Security Expert → Performance, Vulnerabilities
```

### 3. Agent Review Execution
Each agent performs its specialized review:
- Analyzes assigned files
- Identifies issues by severity
- Provides specific recommendations
- Generates code examples for fixes
- Returns structured findings

### 4. Review Consolidation
Combine all agent reports into unified feedback:
- Deduplicate overlapping findings
- Prioritize by severity and impact
- Group related issues together
- Generate actionable recommendations

### 5. Report Generation
Create comprehensive review report with:
- Executive summary
- Prioritized issues list
- Code examples and fixes
- Positive patterns to maintain
- Improvement roadmap

## Review Output Format

### Executive Summary
```markdown
# Code Review Report

## Overview
- **Files Reviewed**: X files
- **Total Issues**: Y found
- **Critical**: Z requiring immediate attention
- **Overall Grade**: A-F

## Top Priorities
1. [Critical Issue 1]
2. [Critical Issue 2]
3. [High Priority Issue]
```

### Detailed Findings
```markdown
## Frontend Architecture Review

### 🔴 Critical Issues
1. **Memory leak in ProductList component**
   - File: src/components/ProductList.tsx:45
   - Issue: Effect cleanup missing for WebSocket subscription
   - Fix: Add cleanup function to useEffect
   ```typescript
   // Current (problematic)
   useEffect(() => {
     socket.subscribe('products', handleUpdate);
   }, []);

   // Recommended
   useEffect(() => {
     socket.subscribe('products', handleUpdate);
     return () => socket.unsubscribe('products', handleUpdate);
   }, []);
   ```

### 🟡 Improvements Needed
1. **Component re-render optimization**
   - File: src/features/Dashboard.tsx
   - Issue: Expensive calculations on every render
   - Fix: Use useMemo for derived state

### 🟢 Positive Patterns
1. **Excellent error boundary implementation**
   - Comprehensive error handling
   - User-friendly fallback UI
   - Proper error logging
```

## Review Prompts

### Base Review Prompt
```
You are a team of experienced full-stack developers conducting a thorough code review. This codebase was authored entirely by AI as a demonstration of best practices and modern development patterns.

Your review should be rigorous and comprehensive, examining code with these focus areas:

### Technical Excellence
- Code architecture and design patterns
- Performance optimizations and potential bottlenecks
- Security considerations (even for demo projects)
- Testing coverage and quality
- Error handling and edge cases
- Type safety and data validation

### Code Quality
- Readability and maintainability
- Consistency with established patterns
- Proper abstraction levels
- DRY principles without over-engineering
- Clear separation of concerns

Please provide:
1. A prioritized list of critical issues that must be addressed
2. Architectural improvements that would enhance scalability
3. Code smells and anti-patterns discovered
4. Positive patterns worth highlighting as exemplars
5. Specific, actionable recommendations with code examples

Be direct, thorough, and constructive. This is a learning exercise designed to improve AI-authored code quality through iterative refinement.
```

### Depth-Specific Modifications

#### Light Depth Modifier
```
Focus only on:
- Critical bugs and runtime errors
- Security vulnerabilities
- Broken functionality
- Major performance issues
Skip minor style issues and optimizations.
```

#### Heavy Depth Modifier
```
Additionally examine:
- Every edge case and error scenario
- Micro-optimizations and performance tuning
- Detailed accessibility compliance
- Complete test coverage analysis
- Documentation for every function
- Code comment quality and completeness
```

### Scope-Specific Instructions

#### Frontend Scope
```
Concentrate exclusively on:
- React/TypeScript components
- State management
- UI/UX implementation
- Client-side performance
- Browser compatibility
```

#### Backend Scope
```
Concentrate exclusively on:
- API endpoints and middleware
- Database operations
- Server-side logic
- Background jobs
- Infrastructure code
```

## Integration Features

### With /fix Command
Review findings can be automatically fixed:
```bash
/review heavy          # Identify all issues
/fix                   # Automatically fix them
```

### With /solid Command
Review includes SOLID principle compliance:
```bash
/review medium backend # General backend review
/solid                 # Detailed SOLID analysis
```

### With CI/CD Pipeline
Review can be triggered on pull requests:
- Automated review on PR creation
- Blocking merge for critical issues
- Review summary in PR comments

## Success Metrics

The review succeeds when it provides:
1. ✅ Clear, actionable feedback
2. ✅ Prioritized issue list
3. ✅ Code examples for fixes
4. ✅ Recognition of good patterns
5. ✅ Constructive improvement suggestions

## Example Usage

### Quick Frontend Check
```bash
User: /review light frontend