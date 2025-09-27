#!/usr/bin/env python3
"""
Purpose: Common types and data structures for the design linter framework
Scope: Shared data structures used across the framework components
Overview: This module contains common types, enums, and data structures that are
    used throughout the design linter framework. By placing these in a separate
    module, we avoid circular import issues between the base interfaces and
    the specific implementations. The module includes the core LintViolation
    class, severity levels, and other shared data structures that need to be
    accessible from both language-specific and language-agnostic components.
Dependencies: abc for abstract base classes, typing for type hints, enum for enums
Exports: LintViolation, Severity
Interfaces: Core data structures used throughout the framework
Implementation: Framework-wide shared types
"""

from dataclasses import dataclass
from enum import Enum
from typing import Any


class Severity(Enum):
    """Enumeration of violation severity levels."""

    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


@dataclass
class LintViolation:  # pylint: disable=too-many-instance-attributes
    """Represents a detected linting violation."""

    rule_id: str
    file_path: str
    line: int
    column: int
    severity: Severity
    message: str
    description: str
    suggestion: str | None = None
    context: dict[str, Any] | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert violation to dictionary format."""
        return {
            "rule_id": self.rule_id,
            "file": self.file_path,
            "line": self.line,
            "column": self.column,
            "severity": self.severity.value,
            "message": self.message,
            "description": self.description,
            "suggestion": self.suggestion,
            "context": self.context or {},
        }
