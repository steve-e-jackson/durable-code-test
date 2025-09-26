"""GitHub API integration service for contribution management.

Purpose: GitHub API integration service for creating issues from approved contributions.
Scope: GitHub issue creation, label management, and repository interaction
Overview: This service provides integration with the GitHub API to automatically create
    issues from approved community contributions. It handles authentication, formats
    contributions as well-structured GitHub issues, manages labels, and tracks issue
    metadata. The service includes retry logic for API failures, rate limit handling,
    and comprehensive error reporting. It transforms AI prompt contributions into
    actionable GitHub issues that developers can work on.
Dependencies: httpx for async HTTP, GitHub API v3, environment variables for config
Exports: GitHubService class with issue creation and management methods
Interfaces: Async methods for GitHub operations with proper error handling
Implementation: Uses httpx for async requests with retry logic and rate limit awareness
"""

import os
from typing import Dict, List, Optional

import httpx
from loguru import logger

from ..core.exceptions import ExternalServiceError, ServiceError
from ..core.retry import retry_with_backoff
from ..db.models.contribution import Contribution
from ..models.contribution import GitHubIssueCreate


class GitHubService:
    """Service for interacting with GitHub API."""

    def __init__(self):
        """Initialize GitHub service with configuration."""
        self.token = os.getenv("GITHUB_TOKEN", "")
        self.repo_owner = os.getenv("GITHUB_REPO_OWNER", "")
        self.repo_name = os.getenv("GITHUB_REPO_NAME", "")
        self.base_url = "https://api.github.com"

        if not all([self.token, self.repo_owner, self.repo_name]):
            logger.warning("GitHub service not fully configured - some features will be disabled")

        self.headers = {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {self.token}",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    @retry_with_backoff(max_attempts=3, exceptions=(httpx.HTTPError,))
    async def create_issue_from_contribution(self, contribution: Contribution) -> Dict:
        """Create a GitHub issue from an approved contribution.

        Args:
            contribution: The approved contribution to create an issue from

        Returns:
            Dictionary with issue data including number and URL

        Raises:
            ExternalServiceError: If GitHub API fails
        """
        if not self.token:
            raise ServiceError("GitHub integration not configured")

        # Format the issue content
        issue_data = self._format_contribution_as_issue(contribution)

        # Create the issue
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/repos/{self.repo_owner}/{self.repo_name}/issues",
                    headers=self.headers,
                    json=issue_data,
                    timeout=30.0,
                )
                response.raise_for_status()

                issue = response.json()
                logger.info(
                    f"Created GitHub issue #{issue['number']} for contribution {contribution.id}"
                )

                return {
                    "number": issue["number"],
                    "url": issue["html_url"],
                    "id": issue["id"],
                }

            except httpx.HTTPStatusError as e:
                if e.response.status_code == 403:
                    raise ExternalServiceError(
                        "GitHub API rate limit exceeded",
                        details={"retry_after": e.response.headers.get("X-RateLimit-Reset")},
                    )
                elif e.response.status_code == 404:
                    raise ServiceError(
                        "GitHub repository not found",
                        details={"repo": f"{self.repo_owner}/{self.repo_name}"},
                    )
                else:
                    raise ExternalServiceError(
                        f"GitHub API error: {e.response.status_code}",
                        details={"error": e.response.text},
                    )
            except httpx.HTTPError as e:
                raise ExternalServiceError(f"Failed to connect to GitHub: {str(e)}")

    def _format_contribution_as_issue(self, contribution: Contribution) -> Dict:
        """Format a contribution as a GitHub issue.

        Args:
            contribution: The contribution to format

        Returns:
            Dictionary with GitHub issue data
        """
        # Create issue title
        title = self._generate_issue_title(contribution)

        # Create issue body
        body = self._generate_issue_body(contribution)

        # Determine labels
        labels = self._determine_labels(contribution)

        return {
            "title": title,
            "body": body,
            "labels": labels,
        }

    def _generate_issue_title(self, contribution: Contribution) -> str:
        """Generate a concise issue title from the contribution.

        Args:
            contribution: The contribution to generate title from

        Returns:
            Issue title string
        """
        # Extract the key action from the prompt
        prompt_words = contribution.prompt.split()[:15]  # First 15 words max
        title = " ".join(prompt_words)

        # Ensure title isn't too long
        if len(title) > 100:
            title = title[:97] + "..."

        # Add category prefix if relevant
        category_prefixes = {
            "bug_fix": "🐛 Fix:",
            "feature": "✨ Feature:",
            "improvement": "💡 Improvement:",
            "documentation": "📚 Docs:",
            "performance": "⚡ Performance:",
            "security": "🔒 Security:",
        }

        prefix = category_prefixes.get(contribution.category, "🤖 AI Contribution:")
        return f"{prefix} {title}"

    def _generate_issue_body(self, contribution: Contribution) -> str:
        """Generate a detailed issue body from the contribution.

        Args:
            contribution: The contribution to generate body from

        Returns:
            Markdown-formatted issue body
        """
        body_parts = [
            "## 🤖 AI-Generated Contribution",
            "",
            "_This issue was created from a community contribution via AI prompt submission._",
            "",
            "## Description",
            contribution.prompt,
        ]

        if contribution.context:
            body_parts.extend(["", "## Context", contribution.context])

        if contribution.examples:
            import json

            try:
                examples = json.loads(contribution.examples)
                if examples:
                    body_parts.extend(["", "## Examples", ""])
                    for example in examples:
                        body_parts.append(f"- {example}")
            except (json.JSONDecodeError, TypeError):
                pass

        # Add metadata
        body_parts.extend(
            [
                "",
                "---",
                "### Metadata",
                f"- **Category**: {contribution.category}",
                f"- **Priority**: {contribution.priority}/10",
                f"- **Quality Score**: {contribution.quality_score}/100" if contribution.quality_score else "",
                f"- **Submitted by**: @{contribution.github_username}" if contribution.github_username else "- **Submitted by**: Anonymous",
                f"- **Contribution ID**: #{contribution.id}",
            ]
        )

        # Add implementation checklist
        body_parts.extend(
            [
                "",
                "## Implementation Checklist",
                "- [ ] Understand the requirements",
                "- [ ] Design the solution",
                "- [ ] Implement the feature/fix",
                "- [ ] Add tests",
                "- [ ] Update documentation",
                "- [ ] Create pull request",
            ]
        )

        return "\n".join(filter(None, body_parts))  # Filter out empty strings

    def _determine_labels(self, contribution: Contribution) -> List[str]:
        """Determine GitHub labels based on contribution properties.

        Args:
            contribution: The contribution to analyze

        Returns:
            List of label names
        """
        labels = ["ai-contribution", "needs-triage"]

        # Add category label
        category_labels = {
            "feature": "enhancement",
            "bug_fix": "bug",
            "documentation": "documentation",
            "performance": "performance",
            "security": "security",
            "improvement": "enhancement",
            "testing": "testing",
        }

        if category_label := category_labels.get(contribution.category):
            labels.append(category_label)

        # Add priority label
        if contribution.priority >= 8:
            labels.append("priority-high")
        elif contribution.priority >= 5:
            labels.append("priority-medium")
        else:
            labels.append("priority-low")

        # Add quality indicator
        if contribution.quality_score and contribution.quality_score >= 80:
            labels.append("high-quality")

        return labels

    async def check_rate_limit(self) -> Dict:
        """Check GitHub API rate limit status.

        Returns:
            Dictionary with rate limit information
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/rate_limit",
                    headers=self.headers,
                    timeout=10.0,
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"Failed to check GitHub rate limit: {e}")
                return {}

    async def validate_configuration(self) -> bool:
        """Validate GitHub service configuration.

        Returns:
            True if configuration is valid
        """
        if not all([self.token, self.repo_owner, self.repo_name]):
            return False

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/repos/{self.repo_owner}/{self.repo_name}",
                    headers=self.headers,
                    timeout=10.0,
                )
                return response.status_code == 200
            except httpx.HTTPError:
                return False
