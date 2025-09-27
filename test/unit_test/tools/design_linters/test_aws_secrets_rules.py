#!/usr/bin/env python3
"""
Purpose: Unit tests for AWS secrets and identifiers detection linting rule
Scope: Testing AWS credential, ARN, and identifier detection across various scenarios
Overview: This comprehensive test suite validates the AWSSecretsRule implementation, ensuring
    it correctly identifies AWS access keys, secret access keys, session tokens, ARNs, account IDs,
    resource identifiers, and other sensitive AWS information. Tests cover various formats and
    contexts including string literals, variable assignments, comments, and file content. The
    suite verifies pattern matching accuracy, false positive prevention, file type handling,
    and proper error reporting with appropriate severity levels. It also tests edge cases like
    legitimate test files, documentation, and configuration templates that should be skipped.
    The tests ensure the rule provides actionable security guidance while maintaining usability.
Dependencies: pytest, ast, pathlib, design_linters framework
Exports: Test classes and fixtures for AWSSecretsRule validation
Interfaces: pytest test cases following standard test patterns
Implementation: Uses pytest fixtures and parameterized tests for comprehensive coverage
"""

import ast
from pathlib import Path
from unittest.mock import patch

import pytest
from design_linters.framework.interfaces import LintContext, Severity
from design_linters.rules.security.aws_secrets_rules import AWSSecretsRule


