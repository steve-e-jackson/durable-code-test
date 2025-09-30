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
DEFAULT_TRACK_PADDING = 60

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

    x: float = Field(..., description="X coordinate")
    y: float = Field(..., description="Y coordinate")


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
    layout: str = Field(
        default="procedural",
        pattern="^(procedural|figure8|spa|monaco|laguna|suzuka)$",
        description="Track layout style",
    )
    # Advanced parameters for procedural generation
    num_points: int | None = Field(default=None, ge=6, le=24, description="Number of control points")
    variation_amount: float | None = Field(default=None, ge=0.05, le=0.50, description="Radius variation amount")
    hairpin_chance: float | None = Field(default=None, ge=0, le=0.60, description="Probability of hairpin turns")
    hairpin_intensity: float | None = Field(default=None, ge=1.0, le=5.0, description="Hairpin variation multiplier")
    smoothing_passes: int | None = Field(default=None, ge=0, le=5, description="Number of smoothing iterations")
    track_width_override: float | None = Field(default=None, ge=60, le=140, description="Override track width")


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
        "easy": (120.0, 12, 0.15),  # Wider track, more curves
        "medium": (100.0, 16, 0.22),  # Medium width, complex curves
        "hard": (80.0, 20, 0.28),  # Narrower track, very windy
    }
    return params.get(difficulty, (100.0, 16, 0.22))


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


