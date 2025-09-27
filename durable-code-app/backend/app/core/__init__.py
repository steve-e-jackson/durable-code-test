"""
Purpose: Core module package initialization with centralized exception exports.

Scope: Core functionality package for backend application infrastructure components

Overview: Initializes the core package containing essential infrastructure components for
    the backend application including exception hierarchy, retry mechanisms, and circuit
    breaker patterns. Provides centralized exports for exception classes to ensure
    consistent error handling across the application. Organizes core utility functions
    and patterns that support the application's reliability and maintainability.

Dependencies: Core module implementations (exceptions, retry, circuit_breaker)

Exports: Exception classes and core utility functions for application-wide use

Implementation: Package initialization with explicit exports and dependency management
"""

from .exceptions import (
    AppExceptionError,
    AuthenticationError,
    AuthorizationError,
    ConfigurationError,
    ExternalServiceError,
    RateLimitExceededError,
    ResourceNotFoundError,
    ServiceError,
    ValidationError,
    WebSocketError,
)

__all__ = [
    "AppExceptionError",
    "AuthenticationError",
    "AuthorizationError",
    "ConfigurationError",
    "ExternalServiceError",
    "RateLimitExceededError",
    "ResourceNotFoundError",
    "ServiceError",
    "ValidationError",
    "WebSocketError",
]
