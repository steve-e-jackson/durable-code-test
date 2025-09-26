"""Data models for contribution storage.

Purpose: Simple data models and enums for contribution management.
Scope: Data structure definitions for DynamoDB storage
Overview: This module defines the data structures and enumerations used
    for contribution storage in DynamoDB. These are not ORM models but
    simple Python classes and enums that define the shape of our data.
Dependencies: Python enums and dataclasses
Exports: ContributionStatus, ContributionCategory enums
Interfaces: Simple data structures for type safety
Implementation: Uses Python enums for status and category values
"""

from enum import Enum


class ContributionStatus(str, Enum):
    """Status values for contribution review workflow."""

    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    IMPLEMENTED = "implemented"
    SPAM = "spam"


class ContributionCategory(str, Enum):
    """Categories for contribution classification."""

    FEATURE = "feature"
    BUG_FIX = "bug_fix"
    IMPROVEMENT = "improvement"
    DOCUMENTATION = "documentation"
    TESTING = "testing"
    REFACTORING = "refactoring"
    PERFORMANCE = "performance"
    SECURITY = "security"
    OTHER = "other"
