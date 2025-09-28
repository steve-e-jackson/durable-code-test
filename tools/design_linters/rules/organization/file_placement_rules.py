#!/usr/bin/env python3
"""
Purpose: File organization and placement linting rule for the design linter framework
Scope: Organization category rule implementation with JSON/YAML-based layout configuration
Overview: This module implements comprehensive file organization rules that ensure proper project
    structure and prevent common placement mistakes that can lead to maintenance issues. It detects
    files placed in incorrect directories such as debug scripts in root, test files outside test
    directories, frontend code mixed with backend, and configuration files in source directories.
    The rule loads configuration from a JSON or YAML layout file that supports both AI-readable guidance
    and machine-readable regex patterns for comprehensive file organization enforcement. It helps
    maintain clean separation of concerns, prevents accidental commits of temporary files, and
    ensures consistent project organization across team members. The implementation includes
    helpful suggestions for where files should be moved and can be configured to enforce
    organization standards specific to each project's architecture.
Dependencies: Framework interfaces, pathlib for path analysis, json/yaml for config loading, re for regex
Exports: FileOrganizationRule implementation
Interfaces: Implements ASTLintRule interface from framework
Implementation: JSON-driven path validation with regex pattern matching
"""

import json
import re
from pathlib import Path
from typing import Any

import yaml
from loguru import logger

from tools.design_linters.framework.interfaces import (
    ASTLintRule,
    LintContext,
    LintViolation,
    Severity,
)


class LayoutRulesLoader:
    """Handles loading and parsing of layout rules from configuration files."""

    def __init__(self, layout_file: str):
        """Initialize with layout file path."""
        self.layout_file = layout_file
        self.rules = None
        self._load_rules()

    def _load_rules(self) -> None:
        """Load layout rules from JSON or YAML file."""
        try:
            layout_path = self._get_layout_path()
            if not layout_path.exists():
                logger.warning(f"Layout rules file not found: {layout_path}, using default configuration")
                self.rules = self.get_default_rules()
                return

            data = self._load_config_data(layout_path)
            self._process_config_data(data, layout_path)
        except Exception as e:
            logger.warning(f"Error loading layout rules: {e}, using defaults")
            self.rules = self.get_default_rules()

    def _get_layout_path(self) -> Path:
        """Get absolute path to layout file."""
        path = Path(self.layout_file)
        if not path.is_absolute():
            path = Path.cwd() / path
        return path

    def _load_config_data(self, layout_path: Path) -> dict[str, Any]:
        """Load data from config file."""
        with open(layout_path) as f:
            if layout_path.suffix in [".yaml", ".yml"]:
                return yaml.safe_load(f)
            return json.load(f)

    def _process_config_data(self, data: dict[str, Any], layout_path: Path) -> None:
        """Process loaded configuration data."""
        if "$schema" in data:
            del data["$schema"]
        self.rules = data
        logger.debug(f"Loaded layout rules from {layout_path}")

    def get_rules(self) -> dict[str, Any] | None:
        """Get loaded layout rules."""
        return self.rules

    @staticmethod
    def get_default_rules() -> dict[str, Any]:
        """Get default layout rules if no config file exists."""
        return {"dont": "use"}


class PatternMatcher:
    """Handles pattern matching logic for file paths."""

    def match_deny_patterns(self, path_str: str, deny_patterns: list[dict[str, str]]) -> tuple[bool, str | None]:
        """Check if path matches any deny patterns."""
        for deny_item in deny_patterns:
            pattern = deny_item["pattern"]
            if re.search(pattern, path_str, re.IGNORECASE):
                reason = deny_item.get("reason", "File not allowed in this location")
                return True, reason
        return False, None

    def match_allow_patterns(self, path_str: str, allow_patterns: list[str]) -> bool:
        """Check if path matches any allow patterns."""
        return any(re.search(pattern, path_str, re.IGNORECASE) for pattern in allow_patterns)


class GlobalPatternChecker:
    """Checks files against global pattern rules."""

    def __init__(self, pattern_matcher: PatternMatcher):
        """Initialize with pattern matcher."""
        self.pattern_matcher = pattern_matcher

    def check_patterns(
        self, path_str: str, rel_path: Path, global_patterns: dict[str, Any], rule_id: str
    ) -> list[LintViolation]:
        """Check path against global patterns."""
        violations = []

        # Check global deny patterns
        if "deny" in global_patterns:
            is_denied, reason = self.pattern_matcher.match_deny_patterns(path_str, global_patterns["deny"])
            if is_denied:
                violations.append(
                    LintViolation(
                        rule_id=rule_id,
                        message=reason or f"File '{rel_path}' matches denied pattern",
                        node=None,
                        severity=Severity.ERROR,
                        line_number=1,
                        column_number=0,
                        file_path=str(rel_path),
                        suggestion=FileSuggestionGenerator.get_suggestion(rel_path.name, path_str),
                    )
                )

        # Check global allow patterns
        if "allow" in global_patterns:
            allow_patterns = global_patterns["allow"]
            if not self.pattern_matcher.match_allow_patterns(path_str, allow_patterns):
                violations.append(
                    LintViolation(
                        rule_id=rule_id,
                        message=f"File '{rel_path}' does not match any allowed patterns",
                        node=None,
                        severity=Severity.WARNING,
                        line_number=1,
                        column_number=0,
                        file_path=str(rel_path),
                        suggestion="Ensure file matches project structure patterns",
                    )
                )

        return violations