class TestAWSSecretsRule:
    """Test suite for AWSSecretsRule."""

    @pytest.fixture
    def rule(self):
        """Create an AWSSecretsRule instance."""
        return AWSSecretsRule()

    @pytest.fixture
    def context(self):
        """Create a basic lint context."""
        ctx = LintContext()
        ctx.file_path = "aws_config.py"  # Use non-test filename
        ctx.file_content = ""
        ctx.ast_tree = ast.parse("")
        return ctx

    def test_rule_properties(self, rule):
        """Test rule metadata properties."""
        assert rule.rule_id == "security.aws.secrets-detection"
        assert rule.rule_name == "AWS Secrets and Identifiers Detection"
        assert rule.severity == Severity.ERROR
        assert "security" in rule.categories
        assert "aws" in rule.categories
        assert "credentials" in rule.categories

    def test_aws_access_key_detection(self, rule, context):
        """Test detection of AWS Access Key IDs."""
        test_cases = [
            "AKIAIOSFODNN7EXAMPLE",  # Standard AWS Access Key ID
            "ASIAIOSFODNN7EXAMPLE",  # Temporary credentials Access Key ID
            "AROAIOSFODNN7EXAMPLE",  # Role-based Access Key ID
        ]

        for access_key in test_cases:
            content = f'aws_access_key = "{access_key}"'
            context.file_content = content
            context.ast_tree = ast.parse(content)

            violations = rule.check(context)

            assert len(violations) > 0, f"Should detect access key: {access_key}"
            violation = next((v for v in violations if "Access Key ID" in v.message), None)
            assert violation is not None, f"Should detect access key in: {content}"
            assert violation.severity == Severity.ERROR
            assert "environment variables" in violation.suggestion

    def test_aws_secret_key_detection(self, rule, context):
        """Test detection of potential AWS Secret Access Keys."""
        # AWS Secret Access Keys are 40 characters, base64-like
        secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

        content = f'aws_secret_key = "{secret_key}"'
        context.file_content = content
        context.ast_tree = ast.parse(content)

        violations = rule.check(context)

        assert len(violations) > 0
        violation = next((v for v in violations if "Secret Access Key" in v.message), None)
        assert violation is not None
        assert violation.severity == Severity.ERROR
        assert "AWS Secrets Manager" in violation.suggestion

    def test_aws_arn_detection(self, rule, context):
        """Test detection of AWS ARNs."""
        test_arns = [
            "arn:aws:iam::123456789012:user/username",
            "arn:aws:s3:::my-bucket/my-key",
            "arn:aws:ec2:us-east-1:123456789012:instance/i-1234567890abcdef0",
            "arn:aws:lambda:us-east-1:123456789012:function:my-function",
        ]

        for arn in test_arns:
            content = f'resource_arn = "{arn}"'
            context.file_content = content
            context.ast_tree = ast.parse(content)

            violations = rule.check(context)

            assert len(violations) > 0, f"Should detect ARN: {arn}"
            violation = next((v for v in violations if "AWS ARN detected" in v.message), None)
            assert violation is not None
            assert violation.severity == Severity.WARNING
            assert "parameter references" in violation.suggestion

    def test_aws_account_id_detection(self, rule, context):
        """Test detection of AWS Account IDs."""
        content = 'account_id = "123456789012"  # AWS account ID'
        context.file_content = content
        context.ast_tree = ast.parse(content)

        violations = rule.check(context)

        assert len(violations) > 0
        violation = next((v for v in violations if "Account ID detected" in v.message), None)
        assert violation is not None
        assert violation.severity == Severity.WARNING
        assert "environment variables" in violation.suggestion

    def test_aws_resource_id_detection(self, rule, context):
        """Test detection of AWS Resource IDs."""
        test_resources = [
            "i-1234567890abcdef0",  # EC2 instance ID
            "vol-1234567890abcdef0",  # EBS volume ID
            "sg-1234567890abcdef0",  # Security group ID
            "vpc-1234567890abcdef0",  # VPC ID
            "subnet-1234567890abcdef0",  # Subnet ID
            "ami-1234567890abcdef0",  # AMI ID
            "snap-1234567890abcdef0",  # Snapshot ID
        ]

        for resource_id in test_resources:
            content = f'resource = "{resource_id}"'
            context.file_content = content
            context.ast_tree = ast.parse(content)

            violations = rule.check(context)

            assert len(violations) > 0, f"Should detect resource ID: {resource_id}"
            violation = next((v for v in violations if "Resource ID detected" in v.message), None)
            assert violation is not None
            assert violation.severity == Severity.INFO
            assert "environment variables" in violation.suggestion


    def test_file_skipping(self, rule):
        """Test that certain file types are skipped."""
        skip_files = [
            "test_something.py",
            "spec_file.py",
            "example.py",
            "demo.py",
            "sample.py",
            "documentation.md",
            "README.md",
            "template.py",
            ".env.example",
            ".gitignore",
        ]

        for file_path in skip_files:
            assert rule._should_skip_file(file_path), f"Should skip file: {file_path}"

    def test_no_false_positives(self, rule, context):
        """Test that legitimate content doesn't trigger false positives."""
        legitimate_content = [
            'print("Hello World")',  # Regular string
            'user_id = "12345"',  # Short number
            'config = {"timeout": 30}',  # Regular config
            'name = "test-bucket"',  # Regular name without AWS patterns
        ]

        for content in legitimate_content:
            context.file_content = content
            context.ast_tree = ast.parse(content)

            violations = rule.check(context)

            # Should not have any high-severity violations for legitimate content
            error_violations = [v for v in violations if v.severity == Severity.ERROR]
            assert len(error_violations) == 0, f"Should not flag legitimate content: {content}"

    def test_session_token_detection(self, rule, context):
        """Test detection of AWS Session Tokens."""
        # Session tokens are much longer (200+ characters)
        session_token = "A" * 220  # Simulate a long session token
        content = f'session_token = "{session_token}"'
        context.file_content = content
        context.ast_tree = ast.parse(content)

        violations = rule.check(context)

        violation = next((v for v in violations if "Session Token" in v.message), None)
        assert violation is not None
        assert violation.severity == Severity.ERROR

    def test_multiline_content_detection(self, rule, context):
        """Test detection across multiple lines."""
        content = '''
# Configuration file
aws_config = {
    "access_key": "AKIAIOSFODNN7EXAMPLE",
    "secret_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "region": "us-east-1",
    "account_id": "123456789012"
}
'''
        context.file_content = content
        context.ast_tree = ast.parse(content)

        violations = rule.check(context)

        # Should detect multiple violations
        assert len(violations) >= 3  # At least access key, secret key, and account ID

        # Check that we have violations of different types
        violation_messages = [v.message for v in violations]
        assert any("Access Key ID" in msg for msg in violation_messages)
        assert any("Secret Access Key" in msg for msg in violation_messages)
        assert any("Account ID" in msg for msg in violation_messages)

    def test_comment_detection(self, rule, context):
        """Test detection in comments."""
        content = '# AWS Access Key: AKIAIOSFODNN7EXAMPLE'
        context.file_content = content
        context.ast_tree = ast.parse("")  # Comments aren't in AST

        violations = rule.check(context)

        assert len(violations) > 0
        violation = next((v for v in violations if "Access Key ID" in v.message), None)
        assert violation is not None

    def test_comment_skipping_when_disabled(self, rule, context):
        """Test that comments are skipped when check_comments is disabled."""
        rule.check_comments = False
        content = '# AWS Access Key: AKIAIOSFODNN7EXAMPLE'
        context.file_content = content
        context.ast_tree = ast.parse("")

        violations = rule.check(context)

        # Should not detect in comments when disabled
        access_key_violations = [v for v in violations if "Access Key ID" in v.message]
        assert len(access_key_violations) == 0

    def test_string_literal_detection(self, rule, context):
        """Test detection in string literals within AST."""
        content = 'key = "AKIAIOSFODNN7EXAMPLE"'
        context.file_content = content
        context.ast_tree = ast.parse(content)

        violations = rule.check(context)

        assert len(violations) > 0
        violation = next((v for v in violations if "Access Key ID" in v.message), None)
        assert violation is not None

    def test_severity_levels(self, rule, context):
        """Test that different patterns have appropriate severity levels."""
        content = '''
access_key = "AKIAIOSFODNN7EXAMPLE"  # Should be ERROR
arn = "arn:aws:iam::123456789012:user/test"  # Should be WARNING
resource_id = "i-1234567890abcdef0"  # Should be INFO
'''
        context.file_content = content
        context.ast_tree = ast.parse(content)

        violations = rule.check(context)

        # Check severity levels
        access_key_violation = next((v for v in violations if "Access Key ID" in v.message), None)
        assert access_key_violation.severity == Severity.ERROR

        arn_violation = next((v for v in violations if "AWS ARN" in v.message), None)
        assert arn_violation.severity == Severity.WARNING

        resource_violation = next((v for v in violations if "Resource ID" in v.message), None)
        assert resource_violation.severity == Severity.INFO

    @pytest.mark.parametrize(
        "file_type,should_skip",
        [
            ("main.py", False),
            ("test_main.py", True),
            ("example.py", True),
            ("config.py", False),
            ("readme.md", True),
            ("template.yaml", True),
        ],
    )
    def test_file_type_skipping(self, rule, file_type, should_skip):
        """Test file type skipping logic."""
        assert rule._should_skip_file(file_type) == should_skip

    def test_context_based_detection(self, rule, context):
        """Test that context keywords improve detection accuracy."""
        # Account ID should be detected when in AWS context
        content_with_context = 'aws_account = "123456789012"'
        context.file_content = content_with_context
        context.ast_tree = ast.parse(content_with_context)

        violations = rule.check(context)
        account_violations = [v for v in violations if "Account ID" in v.message]
        assert len(account_violations) > 0

        # Random 12-digit number without AWS context should not be detected
        content_without_context = 'phone_number = "123456789012"'
        context.file_content = content_without_context
        context.ast_tree = ast.parse(content_without_context)

        violations = rule.check(context)
        account_violations = [v for v in violations if "Account ID" in v.message]
        assert len(account_violations) == 0

    def test_configuration_options(self):
        """Test rule configuration options."""
        # Test strict mode disabled
        rule_lenient = AWSSecretsRule({"strict_mode": False})
        assert rule_lenient.strict_mode is False

        # Test comment checking disabled
        rule_no_comments = AWSSecretsRule({"check_comments": False})
        assert rule_no_comments.check_comments is False

        # Test terraform checking disabled
        rule_no_terraform = AWSSecretsRule({"check_terraform": False})
        assert rule_no_terraform.check_terraform is False
