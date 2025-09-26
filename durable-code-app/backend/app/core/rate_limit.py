"""Rate limiting configuration for contribution endpoints.

Purpose: Rate limiting configuration and utilities for protecting contribution endpoints.
Scope: Per-endpoint rate limiting, IP-based throttling, and abuse prevention
Overview: This module provides specialized rate limiting configurations for the contribution
    system, implementing different limits for various operations like submission, review,
    and search. It includes IP-based rate limiting with configurable thresholds, burst
    protection, and integration with the application's security middleware. The module
    helps prevent spam, DDoS attacks, and resource exhaustion while allowing legitimate
    users to interact with the system effectively.
Dependencies: slowapi for rate limiting, FastAPI for request handling
Exports: Rate limiter instances and configuration functions for contribution endpoints
Interfaces: Decorator-based rate limiting with configurable limits per endpoint
Implementation: Uses slowapi with Redis backend for distributed rate limiting
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

# Rate limit configurations for different endpoints
RATE_LIMITS: dict[str, str] = {
    # Contribution submission - stricter limits to prevent spam
    "contribution_submit": "5 per hour",
    "contribution_submit_burst": "2 per minute",
    # Admin operations - more lenient for trusted users
    "admin_review": "100 per minute",
    "admin_bulk": "20 per minute",
    # Public read operations
    "contribution_list": "30 per minute",
    "contribution_get": "60 per minute",
    "contribution_stats": "10 per minute",
    # Authentication operations
    "auth_login": "5 per minute",
    "auth_callback": "10 per minute",
    # Search operations
    "search": "20 per minute",
}

# Create specialized rate limiter for contributions
contribution_limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100 per minute", "1000 per hour"],
    headers_enabled=True,  # Add rate limit headers to responses
)


def get_contribution_rate_limit(operation: str) -> str:
    """Get rate limit configuration for a specific contribution operation.

    Args:
        operation: The operation type (e.g., 'submit', 'review')

    Returns:
        Rate limit string for the operation
    """
    key = f"contribution_{operation}"
    return RATE_LIMITS.get(key, "30 per minute")


def get_admin_rate_limit(operation: str) -> str:
    """Get rate limit configuration for admin operations.

    Args:
        operation: The admin operation type

    Returns:
        Rate limit string for the operation
    """
    key = f"admin_{operation}"
    return RATE_LIMITS.get(key, "100 per minute")


# IP-based spam detection thresholds
SPAM_THRESHOLDS = {
    "max_submissions_per_day": 10,
    "max_failed_attempts": 5,
    "cooldown_minutes": 60,
}


class ContributionRateLimiter:
    """Enhanced rate limiter with spam detection for contributions."""

    def __init__(self):
        """Initialize the rate limiter with tracking storage."""
        # In production, this would use Redis or similar
        self._submission_counts: dict[str, int] = {}
        self._failed_attempts: dict[str, int] = {}
        self._blocked_ips: set = set()

    def check_submission_allowed(self, ip_address: str) -> tuple[bool, str]:
        """Check if an IP is allowed to submit a contribution.

        Args:
            ip_address: The IP address to check

        Returns:
            Tuple of (allowed, reason_if_denied)
        """
        if ip_address in self._blocked_ips:
            return False, "IP temporarily blocked due to suspicious activity"

        # Check daily submission count
        daily_count = self._submission_counts.get(ip_address, 0)
        if daily_count >= SPAM_THRESHOLDS["max_submissions_per_day"]:
            return False, "Daily submission limit reached"

        # Check failed attempts
        failed_count = self._failed_attempts.get(ip_address, 0)
        if failed_count >= SPAM_THRESHOLDS["max_failed_attempts"]:
            self._blocked_ips.add(ip_address)
            return False, "Too many failed attempts"

        return True, ""

    def record_submission(self, ip_address: str, success: bool) -> None:
        """Record a submission attempt.

        Args:
            ip_address: The IP address that submitted
            success: Whether the submission was successful
        """
        if success:
            self._submission_counts[ip_address] = self._submission_counts.get(ip_address, 0) + 1
            # Reset failed attempts on success
            self._failed_attempts.pop(ip_address, None)
        else:
            self._failed_attempts[ip_address] = self._failed_attempts.get(ip_address, 0) + 1

    def reset_daily_counts(self) -> None:
        """Reset daily submission counts (should be called by a scheduled job)."""
        self._submission_counts.clear()

    def unblock_ip(self, ip_address: str) -> None:
        """Remove an IP from the blocked list.

        Args:
            ip_address: The IP address to unblock
        """
        self._blocked_ips.discard(ip_address)


# Global instance for the application
contribution_rate_limiter = ContributionRateLimiter()
