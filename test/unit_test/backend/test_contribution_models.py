"""Unit tests for contribution Pydantic models.

Purpose: Unit tests for contribution API models and validation logic.
Scope: Testing Pydantic model validation, serialization, and business rules
Overview: This test module validates the behavior of contribution-related Pydantic
    models, ensuring that validation rules work correctly, required fields are
    enforced, and quality/spam detection logic functions as expected.
Dependencies: pytest, Pydantic models
Exports: Test functions for model validation
Interfaces: pytest test functions
Implementation: Uses pytest fixtures and parametrized tests
"""

import pytest
from pydantic import ValidationError

import sys
from pathlib import Path
# Add the backend app to the path so we can import from it
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "durable-code-app/backend"))

from app.db.models.contribution import (
    ContributionCategory,
    ContributionStatus,
)
from app.models.contribution import (
    ContributionFilter,
    ContributionResponse,
    ContributionReview,
    ContributionSubmit,
)


class TestContributionSubmit:
    """Test ContributionSubmit model validation."""

    def test_valid_submission(self):
        """Test creating a valid contribution submission."""
        submission = ContributionSubmit(
            prompt="Create a React component that displays user profile information with edit capabilities",
            context="Need to allow users to update their profile",
            category=ContributionCategory.FEATURE,
            examples=["Display name and email", "Allow editing", "Save changes"],
            github_username="testuser",
        )
        assert submission.prompt is not None
        assert submission.category == ContributionCategory.FEATURE
        assert len(submission.examples) == 3

    def test_prompt_too_short(self):
        """Test that short prompts are rejected."""
        with pytest.raises(ValidationError) as exc_info:
            ContributionSubmit(
                prompt="Fix bug",  # Too short
                category=ContributionCategory.BUG_FIX,
            )
        assert "at least 50 characters" in str(exc_info.value)

    def test_prompt_too_long(self):
        """Test that overly long prompts are rejected."""
        with pytest.raises(ValidationError) as exc_info:
            ContributionSubmit(
                prompt="x" * 2001,  # Exceeds max length
                category=ContributionCategory.OTHER,
            )
        assert "at most 2000 characters" in str(exc_info.value)

    def test_prompt_quality_validation(self):
        """Test prompt quality validation."""
        # Prompt without action words should fail
        with pytest.raises(ValidationError) as exc_info:
            ContributionSubmit(
                prompt="This is a description of something that needs to be done but without any action words specified here",
                category=ContributionCategory.OTHER,
            )
        assert "should describe a specific action" in str(exc_info.value)

    def test_spam_detection_urls(self):
        """Test that prompts with too many URLs are rejected."""
        with pytest.raises(ValidationError) as exc_info:
            ContributionSubmit(
                prompt="Visit http://spam1.com and http://spam2.com and http://spam3.com for amazing deals on everything",
                category=ContributionCategory.OTHER,
            )
        assert "too many URLs" in str(exc_info.value)

    def test_examples_validation(self):
        """Test examples field validation."""
        # Too many examples
        with pytest.raises(ValidationError) as exc_info:
            ContributionSubmit(
                prompt="Create a component that does many things with extensive functionality and features",
                examples=["Ex1", "Ex2", "Ex3", "Ex4", "Ex5", "Ex6"],  # Max is 5
            )
        assert "at most 5 items" in str(exc_info.value)

        # Example too long
        with pytest.raises(ValidationError) as exc_info:
            ContributionSubmit(
                prompt="Create a simple component that displays data in a clean and organized manner",
                examples=["x" * 501],  # Exceeds 500 char limit
            )
        assert "less than 500 characters" in str(exc_info.value)

    def test_optional_fields(self):
        """Test that optional fields can be omitted."""
        submission = ContributionSubmit(
            prompt="Implement a new authentication system that supports OAuth and traditional login methods",
        )
        assert submission.context is None
        assert submission.examples is None
        assert submission.github_username is None
        assert submission.email is None
        assert submission.category == ContributionCategory.OTHER  # Default


class TestContributionReview:
    """Test ContributionReview model validation."""

    def test_valid_approval(self):
        """Test valid approval review."""
        review = ContributionReview(
            status=ContributionStatus.APPROVED,
            review_notes="Good contribution",
            priority=7,
            create_github_issue=True,
        )
        assert review.status == ContributionStatus.APPROVED
        assert review.create_github_issue is True

    def test_rejection_requires_reason(self):
        """Test that rejection requires a reason."""
        with pytest.raises(ValidationError) as exc_info:
            ContributionReview(
                status=ContributionStatus.REJECTED,
                # Missing rejection_reason
            )
        assert "Rejection reason is required" in str(exc_info.value)

    def test_valid_rejection(self):
        """Test valid rejection with reason."""
        review = ContributionReview(
            status=ContributionStatus.REJECTED,
            rejection_reason="Not aligned with project goals",
            review_notes="Internal notes about the decision",
        )
        assert review.rejection_reason is not None

    def test_priority_validation(self):
        """Test priority value validation."""
        # Valid priority
        review = ContributionReview(
            status=ContributionStatus.APPROVED,
            priority=5,
        )
        assert review.priority == 5

        # Priority too high
        with pytest.raises(ValidationError):
            ContributionReview(
                status=ContributionStatus.APPROVED,
                priority=11,  # Max is 10
            )

        # Priority too low
        with pytest.raises(ValidationError):
            ContributionReview(
                status=ContributionStatus.APPROVED,
                priority=-1,  # Min is 0
            )


class TestContributionFilter:
    """Test ContributionFilter model validation."""

    def test_valid_filter(self):
        """Test creating valid filter parameters."""
        filter_params = ContributionFilter(
            status=ContributionStatus.PENDING,
            category=ContributionCategory.FEATURE,
            priority_min=3,
            priority_max=8,
            limit=50,
            offset=10,
        )
        assert filter_params.status == ContributionStatus.PENDING
        assert filter_params.limit == 50

    def test_priority_range_validation(self):
        """Test that priority range is validated."""
        with pytest.raises(ValidationError) as exc_info:
            ContributionFilter(
                priority_min=8,
                priority_max=3,  # Max less than min
            )
        assert "greater than priority_min" in str(exc_info.value)

    def test_limit_validation(self):
        """Test limit parameter validation."""
        # Too high
        with pytest.raises(ValidationError):
            ContributionFilter(limit=101)  # Max is 100

        # Too low
        with pytest.raises(ValidationError):
            ContributionFilter(limit=0)  # Min is 1

    def test_default_values(self):
        """Test default filter values."""
        filter_params = ContributionFilter()
        assert filter_params.limit == 20  # Default
        assert filter_params.offset == 0  # Default
        assert filter_params.status is None
        assert filter_params.category is None
