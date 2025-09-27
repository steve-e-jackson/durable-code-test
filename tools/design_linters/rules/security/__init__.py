#!/usr/bin/env python3
"""
Purpose: Security-focused linting rules for API protection and vulnerability detection
Scope: Comprehensive security analysis for web applications, APIs, and general Python code
Overview: This package provides essential security validation rules that detect common vulnerabilities
    and enforce security best practices across API endpoints, authentication mechanisms, input
    validation, and data handling. It includes rules for detecting missing rate limiting on API
    endpoints, inadequate input validation that could lead to injection attacks, hardcoded
    secrets and credentials in source code, missing security headers in web applications,
    and overly broad exception handling that could mask security issues. Each rule provides
    specific guidance for remediation with code examples and references to security standards.
    The rules are designed to integrate seamlessly with CI/CD pipelines to prevent security
    vulnerabilities from reaching production environments.
Dependencies: Framework interfaces for rule implementation, AST analysis for code inspection
Exports: API security rules, credential detection rules, header validation rules
Interfaces: All rules implement ASTLintRule interface for consistent integration
Implementation: Pattern-based analysis with focus on OWASP security guidelines
"""
