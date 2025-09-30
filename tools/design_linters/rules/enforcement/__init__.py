#!/usr/bin/env python3
"""
Purpose: Linting rule enforcement category for framework.

Scope: Enforce proper linting practices and prevent rule skipping
Overview: Provides rules ensuring developers fix issues rather than
    skip linting rules. Detects patterns like noqa, pylint: disable,
    type: ignore, and eslint-disable comments. Enforces that critical
    rules are never skipped. Maintains code quality by preventing
    workarounds and ensuring all linting violations are addressed.
Dependencies: Framework interfaces, multi-language support
Exports: No-skip rules and enforcement utilities
Interfaces: Standard rule registration via __all__
Implementation: Multi-language file-based rules with policies
"""

from tools.design_linters.rules.enforcement.no_skip_rules import (
    NoSkipRule,
)

__all__ = ["NoSkipRule"]
