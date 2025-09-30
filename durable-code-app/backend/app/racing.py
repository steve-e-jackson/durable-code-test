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
    track_width = 100  # Wider track for better gameplay
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


def get_difficulty_params(difficulty: str) -> tuple[float, int, float]:
    """Get track parameters based on difficulty level.

    Args:
        difficulty: Track difficulty (easy, medium, hard)

    Returns:
        Tuple of (track_width, num_control_points, variation)
    """
    params = {
        "easy": (120.0, 8, 0.08),  # Wider track, gentle curves
        "medium": (100.0, 10, 0.12),  # Medium width, moderate curves
        "hard": (80.0, 12, 0.18),  # Narrower track, tighter curves
    }
    return params.get(difficulty, (100.0, 10, 0.12))


def generate_control_points(
    num_points: int,
    center: tuple[float, float],
    base_radius: tuple[float, float],
    variation: float,
    bounds: tuple[int, int, float],
) -> list[tuple[float, float]]:
    """Generate random control points for track generation.

    Args:
        num_points: Number of control points
        center: Center point (x, y)
        base_radius: Base radius (rx, ry)
        variation: Amount of random variation
        bounds: Tuple of (width, height, padding)

    Returns:
        List of control point coordinates
    """
    width, height, padding = bounds
    control_points = []

    for i in range(num_points):
        angle = (2 * math.pi * i) / num_points

        # Add random variation to radius (not cryptographic use)
        radius_var_x = base_radius[0] * (1 + random.uniform(-variation, variation))  # noqa: S311  # nosec B311
        radius_var_y = base_radius[1] * (1 + random.uniform(-variation, variation))  # noqa: S311  # nosec B311

        # Clamp to bounds
        min_radius = padding + 50
        radius_var_x = max(min_radius, min(width / 2 - padding, radius_var_x))
        radius_var_y = max(min_radius, min(height / 2 - padding, radius_var_y))

        x = center[0] + radius_var_x * math.cos(angle)
        y = center[1] + radius_var_y * math.sin(angle)

        control_points.append((x, y))

    return control_points


def catmull_rom_point(
    p0: tuple[float, float], p1: tuple[float, float], p2: tuple[float, float], p3: tuple[float, float], t: float
) -> tuple[float, float]:
    """Calculate a point on a Catmull-Rom curve.

    Args:
        p0, p1, p2, p3: Control points
        t: Interpolation parameter (0 to 1)

    Returns:
        Interpolated point (x, y)
    """
    t2 = t * t
    t3 = t2 * t

    x = 0.5 * (
        (2 * p1[0])
        + (-p0[0] + p2[0]) * t
        + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2
        + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
    )

    y = 0.5 * (
        (2 * p1[1])
        + (-p0[1] + p2[1]) * t
        + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2
        + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
    )

    return (x, y)


def calculate_normal_offset(
    current: tuple[float, float], next_point: tuple[float, float], track_width: float
) -> tuple[float, float]:
    """Calculate inner boundary point using normal vector.

    Args:
        current: Current point (x, y)
        next_point: Next point for tangent calculation
        track_width: Width of track

    Returns:
        Inner boundary point (x, y)
    """
    tangent_x = next_point[0] - current[0]
    tangent_y = next_point[1] - current[1]
    length = math.sqrt(tangent_x**2 + tangent_y**2)

    if length > 0:
        # Perpendicular vector
        normal_x = -tangent_y / length
        normal_y = tangent_x / length

        inner_x = current[0] + normal_x * track_width
        inner_y = current[1] + normal_y * track_width
    else:
        inner_x = current[0]
        inner_y = current[1]

    return (inner_x, inner_y)


def interpolate_curve_segment(
    control_points: list[tuple[float, float]], segment_index: int, points_per_segment: int, track_width: float
) -> tuple[list[Point2D], list[Point2D]]:
    """Interpolate a single curve segment with inner/outer boundaries.

    Args:
        control_points: List of control points
        segment_index: Index of current segment
        points_per_segment: Number of interpolation points
        track_width: Width of track

    Returns:
        Tuple of (outer_points, inner_points) for this segment
    """
    num_control = len(control_points)
    p0 = control_points[(segment_index - 1) % num_control]
    p1 = control_points[segment_index]
    p2 = control_points[(segment_index + 1) % num_control]
    p3 = control_points[(segment_index + 2) % num_control]

    outer_points = []
    inner_points = []

    for t in range(points_per_segment):
        t_norm = t / points_per_segment

        # Calculate outer boundary point
        outer = catmull_rom_point(p0, p1, p2, p3, t_norm)

        # Calculate next point for tangent
        next_t = min(t + 1, points_per_segment - 1)
        next_t_norm = next_t / points_per_segment
        next_point = catmull_rom_point(p0, p1, p2, p3, next_t_norm)

        # Calculate inner boundary
        inner = calculate_normal_offset(outer, next_point, track_width)

        outer_points.append(Point2D(x=outer[0], y=outer[1]))
        inner_points.append(Point2D(x=inner[0], y=inner[1]))

    return outer_points, inner_points


