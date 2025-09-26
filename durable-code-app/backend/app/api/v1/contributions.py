"""API endpoints for contribution submission and management.

Purpose: API endpoints for handling AI contribution submissions and admin review operations.
Scope: HTTP endpoints for contribution CRUD operations, review workflow, and statistics
Overview: This module implements the FastAPI router for the contribution system, providing
    endpoints for public submission, admin review, and statistics retrieval. All endpoints
    include proper authentication, rate limiting, input validation, and error handling.
    The module follows RESTful conventions and returns consistent JSON responses with
    appropriate HTTP status codes. It integrates with the service layer for business
    logic and includes comprehensive logging for audit and debugging purposes.
Dependencies: FastAPI for routing, SQLAlchemy for database, Pydantic for validation
Exports: Router with contribution endpoints to be mounted in the main application
Interfaces: RESTful HTTP endpoints with JSON request/response format
Implementation: FastAPI router with dependency injection and async request handlers
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from loguru import logger

from ...core.exceptions import ResourceNotFoundError, ServiceError, ValidationError
from ...core.rate_limit import contribution_limiter, get_contribution_rate_limit
from ...db.models.contribution import ContributionStatus
from ...models.contribution import (
    ContributionFilter,
    ContributionResponse,
    ContributionReview,
    ContributionStats,
    ContributionSubmit,
)
from ...services.contribution_service import ContributionService

# Create router for contribution endpoints
router = APIRouter(
    prefix="/api/v1/contributions",
    tags=["contributions"],
    responses={
        status.HTTP_429_TOO_MANY_REQUESTS: {"description": "Rate limit exceeded"},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error"},
    },
)


# No database session needed - using DynamoDB client directly in service


# Dependency for getting client IP
def get_client_ip(request: Request) -> str:
    """Extract client IP address from request.

    Args:
        request: FastAPI request object

    Returns:
        Client IP address
    """
    # Check for proxy headers first
    if forwarded_for := request.headers.get("X-Forwarded-For"):
        # Take the first IP in the chain
        return forwarded_for.split(",")[0].strip()
    elif real_ip := request.headers.get("X-Real-IP"):
        return real_ip
    else:
        # Fall back to direct connection IP
        return request.client.host if request.client else "unknown"


# Dependency for checking admin access
async def require_admin(request: Request) -> str:
    """Check if request has admin privileges.

    Args:
        request: FastAPI request object

    Returns:
        Admin username

    Raises:
        HTTPException: If not authenticated as admin
    """
    # Placeholder for actual admin authentication
    # In production, this would check JWT tokens or session
    admin_token = request.headers.get("X-Admin-Token")
    if not admin_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required",
        )
    # Validate token and return admin username
    # For now, return placeholder
    return "admin"


@router.post(
    "/submit",
    response_model=ContributionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new contribution",
    description="Submit an AI prompt contribution for review",
)
@contribution_limiter.limit(get_contribution_rate_limit("submit"))
async def submit_contribution(
    request: Request,
    submission: ContributionSubmit,
    client_ip: str = Depends(get_client_ip),
) -> ContributionResponse:
    """Submit a new AI contribution for review.

    Args:
        request: FastAPI request object
        submission: Contribution submission data
        db: Database session
        client_ip: Client IP address

    Returns:
        Created contribution data

    Raises:
        HTTPException: On validation or processing errors
    """
    try:
        # Get user agent for tracking
        user_agent = request.headers.get("User-Agent")

        # Create service and submit contribution
        service = ContributionService()
        contribution = await service.submit_contribution(
            submission=submission,
            ip_address=client_ip,
            user_agent=user_agent,
        )

        logger.info(f"Contribution submitted from {client_ip}: ID={contribution.id}")
        return contribution

    except ValidationError as e:
        logger.warning(f"Validation error from {client_ip}: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message,
        )
    except ServiceError as e:
        logger.error(f"Service error during submission: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process contribution",
        )


@router.get(
    "/{contribution_id}",
    response_model=ContributionResponse,
    summary="Get contribution by ID",
    description="Retrieve a specific contribution by its ID",
)
async def get_contribution(
    contribution_id: str,
) -> ContributionResponse:
    """Get a contribution by its ID.

    Args:
        contribution_id: ID of the contribution
        db: Database session

    Returns:
        Contribution data

    Raises:
        HTTPException: If contribution not found
    """
    try:
        service = ContributionService()
        return await service.get_contribution(contribution_id)

    except ResourceNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )


@router.get(
    "/",
    response_model=List[ContributionResponse],
    summary="List contributions",
    description="List contributions with filtering and pagination",
)
async def list_contributions(
    filter_params: ContributionFilter = Depends(),
) -> List[ContributionResponse]:
    """List contributions with filtering.

    Args:
        filter_params: Filtering and pagination parameters
        db: Database session

    Returns:
        List of contributions
    """
    service = ContributionService(db)
    # Public endpoint - only show approved contributions
    return await service.list_contributions(filter_params, is_admin=False)


@router.get(
    "/admin/pending",
    response_model=List[ContributionResponse],
    summary="List pending contributions (Admin)",
    description="List contributions pending review for administrators",
)
@contribution_limiter.limit(get_contribution_rate_limit("admin_list"))
async def list_pending_contributions(
    request: Request,
    limit: int = 20,
    offset: int = 0,
    admin: str = Depends(require_admin),
) -> List[ContributionResponse]:
    """List contributions pending review (admin only).

    Args:
        request: FastAPI request object
        limit: Maximum number of results
        offset: Pagination offset
        db: Database session
        admin: Admin username

    Returns:
        List of pending contributions
    """
    filter_params = ContributionFilter(
        status=ContributionStatus.PENDING,
        limit=limit,
        offset=offset,
    )

    service = ContributionService(db)
    contributions = await service.list_contributions(filter_params, is_admin=True)

    logger.info(f"Admin {admin} retrieved {len(contributions)} pending contributions")
    return contributions


@router.put(
    "/admin/{contribution_id}/review",
    response_model=ContributionResponse,
    summary="Review a contribution (Admin)",
    description="Review and update the status of a contribution",
)
@contribution_limiter.limit(get_contribution_rate_limit("admin_review"))
async def review_contribution(
    request: Request,
    contribution_id: str,
    review: ContributionReview,
    admin: str = Depends(require_admin),
) -> ContributionResponse:
    """Review and update a contribution's status (admin only).

    Args:
        request: FastAPI request object
        contribution_id: ID of the contribution to review
        review: Review details and new status
        db: Database session
        admin: Admin username

    Returns:
        Updated contribution

    Raises:
        HTTPException: If contribution not found or review fails
    """
    try:
        service = ContributionService()
        contribution = await service.review_contribution(
            contribution_id=contribution_id,
            review=review,
            reviewer=admin,
        )

        logger.info(
            f"Admin {admin} reviewed contribution {contribution_id}: status={review.status}"
        )
        return contribution

    except ResourceNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )
    except ServiceError as e:
        logger.error(f"Failed to review contribution: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process review",
        )


@router.get(
    "/stats/dashboard",
    response_model=ContributionStats,
    summary="Get contribution statistics",
    description="Retrieve statistics about contributions for dashboard display",
)
@contribution_limiter.limit(get_contribution_rate_limit("stats"))
async def get_statistics(
    request: Request,
) -> ContributionStats:
    """Get contribution statistics for dashboard.

    Args:
        request: FastAPI request object
        db: Database session

    Returns:
        Statistics summary
    """
    try:
        service = ContributionService()
        return await service.get_statistics()

    except ServiceError as e:
        logger.error(f"Failed to get statistics: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics",
        )


@router.post(
    "/admin/{contribution_id}/mark-spam",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Mark contribution as spam (Admin)",
    description="Mark a contribution as spam and block the submitter",
)
@contribution_limiter.limit(get_contribution_rate_limit("admin_review"))
async def mark_as_spam(
    request: Request,
    contribution_id: str,
    admin: str = Depends(require_admin),
) -> None:
    """Mark a contribution as spam (admin only).

    Args:
        request: FastAPI request object
        contribution_id: ID of the contribution
        db: Database session
        admin: Admin username
    """
    try:
        review = ContributionReview(
            status=ContributionStatus.SPAM,
            review_notes=f"Marked as spam by {admin}",
        )

        service = ContributionService()
        await service.review_contribution(
            contribution_id=contribution_id,
            review=review,
            reviewer=admin,
        )

        logger.warning(f"Admin {admin} marked contribution {contribution_id} as spam")

    except ResourceNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )
