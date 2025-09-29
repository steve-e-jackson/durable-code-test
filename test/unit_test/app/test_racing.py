"""Unit tests for racing game API endpoints.

Purpose: Test racing API functionality including track generation and validation
Scope: Racing API endpoints, track generation, parameter validation
Overview: Comprehensive test suite for the racing game backend API
Dependencies: pytest, FastAPI test client, racing module
Exports: Test functions for racing API
Implementation: Unit tests with API client testing
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.racing import (
    DEFAULT_TRACK_HEIGHT,
    DEFAULT_TRACK_WIDTH,
    MAX_TRACK_HEIGHT,
    MAX_TRACK_WIDTH,
    MIN_TRACK_HEIGHT,
    MIN_TRACK_WIDTH,
    generate_oval_track,
)

client = TestClient(app)


class TestRacingAPI:
    """Test suite for racing API endpoints."""

    def test_health_endpoint(self):
        """Test the racing API health check endpoint."""
        response = client.get("/api/racing/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "racing-api"

    def test_simple_track_default_parameters(self):
        """Test simple track generation with default parameters."""
        response = client.get("/api/racing/track/simple")
        assert response.status_code == 200

        data = response.json()
        assert data["width"] == DEFAULT_TRACK_WIDTH
        assert data["height"] == DEFAULT_TRACK_HEIGHT
        assert data["track_width"] == 60

        # Check boundaries structure
        assert "boundaries" in data
        assert "inner" in data["boundaries"]
        assert "outer" in data["boundaries"]
        assert isinstance(data["boundaries"]["inner"], list)
        assert isinstance(data["boundaries"]["outer"], list)

        # Check start position
        assert "start_position" in data
        assert "x" in data["start_position"]
        assert "y" in data["start_position"]

    def test_simple_track_custom_dimensions(self):
        """Test simple track generation with custom dimensions."""
        width = 1000
        height = 800

        response = client.get(f"/api/racing/track/simple?width={width}&height={height}")
        assert response.status_code == 200

        data = response.json()
        assert data["width"] == width
        assert data["height"] == height

    def test_simple_track_invalid_dimensions(self):
        """Test simple track generation with invalid dimensions."""
        # Test width too small
        response = client.get(f"/api/racing/track/simple?width={MIN_TRACK_WIDTH - 1}")
        assert response.status_code == 422

        # Test width too large
        response = client.get(f"/api/racing/track/simple?width={MAX_TRACK_WIDTH + 1}")
        assert response.status_code == 422

        # Test height too small
        response = client.get(f"/api/racing/track/simple?height={MIN_TRACK_HEIGHT - 1}")
        assert response.status_code == 422

        # Test height too large
        response = client.get(f"/api/racing/track/simple?height={MAX_TRACK_HEIGHT + 1}")
        assert response.status_code == 422

    def test_track_generation_endpoint(self):
        """Test procedural track generation endpoint."""
        payload = {
            "difficulty": "medium",
            "seed": 12345,
            "width": 800,
            "height": 600
        }

        response = client.post("/api/racing/track/generate", json=payload)
        assert response.status_code == 200

        data = response.json()
        assert data["width"] == 800
        assert data["height"] == 600
        assert data["track_width"] == 50  # Medium difficulty

    def test_track_generation_different_difficulties(self):
        """Test track generation with different difficulty levels."""
        difficulties = {
            "easy": 60,
            "medium": 50,
            "hard": 40
        }

        for difficulty, expected_width in difficulties.items():
            payload = {
                "difficulty": difficulty,
                "width": 800,
                "height": 600
            }

            response = client.post("/api/racing/track/generate", json=payload)
            assert response.status_code == 200

            data = response.json()
            assert data["track_width"] == expected_width

    def test_track_generation_invalid_difficulty(self):
        """Test track generation with invalid difficulty."""
        payload = {
            "difficulty": "impossible",
            "width": 800,
            "height": 600
        }

        response = client.post("/api/racing/track/generate", json=payload)
        assert response.status_code == 422

    def test_track_generation_with_seed_reproducibility(self):
        """Test that same seed produces same track."""
        payload = {
            "difficulty": "medium",
            "seed": 12345,
            "width": 800,
            "height": 600
        }

        # Generate track twice with same seed
        response1 = client.post("/api/racing/track/generate", json=payload)
        response2 = client.post("/api/racing/track/generate", json=payload)

        assert response1.status_code == 200
        assert response2.status_code == 200

        data1 = response1.json()
        data2 = response2.json()

        # Results should be identical
        assert data1["width"] == data2["width"]
        assert data1["height"] == data2["height"]
        assert data1["track_width"] == data2["track_width"]


class TestTrackGeneration:
    """Test suite for track generation utility functions."""

    def test_generate_oval_track_basic(self):
        """Test basic oval track generation."""
        track = generate_oval_track(800, 600)

        assert len(track.inner) == 32  # Should have 32 points
        assert len(track.outer) == 32

        # All points should be valid
        for point in track.inner + track.outer:
            assert point.x >= 0
            assert point.y >= 0
            assert point.x <= 800
            assert point.y <= 600

    def test_generate_oval_track_different_sizes(self):
        """Test oval track generation with different canvas sizes."""
        sizes = [(400, 300), (1200, 800), (600, 400)]

        for width, height in sizes:
            track = generate_oval_track(width, height)

            # Check that all points are within bounds
            for point in track.inner + track.outer:
                assert 0 <= point.x <= width
                assert 0 <= point.y <= height

    def test_generate_oval_track_with_padding(self):
        """Test oval track generation with custom padding."""
        padding = 100
        track = generate_oval_track(800, 600, padding)

        # With more padding, track should be smaller
        # Check that points respect padding
        for point in track.outer:
            assert point.x >= padding
            assert point.x <= 800 - padding
            assert point.y >= padding
            assert point.y <= 600 - padding

    def test_track_boundaries_are_distinct(self):
        """Test that inner and outer boundaries are different."""
        track = generate_oval_track(800, 600)

        # Inner track should be smaller than outer track
        # Calculate average distance from center for both tracks
        center_x = 400
        center_y = 300

        avg_outer_distance = sum(
            ((p.x - center_x) ** 2 + (p.y - center_y) ** 2) ** 0.5
            for p in track.outer
        ) / len(track.outer)

        avg_inner_distance = sum(
            ((p.x - center_x) ** 2 + (p.y - center_y) ** 2) ** 0.5
            for p in track.inner
        ) / len(track.inner)

        assert avg_inner_distance < avg_outer_distance


class TestAPIValidation:
    """Test suite for API parameter validation."""

    def test_valid_query_parameters(self):
        """Test that valid query parameters are accepted."""
        valid_params = [
            {"width": 800, "height": 600},
            {"width": MIN_TRACK_WIDTH, "height": MIN_TRACK_HEIGHT},
            {"width": MAX_TRACK_WIDTH, "height": MAX_TRACK_HEIGHT},
        ]

        for params in valid_params:
            response = client.get("/api/racing/track/simple", params=params)
            assert response.status_code == 200

    def test_boundary_values(self):
        """Test boundary values for validation."""
        # Test minimum values
        response = client.get(
            f"/api/racing/track/simple?width={MIN_TRACK_WIDTH}&height={MIN_TRACK_HEIGHT}"
        )
        assert response.status_code == 200

        # Test maximum values
        response = client.get(
            f"/api/racing/track/simple?width={MAX_TRACK_WIDTH}&height={MAX_TRACK_HEIGHT}"
        )
        assert response.status_code == 200

    def test_track_generation_seed_validation(self):
        """Test seed validation in track generation."""
        # Valid seed
        payload = {"difficulty": "medium", "seed": 123456}
        response = client.post("/api/racing/track/generate", json=payload)
        assert response.status_code == 200

        # Invalid seed (too large)
        payload = {"difficulty": "medium", "seed": 9999999}
        response = client.post("/api/racing/track/generate", json=payload)
        assert response.status_code == 422

        # Invalid seed (negative)
        payload = {"difficulty": "medium", "seed": -1}
        response = client.post("/api/racing/track/generate", json=payload)
        assert response.status_code == 422


class TestErrorHandling:
    """Test suite for error handling in racing API."""

    def test_nonexistent_endpoint(self):
        """Test that nonexistent endpoints return 404."""
        response = client.get("/api/racing/nonexistent")
        assert response.status_code == 404

    def test_invalid_http_method(self):
        """Test invalid HTTP methods on endpoints."""
        # Simple track endpoint should only accept GET
        response = client.post("/api/racing/track/simple")
        assert response.status_code == 405

        # Generate endpoint should only accept POST
        response = client.get("/api/racing/track/generate")
        assert response.status_code == 405

    def test_malformed_json_payload(self):
        """Test handling of malformed JSON in track generation."""
        response = client.post(
            "/api/racing/track/generate",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422