def add_track_variation(
    control_points: list[tuple[float, float]], variation_type: str = "s_curve"
) -> list[tuple[float, float]]:
    """Add specific track features like S-curves, chicanes, hairpins.

    Args:
        control_points: Base control points
        variation_type: Type of variation to add

    Returns:
        Modified control points with added features
    """
    if variation_type == "s_curve":
        # Add subtle S-curve sections by modifying a few points
        num_points = len(control_points)
        # Add gentle curves at quarter positions
        for i in [num_points // 4, num_points // 2, (3 * num_points) // 4]:
            if 0 < i < num_points:
                # Calculate perpendicular offset
                prev_pt = control_points[i - 1]
                next_pt = control_points[(i + 1) % num_points]

                # Tangent vector
                dx = next_pt[0] - prev_pt[0]
                dy = next_pt[1] - prev_pt[1]
                length = math.sqrt(dx * dx + dy * dy)

                if length > 0:
                    # Perpendicular offset (alternate direction)
                    offset_dist = 40 if i == num_points // 2 else 20
                    normal_x = -dy / length * offset_dist * ((-1) ** i)
                    normal_y = dx / length * offset_dist * ((-1) ** i)

                    current = control_points[i]
                    control_points[i] = (current[0] + normal_x, current[1] + normal_y)

    return control_points


def generate_procedural_track(
    width: int, height: int, difficulty: str, padding: int = DEFAULT_TRACK_PADDING
) -> TrackBoundary:
    """Generate a procedural track with curves and varying complexity.

    Args:
        width: Canvas width
        height: Canvas height
        difficulty: Track difficulty (easy, medium, hard)
        padding: Padding from canvas edges

    Returns:
        TrackBoundary with procedurally generated boundaries
    """
    center = (width / 2, height / 2)
    base_radius = ((width - 2 * padding) / 2, (height - 2 * padding) / 2)

    # Get difficulty-based parameters
    track_width, num_control_points, variation = get_difficulty_params(difficulty)

    # Generate control points
    control_points = generate_control_points(
        num_control_points, center, base_radius, variation, (width, height, padding)
    )

    # Add track features for more interesting layout
    control_points = add_track_variation(control_points, "s_curve")

    # Interpolate smooth curves
    num_segments = 128  # More segments for smoother curves
    points_per_segment = num_segments // num_control_points

    all_outer_points = []
    all_inner_points = []

    for i in range(num_control_points):
        outer, inner = interpolate_curve_segment(control_points, i, points_per_segment, track_width)
        all_outer_points.extend(outer)
        all_inner_points.extend(inner)

    return TrackBoundary(outer=all_outer_points, inner=all_inner_points)


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
            width=width, height=height, boundaries=boundaries, start_position=start_position, track_width=100
        )
    except Exception as e:
        logger.error("Failed to generate track", error=str(e))
        raise HTTPException(status_code=HTTP_BAD_REQUEST, detail="Failed to generate track") from e


@router.post("/track/generate", response_model=SimpleTrack)
async def generate_track(params: TrackGenerationParams) -> SimpleTrack:
    """Generate a procedural track based on parameters.

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

    try:
        # Generate procedural track with curves
        boundaries = generate_procedural_track(params.width, params.height, params.difficulty)
        start_position = Point2D(x=params.width / 2, y=params.height - 100)

        track_width, _, _ = get_difficulty_params(params.difficulty)

        return SimpleTrack(
            width=params.width,
            height=params.height,
            boundaries=boundaries,
            start_position=start_position,
            track_width=track_width,
        )
    except Exception as e:
        logger.error("Failed to generate procedural track", error=str(e))
        raise HTTPException(status_code=HTTP_BAD_REQUEST, detail="Failed to generate track") from e


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint for the racing API.

    Returns:
        Status indicating the API is healthy
    """
    return {"status": "healthy", "service": "racing-api"}