def add_hairpin_turns(
    control_points: list[tuple[float, float]], center: tuple[float, float]
) -> list[tuple[float, float]]:
    """Add dramatic 180-degree hairpin turns to the track.

    Args:
        control_points: Base control points
        center: Track center point

    Returns:
        Modified control points with hairpin turns
    """
    num_points = len(control_points)

    # Add 2-3 hairpin turns at strategic locations
    hairpin_positions = [num_points // 4, num_points // 2, (3 * num_points) // 4]

    for hairpin_idx, base_idx in enumerate(hairpin_positions):
        if 1 < base_idx < num_points - 1:
            # Create a tight 180-degree hairpin by inserting extra control points
            # This creates the characteristic U-turn shape

            # Get the base point and calculate direction
            base_point = control_points[base_idx]
            prev_point = control_points[base_idx - 1]
            next_point = control_points[(base_idx + 1) % num_points]

            # Calculate the tangent direction
            dx = next_point[0] - prev_point[0]
            dy = next_point[1] - prev_point[1]
            length = math.sqrt(dx * dx + dy * dy)

            if length > 0:
                # Normalize and get perpendicular
                tx = dx / length
                ty = dy / length
                normal_x = -ty
                normal_y = tx

                # Create hairpin apex point (pushed far out for dramatic 180-degree turns)
                hairpin_distance = 80 + (hairpin_idx * 15)  # Vary hairpin tightness (more dramatic)
                apex_x = base_point[0] + normal_x * hairpin_distance
                apex_y = base_point[1] + normal_y * hairpin_distance

                # Modify the base point to be the hairpin apex
                control_points[base_idx] = (apex_x, apex_y)

                # Push adjacent points strongly to create the U-shape entry and exit
                if base_idx - 1 >= 0:
                    entry_point = control_points[base_idx - 1]
                    control_points[base_idx - 1] = (
                        entry_point[0] + normal_x * (hairpin_distance * 0.5),
                        entry_point[1] + normal_y * (hairpin_distance * 0.5),
                    )

                if base_idx + 1 < num_points:
                    exit_point = control_points[base_idx + 1]
                    control_points[base_idx + 1] = (
                        exit_point[0] + normal_x * (hairpin_distance * 0.5),
                        exit_point[1] + normal_y * (hairpin_distance * 0.5),
                    )

    return control_points


def _apply_curve_offset(
    control_points: list[tuple[float, float]], index: int, offset_dist: float, direction: int
) -> None:
    """Apply perpendicular offset to a control point to create curves."""
    num_points = len(control_points)
    prev_pt = control_points[index - 1]
    next_pt = control_points[(index + 1) % num_points]

    dx = next_pt[0] - prev_pt[0]
    dy = next_pt[1] - prev_pt[1]
    length = math.sqrt(dx * dx + dy * dy)

    if length > 0:
        normal_x = -dy / length * offset_dist * direction
        normal_y = dx / length * offset_dist * direction
        current = control_points[index]
        control_points[index] = (current[0] + normal_x, current[1] + normal_y)


def _add_s_curves(control_points: list[tuple[float, float]]) -> None:
    """Add S-curves at multiple locations along the track."""
    num_points = len(control_points)
    s_curve_positions = [num_points // 6, num_points // 3, (2 * num_points) // 3, (5 * num_points) // 6]

    for idx, i in enumerate(s_curve_positions):
        if 0 < i < num_points:
            offset_dist = 50 if idx % 2 == 0 else 35
            direction = (-1) ** idx
            _apply_curve_offset(control_points, i, offset_dist, direction)


def _add_chicanes(control_points: list[tuple[float, float]]) -> None:
    """Add chicane-style quick direction changes."""
    num_points = len(control_points)
    chicane_positions = [num_points // 4, (3 * num_points) // 4]

    for idx, i in enumerate(chicane_positions):
        if 1 < i < num_points - 1:
            direction = (-1) ** idx
            _apply_curve_offset(control_points, i, 30, direction)

            # Adjust adjacent point in opposite direction for chicane effect
            if i + 1 < num_points:
                prev_pt = control_points[i - 1]
                next_pt = control_points[(i + 1) % num_points]
                dx = next_pt[0] - prev_pt[0]
                dy = next_pt[1] - prev_pt[1]
                length = math.sqrt(dx * dx + dy * dy)

                if length > 0:
                    normal_x = -dy / length * 30 * direction
                    normal_y = dx / length * 30 * direction
                    next_current = control_points[i + 1]
                    control_points[i + 1] = (next_current[0] - normal_x * 0.6, next_current[1] - normal_y * 0.6)


def add_track_variation(
    control_points: list[tuple[float, float]],
    variation_type: str = "complex",
    center: tuple[float, float] | None = None,
) -> list[tuple[float, float]]:
    """Add specific track features like S-curves, chicanes, hairpins for more interesting layouts.

    Args:
        control_points: Base control points
        variation_type: Type of variation to add
        center: Track center point for hairpin calculations

    Returns:
        Modified control points with added features
    """
    if variation_type == "complex":
        _add_s_curves(control_points)
        _add_chicanes(control_points)
        if center:
            control_points = add_hairpin_turns(control_points, center)

    return control_points


def generate_figure8_track(width: int, height: int, track_width: float) -> TrackBoundary:
    """Generate a figure-8 style track with crossover.

    Args:
        width: Canvas width
        height: Canvas height
        track_width: Width of track surface

    Returns:
        TrackBoundary for figure-8 layout
    """
    center_x, center_y = width / 2, height / 2
    radius = min(width, height) / 4

    # Create figure-8 shape with two loops
    control_points = []
    num_points = 32

    for i in range(num_points):
        angle = (2 * math.pi * i) / num_points

        # Create figure-8 using parametric equations
        if i < num_points // 2:
            # Upper loop
            x = center_x + radius * 1.2 * math.cos(angle * 2)
            y = center_y - radius * 0.8 - radius * 0.8 * math.sin(angle * 2)
        else:
            # Lower loop
            angle_offset = angle - math.pi
            x = center_x + radius * 1.2 * math.cos(angle_offset * 2)
            y = center_y + radius * 0.8 + radius * 0.8 * math.sin(angle_offset * 2)

        control_points.append((x, y))

    # Generate smooth centerline and boundaries
    return generate_boundaries_from_centerline(control_points, track_width)


def generate_spa_inspired_track(width: int, height: int, track_width: float) -> TrackBoundary:
    """Generate Spa-Francorchamps inspired track with fast curves and elevation changes.

    Args:
        width: Canvas width
        height: Canvas height
        track_width: Width of track surface

    Returns:
        TrackBoundary for Spa-inspired layout
    """
    # Create iconic Spa sections: Eau Rouge, Blanchimont, Bus Stop
    control_points = [
        (width * 0.5, height * 0.9),  # Start/finish
        (width * 0.3, height * 0.8),  # Turn 1 (La Source)
        (width * 0.2, height * 0.65),  # Eau Rouge entry
        (width * 0.25, height * 0.5),  # Eau Rouge climb
        (width * 0.35, height * 0.35),  # Raidillon
        (width * 0.5, height * 0.25),  # Kemmel Straight entry
        (width * 0.7, height * 0.2),  # Les Combes
        (width * 0.8, height * 0.3),  # Malmedy
        (width * 0.85, height * 0.45),  # Rivage
        (width * 0.8, height * 0.6),  # Pouhon
        (width * 0.7, height * 0.7),  # Fagnes
        (width * 0.6, height * 0.75),  # Campus
        (width * 0.55, height * 0.82),  # La Source approach
    ]

    return generate_boundaries_from_centerline(control_points, track_width)


def generate_monaco_style_track(width: int, height: int, track_width: float) -> TrackBoundary:
    """Generate Monaco street circuit inspired track with tight corners.

    Args:
        width: Canvas width
        height: Canvas height
        track_width: Width of track surface

    Returns:
        TrackBoundary for Monaco-style layout
    """
    # Tight, technical street circuit with hairpins and chicanes
    control_points = [
        (width * 0.5, height * 0.85),  # Start/finish
        (width * 0.4, height * 0.75),  # Sainte Devote
        (width * 0.3, height * 0.6),  # Beau Rivage climb
        (width * 0.25, height * 0.45),  # Massenet
        (width * 0.2, height * 0.3),  # Casino Square
        (width * 0.25, height * 0.2),  # Mirabeau
        (width * 0.4, height * 0.15),  # Hairpin (Loews)
        (width * 0.55, height * 0.18),  # Portier
        (width * 0.7, height * 0.25),  # Tunnel entry
        (width * 0.8, height * 0.35),  # Tunnel exit
        (width * 0.82, height * 0.5),  # Chicane entry
        (width * 0.78, height * 0.58),  # Chicane exit
        (width * 0.7, height * 0.68),  # Tabac
        (width * 0.6, height * 0.78),  # Piscine
        (width * 0.55, height * 0.82),  # La Rascasse
    ]

    return generate_boundaries_from_centerline(control_points, track_width)


def generate_laguna_seca_track(width: int, height: int, track_width: float) -> TrackBoundary:
    """Generate Laguna Seca inspired track with famous corkscrew section.

    Args:
        width: Canvas width
        height: Canvas height
        track_width: Width of track surface

    Returns:
        TrackBoundary for Laguna Seca layout
    """
    control_points = [
        (width * 0.5, height * 0.85),  # Start/finish
        (width * 0.3, height * 0.75),  # Turn 1
        (width * 0.2, height * 0.6),  # Turn 2
        (width * 0.25, height * 0.4),  # Turn 3 (Andretti Hairpin)
        (width * 0.4, height * 0.3),  # Turn 4
        (width * 0.6, height * 0.25),  # Turn 5
        (width * 0.75, height * 0.3),  # Turn 6 (Corkscrew entry)
        (width * 0.78, height * 0.42),  # Turn 7 (Corkscrew)
        (width * 0.75, height * 0.55),  # Turn 8 (Corkscrew exit)
        (width * 0.65, height * 0.65),  # Turn 9
        (width * 0.55, height * 0.75),  # Turn 10
        (width * 0.52, height * 0.82),  # Turn 11
    ]

    return generate_boundaries_from_centerline(control_points, track_width)


def generate_suzuka_style_track(width: int, height: int, track_width: float) -> TrackBoundary:
    """Generate Suzuka figure-8 inspired track with iconic esses and hairpin.

    Args:
        width: Canvas width
        height: Canvas height
        track_width: Width of track surface

    Returns:
        TrackBoundary for Suzuka-style layout
    """
    control_points = [
        (width * 0.5, height * 0.88),  # Start/finish
        (width * 0.3, height * 0.8),  # Turn 1
        (width * 0.2, height * 0.68),  # Turn 2 (S-curves entry)
        (width * 0.22, height * 0.54),  # Turn 3 (S-curves)
        (width * 0.28, height * 0.42),  # Turn 4
        (width * 0.25, height * 0.28),  # Turn 5 (Degner)
        (width * 0.35, height * 0.2),  # Turn 6
        (width * 0.5, height * 0.15),  # Turn 7 (Hairpin)
        (width * 0.65, height * 0.18),  # Turn 8
        (width * 0.75, height * 0.28),  # Turn 9 (Spoon entry)
        (width * 0.78, height * 0.42),  # Turn 10 (Spoon)
        (width * 0.72, height * 0.55),  # Turn 11
        (width * 0.68, height * 0.65),  # Turn 12 (130R entry)
        (width * 0.6, height * 0.75),  # Turn 13 (130R)
        (width * 0.55, height * 0.82),  # Turn 14 (Chicane)
    ]

    return generate_boundaries_from_centerline(control_points, track_width)


def generate_boundaries_from_centerline(control_points: list[tuple[float, float]], track_width: float) -> TrackBoundary:
    """Generate inner and outer boundaries from centerline control points.

    Args:
        control_points: List of centerline control points
        track_width: Width of track surface

    Returns:
        TrackBoundary with smooth inner and outer boundaries
    """
    # Interpolate smooth centerline using Catmull-Rom spline
    num_control = len(control_points)
    points_per_segment = 16
    centerline_points = []

    for i in range(num_control):
        p0 = control_points[(i - 1) % num_control]
        p1 = control_points[i]
        p2 = control_points[(i + 1) % num_control]
        p3 = control_points[(i + 2) % num_control]

        for t in range(points_per_segment):
            t_norm = t / points_per_segment
            point = catmull_rom_point(p0, p1, p2, p3, t_norm)
            centerline_points.append(point)

    # Generate inner and outer boundaries from centerline
    all_outer_points = []
    all_inner_points = []
    half_width = track_width / 2

    for i in range(len(centerline_points)):
        current = centerline_points[i]
        next_point = centerline_points[(i + 1) % len(centerline_points)]

        # Calculate tangent
        dx = next_point[0] - current[0]
        dy = next_point[1] - current[1]
        length = math.sqrt(dx * dx + dy * dy)

        if length > 0:
            # Perpendicular vector (normal)
            normal_x = -dy / length
            normal_y = dx / length

            # Offset by half track width in each direction
            outer_x = current[0] + normal_x * half_width
            outer_y = current[1] + normal_y * half_width
            inner_x = current[0] - normal_x * half_width
            inner_y = current[1] - normal_y * half_width

            all_outer_points.append(Point2D(x=outer_x, y=outer_y))
            all_inner_points.append(Point2D(x=inner_x, y=inner_y))
        else:
            # If two consecutive points are identical, use default offset
            all_outer_points.append(Point2D(x=current[0] + half_width, y=current[1]))
            all_inner_points.append(Point2D(x=current[0] - half_width, y=current[1]))

    return TrackBoundary(outer=all_outer_points, inner=all_inner_points)


def generate_random_track_points(
    num_points: int, center: tuple[float, float], max_radius: tuple[float, float], min_spacing: float
) -> list[tuple[float, float]]:
    """Generate random points that will form the basis of a track with good spacing.

    Args:
        num_points: Number of points to generate
        center: Center point of the area
        max_radius: Maximum radius (rx, ry) from center
        min_spacing: Minimum distance between points

    Returns:
        List of well-spaced random points
    """
    points: list[tuple[float, float]] = []
    max_attempts = 1000

    for _ in range(num_points):
        attempts = 0
        while attempts < max_attempts:
            # Generate random point in elliptical area
            angle = random.uniform(0, 2 * math.pi)  # noqa: S311  # nosec B311
            r = random.uniform(0.3, 1.0)  # noqa: S311  # nosec B311
            x = center[0] + max_radius[0] * r * math.cos(angle)
            y = center[1] + max_radius[1] * r * math.sin(angle)

            # Check spacing with existing points
            too_close = False
            for existing_pt in points:
                dist = math.sqrt((x - existing_pt[0]) ** 2 + (y - existing_pt[1]) ** 2)
                if dist < min_spacing:
                    too_close = True
                    break

            if not too_close:
                points.append((x, y))
                break

            attempts += 1

    return points


def _normalize_angle(angle: float) -> float:
    """Normalize angle to [-pi, pi] range."""
    while angle > math.pi:
        angle -= 2 * math.pi
    while angle < -math.pi:
        angle += 2 * math.pi
    return angle


def _find_k_nearest(current: tuple[float, float], points_set: set, k: int) -> list[tuple[float, float]]:
    """Find k nearest neighbors to current point."""
    distances = [(p, math.sqrt((p[0] - current[0]) ** 2 + (p[1] - current[1]) ** 2)) for p in points_set]
    distances.sort(key=lambda x: x[1])
    return [p for p, _ in distances[: min(k, len(distances))]]


def _select_best_candidate(
    candidates: list[tuple[float, float]], current: tuple[float, float], prev: tuple[float, float] | None
) -> tuple[float, float]:
    """Select best candidate based on angle from previous direction."""
    if prev is None:
        return candidates[0]

    ref_angle = math.atan2(current[1] - prev[1], current[0] - prev[0])
    best_angle = -math.pi
    best_candidate = candidates[0]

    for candidate in candidates:
        angle = math.atan2(candidate[1] - current[1], candidate[0] - current[0])
        relative_angle = _normalize_angle(angle - ref_angle)

        if relative_angle > best_angle:
            best_angle = relative_angle
            best_candidate = candidate

    return best_candidate


def compute_concave_hull(points: list[tuple[float, float]], k: int = 3) -> list[tuple[float, float]]:
    """Compute concave hull of points using k-nearest neighbors approach.

    Args:
        points: List of input points
        k: Number of nearest neighbors to consider

    Returns:
        Ordered list of points forming concave hull
    """
    if len(points) < 3:
        return points

    start = min(points, key=lambda p: (p[0], p[1]))
    hull = [start]
    current = start
    points_set = set(points)
    points_set.remove(start)

    while points_set:
        candidates = _find_k_nearest(current, points_set, k)
        if not candidates:
            break

        prev = hull[-2] if len(hull) > 1 else None
        next_point = _select_best_candidate(candidates, current, prev)

        if next_point == start and len(hull) > 2:
            break

        hull.append(next_point)
        current = next_point
        points_set.discard(next_point)

        if len(hull) > len(points) * 2:
            break

    return hull


def smooth_track_centerline(points: list[tuple[float, float]], smoothing_passes: int = 2) -> list[tuple[float, float]]:
    """Smooth track centerline using moving average filter.

    Args:
        points: Track centerline points
        smoothing_passes: Number of smoothing iterations

    Returns:
        Smoothed centerline points
    """
    if len(points) < 3:
        return points

    smoothed = points.copy()

    for _ in range(smoothing_passes):
        new_smoothed = []
        for i in range(len(smoothed)):
            prev_pt = smoothed[(i - 1) % len(smoothed)]
            curr_pt = smoothed[i]
            next_pt = smoothed[(i + 1) % len(smoothed)]

            # Moving average
            avg_x = (prev_pt[0] + curr_pt[0] + next_pt[0]) / 3
            avg_y = (prev_pt[1] + curr_pt[1] + next_pt[1]) / 3
            new_smoothed.append((avg_x, avg_y))

        smoothed = new_smoothed

    return smoothed


def _generate_control_points_with_variation(
    num_points: int,
    center: tuple[float, float],
    base_radius: tuple[float, float],
    variation_amount: float,
    hairpin_chance: float,
    hairpin_intensity: float,
    width: int,
    padding: int,
    track_width: float,
) -> list[tuple[float, float]]:
    """Generate control points with radial variation."""
    control_points = []
    for i in range(num_points):
        angle = (2 * math.pi * i) / num_points
        variation = random.uniform(-variation_amount, variation_amount)  # noqa: S311  # nosec B311

        if random.random() < hairpin_chance:  # noqa: S311  # nosec B311
            variation *= hairpin_intensity

        r_x = base_radius[0] * (1 + variation)
        r_y = base_radius[1] * (1 + variation)

        r_x = max(padding + track_width, min(width / 2 - padding, r_x))
        r_y = max(padding + track_width, min(width / 2 - padding, r_y))

        x = center[0] + r_x * math.cos(angle)
        y = center[1] + r_y * math.sin(angle)
        control_points.append((x, y))

    return control_points


def _interpolate_centerline(smoothed_points: list[tuple[float, float]]) -> list[tuple[float, float]]:
    """Interpolate centerline points using Catmull-Rom splines."""
    interpolated_centerline = []
    num_control = len(smoothed_points)

    for i in range(num_control):
        p0 = smoothed_points[(i - 1) % num_control]
        p1 = smoothed_points[i]
        p2 = smoothed_points[(i + 1) % num_control]
        p3 = smoothed_points[(i + 2) % num_control]

        for t in range(10):
            t_norm = t / 10
            point = catmull_rom_point(p0, p1, p2, p3, t_norm)
            interpolated_centerline.append(point)

    return interpolated_centerline


def _generate_track_boundaries(
    interpolated_centerline: list[tuple[float, float]], track_width: float
) -> tuple[list[Point2D], list[Point2D]]:
    """Generate inner and outer track boundaries from centerline."""
    all_outer_points = []
    all_inner_points = []
    half_width = track_width / 2

    for i in range(len(interpolated_centerline)):
        current = interpolated_centerline[i]
        next_point = interpolated_centerline[(i + 1) % len(interpolated_centerline)]

        dx = next_point[0] - current[0]
        dy = next_point[1] - current[1]
        length = math.sqrt(dx * dx + dy * dy)

        if length > 0:
            normal_x = -dy / length
            normal_y = dx / length

            outer_x = current[0] + normal_x * half_width
            outer_y = current[1] + normal_y * half_width
            inner_x = current[0] - normal_x * half_width
            inner_y = current[1] - normal_y * half_width

            all_outer_points.append(Point2D(x=outer_x, y=outer_y))
            all_inner_points.append(Point2D(x=inner_x, y=inner_y))
        else:
            all_outer_points.append(Point2D(x=current[0] + half_width, y=current[1]))
            all_inner_points.append(Point2D(x=current[0] - half_width, y=current[1]))

    return all_outer_points, all_inner_points


def generate_procedural_track(
    width: int,
    height: int,
    difficulty: str,
    padding: int = DEFAULT_TRACK_PADDING,
    num_points: int | None = None,
    variation_amount: float | None = None,
    hairpin_chance: float | None = None,
    hairpin_intensity: float | None = None,
    smoothing_passes: int | None = None,
    track_width_override: float | None = None,
) -> TrackBoundary:
    """Generate a windy procedural track using radial variation for guaranteed continuous loop.

    Args:
        width: Canvas width
        height: Canvas height
        difficulty: Track difficulty (easy, medium, hard)
        padding: Padding from canvas edges
        num_points: Number of control points (overrides difficulty default)
        variation_amount: Radius variation (overrides difficulty default)
        hairpin_chance: Probability of extreme curves (default 0.2)
        hairpin_intensity: Multiplier for extreme curves (default 2.5)
        smoothing_passes: Number of smoothing iterations (default 2)
        track_width_override: Override track width

    Returns:
        TrackBoundary with procedurally generated boundaries
    """
    center = (width / 2, height / 2)
    base_radius = ((width - 2 * padding) / 2, (height - 2 * padding) / 2)

    track_width, default_num_points, default_variation = get_difficulty_params(difficulty)

    num_points = num_points if num_points is not None else default_num_points
    variation_amount = variation_amount if variation_amount is not None else default_variation
    hairpin_chance = hairpin_chance if hairpin_chance is not None else 0.2
    hairpin_intensity = hairpin_intensity if hairpin_intensity is not None else 2.5
    smoothing_passes = smoothing_passes if smoothing_passes is not None else 2
    track_width = track_width_override if track_width_override is not None else track_width

    control_points = _generate_control_points_with_variation(
        num_points,
        center,
        base_radius,
        variation_amount,
        hairpin_chance,
        hairpin_intensity,
        width,
        padding,
        track_width,
    )

    smoothed_points = smooth_track_centerline(control_points, smoothing_passes=smoothing_passes)
    interpolated_centerline = _interpolate_centerline(smoothed_points)
    all_outer_points, all_inner_points = _generate_track_boundaries(interpolated_centerline, track_width)

    if len(all_outer_points) < 3 or len(all_inner_points) < 3:
        outer_count = len(all_outer_points)
        inner_count = len(all_inner_points)
        raise ValueError(f"Track generation failed: insufficient points (outer={outer_count}, inner={inner_count})")

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


def _select_track_layout(params: TrackGenerationParams, track_width: float) -> TrackBoundary:
    """Select and generate track based on layout parameter."""
    layout_generators = {
        "figure8": lambda: generate_figure8_track(params.width, params.height, track_width),
        "spa": lambda: generate_spa_inspired_track(params.width, params.height, track_width),
        "monaco": lambda: generate_monaco_style_track(params.width, params.height, track_width),
        "laguna": lambda: generate_laguna_seca_track(params.width, params.height, track_width),
        "suzuka": lambda: generate_suzuka_style_track(params.width, params.height, track_width),
    }

    if params.layout in layout_generators:
        return layout_generators[params.layout]()

    return generate_procedural_track(
        params.width,
        params.height,
        params.difficulty,
        num_points=params.num_points,
        variation_amount=params.variation_amount,
        hairpin_chance=params.hairpin_chance,
        hairpin_intensity=params.hairpin_intensity,
        smoothing_passes=params.smoothing_passes,
        track_width_override=params.track_width_override,
    )


def _get_default_start_position(width: int, height: int) -> Point2D:
    """Get default start position at bottom center."""
    return Point2D(x=width / 2, y=height - 150)


def _find_bottom_boundary_points(
    boundaries: TrackBoundary, center_x: float, bottom_threshold: float
) -> tuple[list[Point2D], list[Point2D]]:
    """Find boundary points near the bottom."""
    inner_bottom = [p for p in boundaries.inner if p.y > bottom_threshold]
    outer_bottom = [p for p in boundaries.outer if p.y > bottom_threshold]
    return inner_bottom, outer_bottom


def _calculate_start_position(boundaries: TrackBoundary, width: int, height: int) -> Point2D:
    """Calculate start position on the centerline of the track near the bottom."""
    if not boundaries.inner or not boundaries.outer:
        return _get_default_start_position(width, height)

    center_x = width / 2
    bottom_threshold = height * 0.7
    inner_bottom, outer_bottom = _find_bottom_boundary_points(boundaries, center_x, bottom_threshold)

    if not inner_bottom or not outer_bottom:
        return _get_default_start_position(width, height)

    inner_closest = min(inner_bottom, key=lambda p: abs(p.x - center_x))
    outer_closest = min(outer_bottom, key=lambda p: abs(p.x - center_x))
    return Point2D(x=(inner_closest.x + outer_closest.x) / 2, y=(inner_closest.y + outer_closest.y) / 2)


@router.post("/track/generate", response_model=SimpleTrack)
async def generate_track(params: TrackGenerationParams) -> SimpleTrack:
    """Generate a procedural track based on parameters.

    Args:
        params: Track generation parameters including difficulty, seed, and layout

    Returns:
        Generated track data with specified layout
    """
    logger.info(
        "Generating track",
        difficulty=params.difficulty,
        seed=params.seed,
        width=params.width,
        height=params.height,
        layout=params.layout,
    )

    if params.seed is not None:
        random.seed(params.seed)

    try:
        track_width, _, _ = get_difficulty_params(params.difficulty)
        boundaries = _select_track_layout(params, track_width)
        start_position = _calculate_start_position(boundaries, params.width, params.height)

        return SimpleTrack(
            width=params.width,
            height=params.height,
            boundaries=boundaries,
            start_position=start_position,
            track_width=track_width,
        )
    except Exception as e:
        logger.exception("Failed to generate track", layout=params.layout)
        raise HTTPException(status_code=HTTP_BAD_REQUEST, detail=f"Failed to generate track: {str(e)}") from e


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint for the racing API.

    Returns:
        Status indicating the API is healthy
    """
    return {"status": "healthy", "service": "racing-api"}
