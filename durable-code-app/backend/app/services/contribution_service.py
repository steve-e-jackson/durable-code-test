"""Service layer for contribution management using DynamoDB.

Purpose: Service layer implementing business logic for contribution submission and management.
Scope: Contribution validation, storage, retrieval, and review workflow orchestration
Overview: This service provides the core business logic for the contribution system,
    handling submission validation, spam detection, quality scoring, DynamoDB operations,
    and integration with external services. It acts as the intermediary between API
    endpoints and the DynamoDB storage layer, ensuring data consistency and
    enforcing business rules. The service includes comprehensive validation, spam
    prevention, and audit logging for all operations.
Dependencies: DynamoDB client, Pydantic for validation, GitHub service integration
Exports: ContributionService class with methods for all contribution operations
Interfaces: Async methods for CRUD operations and workflow management
Implementation: Service pattern with DynamoDB backend
"""

import json
from datetime import datetime

from loguru import logger

from ..core.exceptions import ResourceNotFoundError, ServiceError, ValidationError
from ..core.rate_limit import contribution_rate_limiter
from ..db.dynamodb_client import DynamoDBClient
from ..db.models.contribution import ContributionCategory, ContributionStatus
from ..models.contribution import (
    ContributionFilter,
    ContributionResponse,
    ContributionReview,
    ContributionStats,
    ContributionSubmit,
)
from .github_service import GitHubService


