#!/usr/bin/env python3
"""
Purpose: Multi-language line length rules for the design linter framework
Scope: Line length checking rules that work across multiple programming languages
Overview: This module demonstrates how to create rules that work across multiple
    programming languages using the new multi-language framework. The rules inherit
    from FileBasedMultiLanguageRule instead of the Python-specific classes, enabling
    them to analyze source code files regardless of the programming language. The
    line length rule checks for excessively long lines that can impact code
    readability, applying consistent standards across Python, JavaScript, TypeScript,
    and other supported languages. This serves as an example of how existing
    design principles can be enforced uniformly across a multi-language codebase.
Dependencies: pathlib for file operations, re for pattern matching
Exports: LineLengthRule, ExcessiveLineLengthRule
Interfaces: Implements FileBasedMultiLanguageRule for cross-language compatibility
Implementation: File-based analysis with language-agnostic line checking
"""

from pathlib import Path
from typing import Any

from tools.design_linters.framework import (
    BaseLintContext,
    FileBasedMultiLanguageRule,
)
from tools.design_linters.framework.types import LintViolation, Severity


class LineLengthRule(FileBasedMultiLanguageRule):
    """Rule to check for excessively long lines across multiple languages."""

    def __init__(self, max_line_length: int = 100, supported_languages: set[str] | None = None):
        """Initialize with configurable line length limit.

        Args:
            max_line_length: Maximum allowed line length
            supported_languages: Languages this rule supports (None = all languages)
        """
        super().__init__(supported_languages)
        self.max_line_length = max_line_length

    @property
    def rule_id(self) -> str:
        """Unique identifier for this rule."""
        return "multi_language.line_length"

    @property
    def rule_name(self) -> str:
        """Human-readable name for this rule."""
        return "Line Length Check"

    @property
    def description(self) -> str:
        """Description of what this rule checks."""
        return f"Checks that lines do not exceed {self.max_line_length} characters"

    @property
    def severity(self) -> Severity:
        """Default severity level for violations of this rule."""
        return Severity.WARNING

    @property
    def categories(self) -> set[str]:
        """Categories this rule belongs to."""
        return {"style", "readability", "multi_language"}

    def check_file(self, file_path: Path, content: str, context: BaseLintContext) -> list[LintViolation]:
        """Check file for line length violations."""
        violations = []
        lines = content.split("\n")

        for line_num, line in enumerate(lines, 1):
            # Skip empty lines
            if not line.strip():
                continue

            # Check line length
            if len(line) > self.max_line_length:
                violations.append(
                    self.create_violation(
                        context=context,
                        message=f"Line length {len(line)} exceeds maximum of {self.max_line_length}",
                        description=(
                            f"Line {line_num} has {len(line)} characters, which exceeds the "
                            f"maximum allowed length of {self.max_line_length} characters. "
                            "Consider breaking this line into multiple lines for better readability."
                        ),
                        line=line_num,
                        column=self.max_line_length + 1,
                        suggestion=(
                            "Break long lines at logical points such as after operators, "
                            "commas, or before method calls."
                        ),
                        violation_context={
                            "line_length": len(line),
                            "max_length": self.max_line_length,
                            "language": context.language,
                        },
                    )
                )

        return violations


class ExcessiveLineLengthRule(FileBasedMultiLanguageRule):
    """Rule to check for extremely long lines that are definitely problematic."""

    def __init__(self, max_line_length: int = 150, supported_languages: set[str] | None = None):
        """Initialize with configurable extreme line length limit.

        Args:
            max_line_length: Maximum allowed line length for extreme cases
            supported_languages: Languages this rule supports (None = all languages)
        """
        super().__init__(supported_languages)
        self.max_line_length = max_line_length

    @property
    def rule_id(self) -> str:
        """Unique identifier for this rule."""
        return "multi_language.excessive_line_length"

    @property
    def rule_name(self) -> str:
        """Human-readable name for this rule."""
        return "Excessive Line Length Check"

    @property
    def description(self) -> str:
        """Description of what this rule checks."""
        return f"Checks that lines do not exceed {self.max_line_length} characters (error level)"

    @property
    def severity(self) -> Severity:
        """Default severity level for violations of this rule."""
        return Severity.ERROR

    @property
    def categories(self) -> set[str]:
        """Categories this rule belongs to."""
        return {"style", "readability", "multi_language", "critical"}

    def check_file(self, file_path: Path, content: str, context: BaseLintContext) -> list[LintViolation]:
        """Check file for excessive line length violations."""
        violations = []
        lines = content.split("\n")

        for line_num, line in enumerate(lines, 1):
            # Skip empty lines
            if not line.strip():
                continue

            # Check for excessive line length
            if len(line) > self.max_line_length:
                violations.append(
                    self.create_violation(
                        context=context,
                        message=f"Excessive line length {len(line)} exceeds critical limit of {self.max_line_length}",
                        description=(
                            f"Line {line_num} has {len(line)} characters, which exceeds the "
                            f"critical limit of {self.max_line_length} characters. This line "
                            "is too long and MUST be broken into multiple lines."
                        ),
                        line=line_num,
                        column=self.max_line_length + 1,
                        suggestion=(
                            "This line is excessively long and must be refactored. "
                            "Break it into multiple lines or consider extracting parts "
                            "into variables or methods."
                        ),
                        violation_context={
                            "line_length": len(line),
                            "max_length": self.max_line_length,
                            "language": context.language,
                            "severity_reason": "excessive_length",
                        },
                    )
                )

        return violations