class DirectoryRuleChecker:
    """Checks files against directory-specific rules."""

    def __init__(self, pattern_matcher: PatternMatcher):
        """Initialize with pattern matcher."""
        self.pattern_matcher = pattern_matcher
        self.current_path_str = ""
        self.current_rel_path = None
        self.current_rule_id = ""
        self.current_directories = {}

    def check_directory_rules(
        self, path_str: str, rel_path: Path, directories: dict[str, Any], rule_id: str
    ) -> list[LintViolation]:
        """Check if file complies with directory-specific rules."""
        # Store state for use by other methods
        self.current_path_str = path_str
        self.current_rel_path = rel_path
        self.current_rule_id = rule_id
        self.current_directories = directories

        violations = []

        # Check for test files in root
        if self._is_test_file_in_root():
            violations.append(self._create_test_file_violation())
            return violations

        # Find matching directory rule
        dir_rule, matched_path = self._find_matching_directory_rule()
        if not dir_rule:
            return violations

        # Check deny patterns
        if "deny" in dir_rule:
            is_denied, reason = self.pattern_matcher.match_deny_patterns(self.current_path_str, dir_rule["deny"])
            if is_denied:
                violations.append(self._create_deny_violation(matched_path, reason))

        # Check allow patterns
        if "allow" in dir_rule and "deny" not in dir_rule:
            if not self.pattern_matcher.match_allow_patterns(self.current_path_str, dir_rule["allow"]):
                violations.append(self._create_allow_violation(matched_path))

        return violations

    def _is_test_file_in_root(self) -> bool:
        """Check if this is a test file in root directory."""
        if len(self.current_rel_path.parts) == 1:
            filename = self.current_rel_path.name.lower()
            return filename.startswith("test_") or filename.endswith("_test.py") or "test" in filename
        return False

    def _create_test_file_violation(self) -> LintViolation:
        """Create violation for test file in root."""
        return LintViolation(
            rule_id=self.current_rule_id,
            message=f"Test file '{self.current_rel_path}' should not be in project root",
            node=None,
            severity=Severity.ERROR,
            line_number=1,
            column_number=0,
            file_path=str(self.current_rel_path),
            suggestion="Move test files to test/ or tests/ directory to maintain project organization",
        )

    def _find_matching_directory_rule(self) -> tuple[dict[str, Any] | None, str | None]:
        """Find the most specific directory rule that matches the path."""
        best_match = None
        best_path = None
        best_depth = -1

        for dir_path, rules in self.current_directories.items():
            if self.current_path_str.startswith(dir_path) or (dir_path == "root" and "/" not in self.current_path_str):
                depth = len(dir_path.split("/"))
                if depth > best_depth:
                    best_match = rules
                    best_path = dir_path
                    best_depth = depth

        return best_match, best_path

    def _create_deny_violation(self, matched_path: str | None, reason: str | None) -> LintViolation:
        """Create violation for denied file."""
        message = f"File '{self.current_rel_path}' not allowed in {matched_path or 'this location'}"
        if reason:
            message = f"{message}: {reason}"

        return LintViolation(
            rule_id=self.current_rule_id,
            message=message,
            node=None,
            severity=Severity.ERROR,
            line_number=1,
            column_number=0,
            file_path=str(self.current_rel_path),
            suggestion=FileSuggestionGenerator.get_suggestion(self.current_rel_path.name, None),
        )

    def _create_allow_violation(self, matched_path: str | None) -> LintViolation:
        """Create violation for file not matching allow patterns."""
        message = (
            f"File '{self.current_rel_path}' does not match allowed patterns for {matched_path or 'this directory'}"
        )
        suggestion = f"Ensure file type is appropriate for {matched_path or 'this location'}"

        return LintViolation(
            rule_id=self.current_rule_id,
            message=message,
            node=None,
            severity=Severity.WARNING,
            line_number=1,
            column_number=0,
            file_path=str(self.current_rel_path),
            suggestion=suggestion,
        )


class FilePlacementChecker:
    """Handles the actual file placement validation logic."""

    def __init__(self, layout_rules: dict[str, Any]):
        """Initialize with layout rules."""
        self.layout_rules = layout_rules
        self.pattern_matcher = PatternMatcher()
        self.global_checker = GlobalPatternChecker(self.pattern_matcher)
        self.directory_checker = DirectoryRuleChecker(self.pattern_matcher)

    def check_file_placement(self, file_path: Path, rule_id: str) -> list[LintViolation]:
        """Check if file is properly placed according to layout rules."""
        violations = []

        # Get relative path from project root
        try:
            cwd = Path.cwd()
            rel_path = file_path.relative_to(cwd) if file_path.is_absolute() else file_path
        except ValueError as e:
            logger.debug("File is outside project directory: {}, error: {}", file_path, e)
            return violations

        # Convert to string for pattern matching
        path_str = str(rel_path).replace("\\", "/")

        # Check directory-specific rules first
        if "directories" in self.layout_rules:
            dir_violations = self.directory_checker.check_directory_rules(
                path_str, rel_path, self.layout_rules["directories"], rule_id
            )
            violations.extend(dir_violations)

        # Check global patterns only if not already flagged by directory rules
        if not violations and "global_patterns" in self.layout_rules:
            global_violations = self.global_checker.check_patterns(
                path_str, rel_path, self.layout_rules["global_patterns"], rule_id
            )
            violations.extend(global_violations)

        return violations


class FileSuggestionGenerator:
    """Generates suggestions for file placement."""

    @staticmethod
    def get_suggestion(filename: str, pattern: str | None) -> str:
        """Get suggestion for where to move a file based on its type."""
        if "test" in filename.lower():
            return "Move to test/ or tests/ directory"

        if filename.endswith((".ts", ".tsx", ".jsx")):
            return FileSuggestionGenerator._get_typescript_suggestion(filename)

        if filename.endswith(".py"):
            return FileSuggestionGenerator._get_python_suggestion(pattern)

        if filename.startswith("debug") or filename.startswith("temp"):
            return "Move to debug/ or tmp/ directory, or remove if not needed"

        if filename.endswith(".log"):
            return "Move to logs/ directory or add to .gitignore"

        return "Review file organization and move to appropriate directory"

    @staticmethod
    def _get_typescript_suggestion(filename: str) -> str:
        """Get suggestion for TypeScript/React files."""
        if "component" in filename.lower():
            return "Move to frontend/components/ or src/components/"
        elif "hook" in filename.lower():
            return "Move to frontend/hooks/ or src/hooks/"
        elif "util" in filename.lower() or "helper" in filename.lower():
            return "Move to frontend/utils/ or src/utils/"
        else:
            return "Move to frontend/src/ or appropriate frontend directory"

    @staticmethod
    def _get_python_suggestion(pattern: str | None) -> str:
        """Get suggestion for Python files."""
        if pattern and "debug" in pattern:
            return "Move to debug/ directory or remove debug code"
        else:
            return "Move to src/, lib/, or appropriate module directory"


class FileOrganizationRule(ASTLintRule):
    """Check file organization and placement."""

    def __init__(self, config: dict[str, Any] | None = None):
        """Initialize the rule with optional configuration."""
        super().__init__()
        self.config = config or {}
        layout_file = self.config.get("layout_file", ".ai/layout.yaml")

        # Load layout rules
        loader = LayoutRulesLoader(layout_file)
        layout_rules = loader.get_rules()

        # Store the layout rules on the instance
        self.layout_rules = layout_rules

        # Create placement checker
        self.placement_checker = FilePlacementChecker(layout_rules) if layout_rules else None

    @property
    def rule_id(self) -> str:
        """Return the unique identifier for this rule."""
        return "organization.file-placement"

    @property
    def rule_name(self) -> str:
        """Return the human-readable name for this rule."""
        return "File Organization and Placement"

    @property
    def description(self) -> str:
        """Return the description of what this rule checks."""
        return "Ensure files are placed in appropriate directories according to project structure"

    @property
    def severity(self) -> Severity:
        """Return the severity level of violations from this rule."""
        return Severity.INFO

    @property
    def categories(self) -> set[str]:
        """Return the categories this rule belongs to."""
        return {"organization", "structure"}

    def should_check_node(self, node: Any, context: LintContext) -> bool:
        """Only check Module nodes (file-level)."""
        import ast

        return isinstance(node, ast.Module)

    def check_node(self, node: Any, context: LintContext) -> list[LintViolation]:
        """Check if file is properly organized."""
        if not self.placement_checker:
            return []

        file_path = Path(context.file_path) if hasattr(context, "file_path") else None
        if not file_path:
            return []

        return self.placement_checker.check_file_placement(file_path, self.rule_id)
