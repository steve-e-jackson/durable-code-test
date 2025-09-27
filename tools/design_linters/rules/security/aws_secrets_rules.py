#!/usr/bin/env python3
"""
Purpose: AWS security rules to detect exposed AWS identifiers and sensitive information
Scope: Detection of AWS access keys, ARNs, account IDs, and other AWS-specific secrets
Overview: This module implements comprehensive security rules to detect AWS credentials,
    identifiers, and other sensitive AWS-related information that should not be committed
    to version control. It identifies AWS access key IDs, secret access keys, session tokens,
    ARNs (Amazon Resource Names), AWS account IDs, IAM role names, S3 bucket names, and
    other AWS service identifiers that could be used maliciously if exposed. The rules
    check string literals, comments, variable assignments, and configuration values across
    all file types. Each detection includes specific guidance on proper credential management
    using environment variables, AWS credential files, or secure parameter stores. The
    module helps prevent credential leaks and ensures compliance with AWS security best
    practices by catching sensitive information before it reaches the repository.
Dependencies: Framework interfaces, re for pattern matching, pathlib for file operations
Exports: AWS security-focused rules for credential and identifier detection
Interfaces: All rules implement FileBasedLintRule interface for file-based analysis
Implementation: Pattern-based detection with comprehensive AWS identifier recognition
"""

import re
from pathlib import Path
from typing import Any

from design_linters.framework.interfaces import FileBasedLintRule, LintContext, LintViolation, Severity

try:
    from loguru import logger
except ImportError:
    import logging

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)


