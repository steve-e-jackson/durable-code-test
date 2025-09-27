# Development Tools

**Purpose**: Documentation for development and linting tools used in the project

**Scope**: Custom tools, scripts, and utilities for code quality enforcement

**Overview**: Comprehensive documentation for the design linter framework and related development tools.
    Provides detailed usage instructions for the unified design linter, including CLI options, output
    formats, rule categories, and integration patterns. Documents the pluggable architecture that
    enables extensible rule-based linting with framework components for orchestration, reporting,
    and rule discovery. Includes configuration guidelines, exit codes, supported file types, and
    pre-commit integration. This documentation helps developers understand how to effectively use
    the linting tools to maintain code quality and design standards across the entire project.

**Dependencies**: Design linter framework components, pre-commit hooks, and CLI argument parsing

**Exports**: Documentation for linter usage, configuration patterns, and integration approaches

**Related**: FILE_HEADER_STANDARDS.md for header requirements, framework implementation in design_linters/

**Implementation**: Documentation follows standard markdown patterns with clear examples and usage instructions

---

## Header Linter Tool

### Purpose
The `design_linters/header_linter.py` tool enforces standardized file headers across all documentation and source code files in the project.

### Usage

#### Lint a directory
```bash
# Lint all files in docs/ directory
python tools/design_linters/header_linter.py --path docs/

# Lint all files recursively from root
python tools/design_linters/header_linter.py --path . --recursive

# Strict mode (warnings treated as errors)
python tools/design_linters/header_linter.py --path docs/ --strict
```

#### Lint a single file
```bash
# Check specific file
python tools/design_linters/header_linter.py --file README.md
```

#### Integration options
```bash
# Quiet mode (errors only)
python tools/design_linters/header_linter.py --path . --quiet

# Get help
python tools/design_linters/header_linter.py --help
```

### Exit Codes
- **0**: All files passed validation
- **1**: Files have warnings (non-strict mode)
- **2**: Files have errors or failures

### Pre-commit Integration
The tool is automatically run as part of pre-commit hooks. Install with:
```bash
pre-commit install
```

### Supported File Types
- **Markdown** (`.md`) - Uses `**Field**: value` format
- **Python** (`.py`) - Uses docstring format
- **TypeScript/JavaScript** (`.ts`, `.tsx`, `.js`, `.jsx`) - Uses JSDoc format
- **HTML** (`.html`) - Uses HTML comment format
- **YAML** (`.yml`, `.yaml`) - Uses comment format

### Required Fields
All files must include:
- **Purpose**: Brief description of file's functionality (1-2 lines)
- **Scope**: What areas/components this file covers or affects
- **Overview**: Comprehensive summary explaining the file's role and operation

### Code Files Additional Fields
- **Dependencies**: Key dependencies, libraries, or related files
- **Exports**: Main classes, functions, components, or constants this file provides
- **Interfaces**: Key APIs, interfaces, or methods this file exposes or accepts

### Recommended Fields
- **Implementation**: Notable algorithms, patterns, or architectural decisions
- **Related**: Links to related files, documentation, or external resources

### Example Headers

#### Markdown File
```markdown
# Document Title

**Purpose**: Brief description of what this document covers

**Scope**: What areas/components this document applies to

**Overview**: Comprehensive explanation of the document's content, structure, and purpose.
    Detailed description of what readers will learn and how the document fits into the larger
    documentation ecosystem.

**Dependencies**: Related documents, external resources, or prerequisite knowledge required

**Exports**: Key information, standards, procedures, or guidelines this document provides

**Related**: Links to related documentation, external resources, or cross-references

---

Content starts here...
```

#### Python File
```python
"""
Purpose: Brief description of module functionality

Scope: What this module handles (API endpoints, data models, business logic, etc.)

Overview: Comprehensive summary of what this module does and its role in the system.
    Detailed explanation of the module's responsibilities, how it fits into the larger
    architecture, key workflows it supports, and important behavioral characteristics.

Dependencies: Key external dependencies or internal modules required

Exports: Main classes, functions, or constants this module provides

Interfaces: Key APIs, endpoints, or methods this module exposes

Implementation: Notable algorithms, patterns, or architectural decisions
"""
```

### Configuration
The linter is configured in the tool itself. Key settings:
- Required fields validation
- Date format validation (YYYY-MM-DD)
- File type detection by extension
- Warning vs. error categorization

For more details, see `/docs/FILE_HEADER_STANDARDS.md`.
