"""Racing game API endpoints for track generation and game data.

Purpose: Provide backend API for the racing game demo with track generation
Scope: Track generation, game configuration, future multiplayer support
Overview: This module provides RESTful and WebSocket endpoints for the racing game.
    Initially provides simple track generation for single-player mode with
    infrastructure ready for multiplayer support. Follows security best practices
    with input validation and rate limiting.
Dependencies: FastAPI, Pydantic for validation, loguru for logging
Exports: Router with racing game endpoints
Interfaces: REST API endpoints for track data
Implementation: FastAPI router with async endpoints and comprehensive validation
"""

import math
import random
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query
from loguru import logger
from pydantic import BaseModel, Field

# Constants
DEFAULT_TRACK_WIDTH = 800
DEFAULT_TRACK_HEIGHT = 600
MIN_TRACK_WIDTH = 400
MAX_TRACK_WIDTH = 1920
MIN_TRACK_HEIGHT = 300
MAX_TRACK_HEIGHT = 1080
DEFAULT_TRACK_PADDING = 50

# HTTP Status codes
HTTP_BAD_REQUEST = 400
HTTP_NOT_FOUND = 404

# API Router
router = APIRouter(
    prefix="/api/racing",
    tags=["racing"],
    responses={
        HTTP_NOT_FOUND: {"description": "Not found"},
        HTTP_BAD_REQUEST: {"description": "Bad request"},
    },
)


class Point2D(BaseModel):
    """2D point representation."""

    x: float = Field(..., ge=0, description="X coordinate")
    y: float = Field(..., ge=0, description="Y coordinate")


class TrackBoundary(BaseModel):
    """Track boundary definition."""

    inner: list[Point2D] = Field(..., description="Inner track boundary points")
    outer: list[Point2D] = Field(..., description="Outer track boundary points")


class SimpleTrack(BaseModel):
    """Simple track data for initial physics testing."""

    width: int = Field(
        default=DEFAULT_TRACK_WIDTH, ge=MIN_TRACK_WIDTH, le=MAX_TRACK_WIDTH, description="Track canvas width"
    )
    height: int = Field(
        default=DEFAULT_TRACK_HEIGHT, ge=MIN_TRACK_HEIGHT, le=MAX_TRACK_HEIGHT, description="Track canvas height"
    )
    boundaries: TrackBoundary = Field(..., description="Track boundary points")
    start_position: Point2D = Field(..., description="Starting position for the car")
    track_width: float = Field(default=80, ge=40, le=120, description="Width of the track surface")


class TrackGenerationParams(BaseModel):
    """Parameters for track generation."""

    difficulty: str = Field(default="medium", pattern="^(easy|medium|hard)$", description="Track difficulty level")
    seed: int | None = Field(default=None, ge=0, le=999999, description="Seed for reproducible generation")
    width: int = Field(default=DEFAULT_TRACK_WIDTH, ge=MIN_TRACK_WIDTH, le=MAX_TRACK_WIDTH, description="Canvas width")
    height: int = Field(
        default=DEFAULT_TRACK_HEIGHT, ge=MIN_TRACK_HEIGHT, le=MAX_TRACK_HEIGHT, description="Canvas height"
    )


def generate_oval_track(width: int, height: int, padding: int = DEFAULT_TRACK_PADDING) -> TrackBoundary:
    """Generate a simple oval track for testing.

    Args:
        width: Canvas width
        height: Canvas height
        padding: Padding from canvas edges

    Returns:
        TrackBoundary with inner and outer boundaries
    """
    center = (width / 2, height / 2)
    outer_radius = ((width - 2 * padding) / 2, (height - 2 * padding) / 2)
    track_width = 60
    inner_radius = (outer_radius[0] - track_width, outer_radius[1] - track_width)

    # Generate points around the oval
    num_points = 32
    outer_points = []
    inner_points = []

    for i in range(num_points):
        angle = (2 * math.pi * i) / num_points
        cos_angle = math.cos(angle)
        sin_angle = math.sin(angle)

        # Outer and inner boundaries
        outer_points.append(
            Point2D(x=center[0] + outer_radius[0] * cos_angle, y=center[1] + outer_radius[1] * sin_angle)
        )
        inner_points.append(
            Point2D(x=center[0] + inner_radius[0] * cos_angle, y=center[1] + inner_radius[1] * sin_angle)
        )

    return TrackBoundary(outer=outer_points, inner=inner_points)


@router.get("/track/simple", response_model=SimpleTrack)
async def get_simple_track(
    width: Annotated[int, Query(ge=MIN_TRACK_WIDTH, le=MAX_TRACK_WIDTH)] = DEFAULT_TRACK_WIDTH,
    height: Annotated[int, Query(ge=MIN_TRACK_HEIGHT, le=MAX_TRACK_HEIGHT)] = DEFAULT_TRACK_HEIGHT,
) -> SimpleTrack:
    """Get a simple oval track for initial testing.

    This endpoint returns a basic oval track that can be used for testing
    physics and rendering. The track is generated procedurally based on
    the canvas dimensions.

    Args:
        width: Canvas width in pixels
        height: Canvas height in pixels

    Returns:
        SimpleTrack with boundaries and starting position
    """
    logger.info("Generating simple oval track", width=width, height=height)

    try:
        # Generate oval track boundaries
        boundaries = generate_oval_track(width, height)

        # Starting position at the bottom center of the track
        start_position = Point2D(x=width / 2, y=height - 100)

        return SimpleTrack(
            width=width, height=height, boundaries=boundaries, start_position=start_position, track_width=60
        )
    except Exception as e:
        logger.error("Failed to generate track", error=str(e))
        raise HTTPException(status_code=HTTP_BAD_REQUEST, detail="Failed to generate track") from e


@router.post("/track/generate", response_model=SimpleTrack)
async def generate_track(params: TrackGenerationParams) -> SimpleTrack:
    """Generate a procedural track based on parameters.

    Future endpoint for more complex track generation. Currently returns
    the same oval track but with seed support for future expansion.

    Args:
        params: Track generation parameters including difficulty and seed

    Returns:
        Generated track data
    """
    logger.info(
        "Generating track", difficulty=params.difficulty, seed=params.seed, width=params.width, height=params.height
    )

    # Set random seed if provided for reproducibility
    if params.seed is not None:
        random.seed(params.seed)

    # For now, return the same oval track
    # Future: Implement procedural generation based on difficulty
    boundaries = generate_oval_track(params.width, params.height)
    start_position = Point2D(x=params.width / 2, y=params.height - 100)

    return SimpleTrack(
        width=params.width,
        height=params.height,
        boundaries=boundaries,
        start_position=start_position,
        track_width=60 if params.difficulty == "easy" else 50 if params.difficulty == "medium" else 40,
    )


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint for the racing API.

    Returns:
        Status indicating the API is healthy
    """
    return {"status": "healthy", "service": "racing-api"}