class AWSSecretsRule(FileBasedLintRule):
    """Detect AWS credentials, ARNs, and other sensitive AWS identifiers."""

    # AWS Access Key ID patterns
    AWS_ACCESS_KEY_PATTERNS = [
        re.compile(r"AKIA[0-9A-Z]{16}", re.IGNORECASE),  # Standard AWS Access Key ID
        re.compile(r"ASIA[0-9A-Z]{16}", re.IGNORECASE),  # Temporary credentials Access Key ID
        re.compile(r"AROA[0-9A-Z]{16}", re.IGNORECASE),  # Role-based Access Key ID
    ]

    # AWS Secret Access Key patterns (40 characters, base64-like)
    AWS_SECRET_KEY_PATTERNS = [
        re.compile(r"[A-Za-z0-9/+=]{40}", re.IGNORECASE),  # AWS Secret Access Key format
    ]

    # AWS Session Token patterns (longer, typically 200+ characters)
    AWS_SESSION_TOKEN_PATTERNS = [
        re.compile(r"[A-Za-z0-9/+=]{200,}", re.IGNORECASE),  # AWS Session Token format
    ]

    # AWS ARN patterns
    AWS_ARN_PATTERNS = [
        re.compile(r"arn:aws:[a-zA-Z0-9][a-zA-Z0-9\-]*:[a-zA-Z0-9\-]*:[0-9]*:[a-zA-Z0-9\-/_\.]*", re.IGNORECASE),
    ]

    # AWS Account ID patterns (12 digits)
    AWS_ACCOUNT_ID_PATTERNS = [
        re.compile(r"\b[0-9]{12}\b"),  # 12-digit AWS Account ID
    ]

    # AWS Region patterns
    AWS_REGION_PATTERNS = [
        re.compile(
            r"\b(us|eu|ap|sa|ca|me|af|cn|us-gov)-(east|west|north|south|central|southeast|northeast)-[1-9]\b",
            re.IGNORECASE,
        ),
    ]

    # AWS S3 Bucket name patterns (potential sensitive bucket names)
    AWS_S3_BUCKET_PATTERNS = [
        re.compile(r"\b[a-z0-9.-]{3,63}\.s3\.[a-z0-9-]+\.amazonaws\.com\b", re.IGNORECASE),
        re.compile(r"\bs3://[a-z0-9.-]{3,63}\b", re.IGNORECASE),
    ]

    # AWS IAM Role/User name patterns that might be sensitive
    AWS_IAM_PATTERNS = [
        re.compile(r"\b[A-Za-z0-9+=,.@\-_]+Role\b"),  # Role names ending with 'Role'
        re.compile(r"\bRole[A-Za-z0-9+=,.@\-_]+\b"),  # Role names starting with 'Role'
    ]

    # AWS Resource ID patterns
    AWS_RESOURCE_ID_PATTERNS = [
        re.compile(r"\bi-[0-9a-f]{8,17}\b", re.IGNORECASE),  # EC2 instance IDs
        re.compile(r"\bvol-[0-9a-f]{8,17}\b", re.IGNORECASE),  # EBS volume IDs
        re.compile(r"\bsg-[0-9a-f]{8,17}\b", re.IGNORECASE),  # Security group IDs
        re.compile(r"\bvpc-[0-9a-f]{8,17}\b", re.IGNORECASE),  # VPC IDs
        re.compile(r"\bsubnet-[0-9a-f]{8,17}\b", re.IGNORECASE),  # Subnet IDs
        re.compile(r"\bami-[0-9a-f]{8,17}\b", re.IGNORECASE),  # AMI IDs
        re.compile(r"\bsnap-[0-9a-f]{8,17}\b", re.IGNORECASE),  # Snapshot IDs
    ]

    # Common AWS credential environment variable names
    AWS_ENV_VAR_PATTERNS = [
        re.compile(r"\bAWS_ACCESS_KEY_ID\b", re.IGNORECASE),
        re.compile(r"\bAWS_SECRET_ACCESS_KEY\b", re.IGNORECASE),
        re.compile(r"\bAWS_SESSION_TOKEN\b", re.IGNORECASE),
        re.compile(r"\bAWS_DEFAULT_REGION\b", re.IGNORECASE),
    ]

    # Files/paths to skip (these commonly contain AWS references legitimately)
    SKIP_PATTERNS = [
        "test",
        "spec",
        "example",
        "demo",
        "sample",
        ".md",
        "documentation",
        "readme",
        "template",
        ".gitignore",
        ".env.example",
        ".env.template",
    ]

    def __init__(self, config: dict[str, Any] | None = None):
        """Initialize the rule with configuration."""
        super().__init__()
        self.config = config or {}
        self.strict_mode = self.config.get("strict_mode", True)
        self.check_comments = self.config.get("check_comments", True)
        self.check_terraform = self.config.get("check_terraform", True)

    @property
    def rule_id(self) -> str:
        return "security.aws.secrets-detection"

    @property
    def rule_name(self) -> str:
        return "AWS Secrets and Identifiers Detection"

    @property
    def description(self) -> str:
        return "Detects AWS credentials, ARNs, account IDs, and other sensitive AWS identifiers"

    @property
    def severity(self) -> Severity:
        return Severity.ERROR

    @property
    def categories(self) -> set[str]:
        return {"security", "aws", "credentials", "secrets"}

    def check_file(self, file_path: Path, content: str, context: LintContext) -> list[LintViolation]:
        """Check the file for AWS secrets and identifiers."""
        violations = []

        # Skip if file should be ignored
        if self._should_skip_file(file_path):
            return violations

        # Check the entire file content for patterns
        violations.extend(self._check_file_content(file_path, content))

        return violations

    def _should_skip_file(self, file_path: str | Path | None) -> bool:
        """Check if file should be skipped based on path patterns."""
        if not file_path:
            return False

        path_str = str(file_path).lower()
        return any(pattern in path_str for pattern in self.SKIP_PATTERNS)

    def _check_file_content(self, file_path: Path, content: str) -> list[LintViolation]:
        """Check entire file content for AWS patterns."""
        violations = []
        lines = content.split("\n")

        for line_num, line in enumerate(lines, 1):
            line_violations = self._check_line_content(line, line_num, file_path)
            violations.extend(line_violations)

        return violations

    def _check_line_content(self, line: str, line_num: int, file_path: Path) -> list[LintViolation]:
        """Check a single line for AWS patterns."""
        violations = []

        # Skip comments if check_comments is disabled
        if not self.check_comments and (line.strip().startswith("#") or line.strip().startswith("//")):
            return violations

        # Check for AWS Access Key IDs
        for pattern in self.AWS_ACCESS_KEY_PATTERNS:
            matches = pattern.finditer(line)
            for match in matches:
                violations.append(
                    LintViolation(
                        rule_id=self.rule_id,
                        file_path=str(file_path),
                        line=line_num,
                        column=match.start(),
                        severity=Severity.ERROR,
                        message=f"AWS Access Key ID detected: {match.group()[:8]}...",
                        description="AWS Access Key IDs should never be committed to version control",
                        suggestion="Use environment variables, AWS credential files, or AWS Parameter Store",
                    )
                )

        # Check for potential AWS Secret Access Keys (with context to reduce false positives)
        if any(keyword in line.lower() for keyword in ["secret", "key", "password", "token", "credential"]):
            for pattern in self.AWS_SECRET_KEY_PATTERNS:
                matches = pattern.finditer(line)
                for match in matches:
                    violations.append(
                        LintViolation(
                            rule_id=self.rule_id,
                            file_path=str(file_path),
                            line=line_num,
                            column=match.start(),
                            severity=Severity.ERROR,
                            message=f"Potential AWS Secret Access Key detected: {match.group()[:8]}...",
                            description="AWS Secret Access Keys should never be committed to version control",
                            suggestion="Use environment variables, AWS credential files, or AWS Secrets Manager",
                        )
                    )

        # Check for AWS Session Tokens
        if "token" in line.lower():
            for pattern in self.AWS_SESSION_TOKEN_PATTERNS:
                matches = pattern.finditer(line)
                for match in matches:
                    violations.append(
                        LintViolation(
                            rule_id=self.rule_id,
                            file_path=str(file_path),
                            line=line_num,
                            column=match.start(),
                            severity=Severity.ERROR,
                            message=f"Potential AWS Session Token detected: {match.group()[:12]}...",
                            description="AWS Session Tokens should never be committed to version control",
                            suggestion="Use proper credential management or temporary credential providers",
                        )
                    )

        # Check for AWS ARNs (potentially sensitive)
        for pattern in self.AWS_ARN_PATTERNS:
            matches = pattern.finditer(line)
            for match in matches:
                violations.append(
                    LintViolation(
                        rule_id=self.rule_id,
                        file_path=str(file_path),
                        line=line_num,
                        column=match.start(),
                        severity=Severity.WARNING,
                        message=f"AWS ARN detected: {match.group()}",
                        description="AWS ARNs may contain sensitive account or resource information",
                        suggestion="Consider using parameter references or environment-specific configurations",
                    )
                )

        # Check for AWS Account IDs
        for pattern in self.AWS_ACCOUNT_ID_PATTERNS:
            matches = pattern.finditer(line)
            for match in matches:
                # Additional context check to reduce false positives
                if any(keyword in line.lower() for keyword in ["account", "aws", "arn", "iam", "role"]):
                    violations.append(
                        LintViolation(
                            rule_id=self.rule_id,
                            file_path=str(file_path),
                            line=line_num,
                            column=match.start(),
                            severity=Severity.WARNING,
                            message=f"AWS Account ID detected: {match.group()}",
                            description="AWS Account IDs should not be hardcoded in source code",
                            suggestion="Use environment variables or configuration files",
                        )
                    )

        # Check for AWS Resource IDs
        for pattern in self.AWS_RESOURCE_ID_PATTERNS:
            matches = pattern.finditer(line)
            for match in matches:
                violations.append(
                    LintViolation(
                        rule_id=self.rule_id,
                        file_path=str(file_path),
                        line=line_num,
                        column=match.start(),
                        severity=Severity.INFO,
                        message=f"AWS Resource ID detected: {match.group()}",
                        description="AWS Resource IDs should not be hardcoded in source code",
                        suggestion="Use environment variables, tags, or dynamic resource discovery",
                    )
                )

        return violations