class ContributionService:
    """Service for managing contribution submissions and reviews."""

    def __init__(self) -> None:
        """Initialize the service with DynamoDB client."""
        self.db_client = DynamoDBClient()
        self.github_service = GitHubService()

    async def submit_contribution(
        self,
        submission: ContributionSubmit,
        ip_address: str,
        user_agent: str | None = None,
    ) -> ContributionResponse:
        """Submit a new contribution for review.

        Args:
            submission: The contribution submission data
            ip_address: IP address of the submitter
            user_agent: User agent string of the submitter

        Returns:
            The created contribution

        Raises:
            ValidationError: If submission validation fails
            ServiceError: If submission cannot be processed
        """
        # Check rate limiting
        allowed, reason = contribution_rate_limiter.check_submission_allowed(ip_address)
        if not allowed:
            contribution_rate_limiter.record_submission(ip_address, success=False)
            raise ValidationError(reason, details={"ip": ip_address})

        try:
            # Calculate quality score
            quality_score = self._calculate_quality_score(submission)

            # Check for spam
            spam_score = self._calculate_spam_score(submission, ip_address)
            if spam_score > 70:
                contribution_rate_limiter.record_submission(ip_address, success=False)
                raise ValidationError("Submission flagged as potential spam", details={"spam_score": spam_score})

            # Create contribution data
            contribution_data = {
                "prompt": submission.prompt,
                "context": submission.context,
                "category": submission.category.value,
                "examples": json.dumps(submission.examples) if submission.examples else None,
                "github_username": submission.github_username,
                "submitter_email": submission.email,
                "is_anonymous": not submission.github_username,
                "status": ContributionStatus.PENDING.value,
                "quality_score": quality_score,
                "spam_score": spam_score,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "captcha_verified": bool(submission.captcha_token),
                "priority": 0,
                "submitted_at": datetime.utcnow().isoformat(),
            }

            # Store in DynamoDB
            stored = await self.db_client.put_contribution(contribution_data)

            # Record successful submission
            contribution_rate_limiter.record_submission(ip_address, success=True)

            logger.info(f"New contribution submitted: ID={stored['id']}, Quality={quality_score}")

            # Convert to response model
            return ContributionResponse(
                id=stored["id"],
                prompt=stored["prompt"],
                context=stored.get("context"),
                category=ContributionCategory(stored["category"]),
                status=ContributionStatus(stored["status"]),
                priority=stored.get("priority", 0),
                quality_score=stored.get("quality_score"),
                github_username=stored.get("github_username"),
                github_issue_url=stored.get("github_issue_url"),
                submitted_at=datetime.fromisoformat(stored["submitted_at"]),
                reviewed_at=datetime.fromisoformat(stored["reviewed_at"]) if stored.get("reviewed_at") else None,
            )

        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Failed to submit contribution: {e}")
            raise ServiceError(f"Failed to process contribution: {str(e)}") from e

    async def get_contribution(self, contribution_id: str) -> ContributionResponse:
        """Get a contribution by ID.

        Args:
            contribution_id: The contribution ID

        Returns:
            The contribution data

        Raises:
            ResourceNotFoundError: If contribution not found
        """
        contribution = await self.db_client.get_contribution(contribution_id)

        if not contribution:
            raise ResourceNotFoundError(
                f"Contribution with ID {contribution_id} not found",
                resource_type="contribution",
                resource_id=contribution_id,
            )

        return ContributionResponse(
            id=contribution["id"],
            prompt=contribution["prompt"],
            context=contribution.get("context"),
            category=ContributionCategory(contribution["category"]),
            status=ContributionStatus(contribution["status"]),
            priority=contribution.get("priority", 0),
            quality_score=contribution.get("quality_score"),
            github_username=contribution.get("github_username"),
            github_issue_url=contribution.get("github_issue_url"),
            submitted_at=datetime.fromisoformat(contribution["submitted_at"]),
            reviewed_at=(
                datetime.fromisoformat(contribution["reviewed_at"]) if contribution.get("reviewed_at") else None
            ),
        )

    async def list_contributions(
        self,
        filter_params: ContributionFilter,
        is_admin: bool = False,
    ) -> list[ContributionResponse]:
        """List contributions with filtering and pagination.

        Args:
            filter_params: Filtering and pagination parameters
            is_admin: Whether to include all statuses (admin view)

        Returns:
            List of contributions matching criteria
        """
        # For public view, only show approved contributions
        status_filter = None
        if not is_admin:
            status_filter = ContributionStatus.APPROVED.value
        elif filter_params.status:
            status_filter = filter_params.status.value

        # Get contributions from DynamoDB
        contributions, _ = await self.db_client.list_contributions(
            status=status_filter,
            limit=filter_params.limit,
        )

        # Convert to response models
        results = []
        for contrib in contributions:
            try:
                results.append(
                    ContributionResponse(
                        id=contrib["id"],
                        prompt=contrib["prompt"],
                        context=contrib.get("context"),
                        category=ContributionCategory(contrib.get("category", "other")),
                        status=ContributionStatus(contrib.get("status", "pending")),
                        priority=contrib.get("priority", 0),
                        quality_score=contrib.get("quality_score"),
                        github_username=contrib.get("github_username"),
                        github_issue_url=contrib.get("github_issue_url"),
                        submitted_at=datetime.fromisoformat(contrib["submitted_at"]),
                        reviewed_at=(
                            datetime.fromisoformat(contrib["reviewed_at"]) if contrib.get("reviewed_at") else None
                        ),
                    )
                )
            except Exception as e:
                logger.error(f"Error converting contribution: {e}")
                continue

        return results

    async def review_contribution(
        self,
        contribution_id: str,
        review: ContributionReview,
        reviewer: str,
    ) -> ContributionResponse:
        """Review and update a contribution's status.

        Args:
            contribution_id: The contribution to review
            review: Review details and new status
            reviewer: Username of the reviewer

        Returns:
            Updated contribution

        Raises:
            ResourceNotFoundError: If contribution not found
            ServiceError: If review operation fails
        """
        # Get the contribution
        contribution = await self.db_client.get_contribution(contribution_id)

        if not contribution:
            raise ResourceNotFoundError(
                f"Contribution {contribution_id} not found",
                resource_type="contribution",
                resource_id=contribution_id,
            )

        try:
            # Prepare update data
            updates = {
                "status": review.status.value,
                "reviewed_by": reviewer,
                "reviewed_at": datetime.utcnow().isoformat(),
            }

            if review.review_notes:
                updates["review_notes"] = review.review_notes
            if review.rejection_reason:
                updates["rejection_reason"] = review.rejection_reason
            if review.priority is not None:
                updates["priority"] = review.priority

            # Create GitHub issue if approved and requested
            if review.status == ContributionStatus.APPROVED and review.create_github_issue:
                try:
                    # Create a mock contribution object for the GitHub service
                    class MockContribution:
                        def __init__(self, data):
                            self.id = data["id"]
                            self.prompt = data["prompt"]
                            self.context = data.get("context")
                            self.category = data.get("category", "other")
                            self.examples = data.get("examples")
                            self.github_username = data.get("github_username")
                            self.priority = data.get("priority", 0)
                            self.quality_score = data.get("quality_score")

                    mock_contrib = MockContribution(contribution)
                    issue_data = await self.github_service.create_issue_from_contribution(mock_contrib)
                    updates["github_issue_id"] = issue_data["number"]
                    updates["github_issue_url"] = issue_data["url"]
                    logger.info(f"Created GitHub issue for contribution {contribution_id}")
                except Exception as e:
                    logger.error(f"Failed to create GitHub issue: {e}")
                    # Don't fail the review if GitHub creation fails

            # Update in DynamoDB
            updated = await self.db_client.update_contribution(contribution_id, updates)

            logger.info(f"Contribution {contribution_id} reviewed: status={review.status.value}, reviewer={reviewer}")

            return ContributionResponse(
                id=updated["id"],
                prompt=updated["prompt"],
                context=updated.get("context"),
                category=ContributionCategory(updated.get("category", "other")),
                status=ContributionStatus(updated["status"]),
                priority=updated.get("priority", 0),
                quality_score=updated.get("quality_score"),
                github_username=updated.get("github_username"),
                github_issue_url=updated.get("github_issue_url"),
                submitted_at=datetime.fromisoformat(updated["submitted_at"]),
                reviewed_at=datetime.fromisoformat(updated["reviewed_at"]),
            )

        except Exception as e:
            logger.error(f"Failed to review contribution: {e}")
            raise ServiceError(f"Failed to process review: {str(e)}") from e

    async def get_statistics(self) -> ContributionStats:
        """Get contribution statistics for the dashboard.

        Returns:
            Statistics summary
        """
        try:
            stats = await self.db_client.get_statistics()

            # Add default values for missing fields
            return ContributionStats(
                total_submissions=stats.get("total_submissions", 0),
                pending_review=stats.get("pending_review", 0),
                approved=stats.get("approved", 0),
                rejected=stats.get("rejected", 0),
                spam=stats.get("spam", 0),
                github_issues_created=0,  # Would need to track this separately
                average_quality_score=None,  # Would need to calculate
                submissions_today=0,  # Would need to track
                submissions_this_week=0,  # Would need to track
                top_categories=stats.get("top_categories", []),
            )

        except Exception as e:
            logger.error(f"Failed to get statistics: {e}")
            raise ServiceError("Failed to retrieve statistics") from e

    def _calculate_quality_score(self, submission: ContributionSubmit) -> int:
        """Calculate quality score for a contribution.

        Args:
            submission: The contribution submission

        Returns:
            Quality score (0-100)
        """
        score = 50  # Base score

        # Length bonus
        if len(submission.prompt) > 100:
            score += 10
        if len(submission.prompt) > 200:
            score += 10

        # Context bonus
        if submission.context:
            score += 10
            if len(submission.context) > 100:
                score += 5

        # Examples bonus
        if submission.examples:
            score += 10
            if len(submission.examples) >= 3:
                score += 5

        # Category bonus (non-other)
        if submission.category != ContributionCategory.OTHER:
            score += 5

        # GitHub username bonus (attributed contribution)
        if submission.github_username:
            score += 5

        return min(100, max(0, score))

    def _calculate_spam_score(
        self,
        submission: ContributionSubmit,
        ip_address: str,
    ) -> int:
        """Calculate spam score for a contribution.

        Args:
            submission: The contribution submission
            ip_address: Submitter's IP address

        Returns:
            Spam score (0-100, higher = more likely spam)
        """
        score = 0

        # Check for excessive URLs
        url_count = submission.prompt.count("http://") + submission.prompt.count("https://")
        if url_count > 2:
            score += 30
        elif url_count > 0:
            score += 10

        # Check for repetitive characters
        for char in submission.prompt:
            if submission.prompt.count(char * 5) > 0:  # 5 repeated chars
                score += 20
                break

        # Check for all caps
        if submission.prompt.isupper() and len(submission.prompt) > 20:
            score += 20

        # Check for suspicious keywords
        spam_keywords = ["casino", "viagra", "lottery", "winner", "click here", "buy now"]
        prompt_lower = submission.prompt.lower()
        for keyword in spam_keywords:
            if keyword in prompt_lower:
                score += 30
                break

        # Anonymous submission penalty
        if not submission.github_username and not submission.captcha_token:
            score += 15

        return min(100, max(0, score))
