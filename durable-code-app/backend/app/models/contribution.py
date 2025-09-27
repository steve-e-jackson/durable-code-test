"""Pydantic models for contribution API endpoints.

Purpose: Pydantic models for contribution API request/response validation and serialization.
Scope: API contract definitions for contribution submission, review, and management endpoints
Overview: This module defines Pydantic models that enforce validation rules and type safety
    for all contribution-related API operations. It includes models for submission requests,
    response formats, admin review operations, and search filters. The models implement
    comprehensive validation including prompt quality checks, content sanitization, and
    field constraints to ensure data integrity and prevent malicious input.
Dependencies: Pydantic for validation, datetime for timestamps, typing for type hints
Exports: ContributionSubmit, ContributionResponse, ContributionReview, and filter models
Interfaces: Pydantic BaseModel with validators and Field constraints
Implementation: Uses Pydantic v2 with custom validators for business logic validation
"""

from datetime import datetime

from pydantic import BaseModel, Field, validator

from ..db.models.contribution import ContributionCategory, ContributionStatus


class ContributionSubmit(BaseModel):
    """Model for contribution submission requests.

    Validates and sanitizes user-submitted contribution data.
    """

    prompt: str = Field(
        ...,
        min_length=50,
        max_length=2000,
        description="The AI prompt describing the desired functionality",
    )
    context: str | None = Field(
        None,
        max_length=1000,
        description="Additional context or background information",
    )
    category: ContributionCategory = Field(
        ContributionCategory.OTHER,
        description="Category of the contribution",
    )
    examples: list[str] | None = Field(  # type: ignore[call-overload]
        default=None,
        max_items=5,
        description="Example prompts or expected outputs",
    )
    github_username: str | None = Field(
        default=None,
        max_length=255,
        description="GitHub username for attribution",
    )
    email: str | None = Field(
        default=None,
        max_length=255,
        description="Email for updates (optional)",
    )
    captcha_token: str | None = Field(
        default=None,
        description="CAPTCHA verification token for anonymous submissions",
    )

    @validator("prompt")
    def validate_prompt_quality(cls, v: str) -> str:
        """Validate prompt meets quality standards."""
        # Check for minimum word count
        word_count = len(v.split())
        if word_count < 10:
            raise ValueError("Prompt must contain at least 10 words")

        # Check for actionable language
        action_words = ["create", "add", "implement", "fix", "improve", "update", "refactor", "build"]
        if not any(word.lower() in v.lower() for word in action_words):
            raise ValueError("Prompt should describe a specific action (e.g., create, add, fix)")

        # Basic spam detection
        if v.count("http") > 2 or v.count("www.") > 2:
            raise ValueError("Prompt contains too many URLs")

        return v.strip()

    @validator("examples")
    def validate_examples(cls, v: list[str] | None) -> list[str] | None:
        """Validate example format and content."""
        if not v:
            return v

        cleaned = []
        for example in v:
            if len(example) > 500:
                raise ValueError("Each example must be less than 500 characters")
            cleaned.append(example.strip())

        return cleaned

    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "Create a React component that displays real-time server metrics with auto-refresh",
                "context": "Need to monitor server health in the admin dashboard",
                "category": "feature",
                "examples": ["CPU usage graph", "Memory usage chart", "Request rate counter"],
                "github_username": "developer123",
            }
        }


class ContributionResponse(BaseModel):
    """Model for contribution API responses.

    Represents a contribution in API responses with appropriate field filtering.
    """

    id: str  # Using UUID strings for DynamoDB
    prompt: str
    context: str | None
    examples: str | None  # JSON string of examples list
    category: ContributionCategory
    status: ContributionStatus
    priority: int
    quality_score: int | None
    github_username: str | None
    github_issue_url: str | None
    submitted_at: datetime
    reviewed_at: datetime | None

    class Config:
        from_attributes = True


class ContributionReview(BaseModel):
    """Model for admin review actions on contributions."""

    status: ContributionStatus = Field(
        ...,
        description="New status for the contribution",
    )
    review_notes: str | None = Field(
        None,
        max_length=1000,
        description="Internal notes about the review",
    )
    rejection_reason: str | None = Field(
        None,
        max_length=500,
        description="Public reason for rejection (shown to submitter)",
    )
    priority: int | None = Field(
        None,
        ge=0,
        le=10,
        description="Priority level (0-10, higher is more important)",
    )
    create_github_issue: bool = Field(
        False,
        description="Whether to create a GitHub issue for approved contribution",
    )

    @validator("rejection_reason")
    def validate_rejection_reason(cls, v: str | None, values: dict) -> str | None:
        """Ensure rejection reason is provided when rejecting."""
        if values.get("status") == ContributionStatus.REJECTED and not v:
            raise ValueError("Rejection reason is required when rejecting a contribution")
        return v


class ContributionFilter(BaseModel):
    """Model for filtering contributions in admin interface."""

    status: ContributionStatus | None = None
    category: ContributionCategory | None = None
    priority_min: int | None = Field(default=None, ge=0, le=10)
    priority_max: int | None = Field(default=None, ge=0, le=10)
    quality_score_min: int | None = Field(default=None, ge=0, le=100)
    has_github_issue: bool | None = None
    is_anonymous: bool | None = None
    search: str | None = Field(default=None, max_length=100)
    limit: int = Field(20, ge=1, le=100)
    offset: int = Field(0, ge=0)

    @validator("priority_max")
    def validate_priority_range(cls, v: int | None, values: dict) -> int | None:
        """Ensure max priority is greater than min priority."""
        if v is not None and values.get("priority_min") is not None and v < values["priority_min"]:
            raise ValueError("priority_max must be greater than priority_min")
        return v


class ContributionStats(BaseModel):
    """Model for contribution statistics dashboard."""

    total_submissions: int
    pending_review: int
    approved: int
    rejected: int
    spam: int
    github_issues_created: int
    average_quality_score: float | None
    submissions_today: int
    submissions_this_week: int
    top_categories: list[dict]  # List of {category: str, count: int}


class GitHubIssueCreate(BaseModel):
    """Model for creating GitHub issues from contributions."""

    title: str = Field(
        ...,
        max_length=256,
        description="GitHub issue title",
    )
    body: str = Field(
        ...,
        description="GitHub issue body in Markdown format",
    )
    labels: list[str] = Field(
        default_factory=lambda: ["ai-contribution", "needs-triage"],
        description="Labels to apply to the issue",
    )
    assignees: list[str] | None = Field(
        None,
        description="GitHub usernames to assign",
    )
