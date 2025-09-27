"""
Purpose: Main application package initialization for the durable code backend service.

Scope: Application-level exports and package initialization for the FastAPI backend
Overview: This module serves as the main entry point for the backend application package,
    providing centralized imports and initialization for the durable code demonstration
    system. It acts as the primary interface for the FastAPI application, consolidating
    core modules including security, exception handling, and API endpoints. The package
    structure follows clean architecture principles with clear separation between core
    business logic, security components, and external interfaces like the oscilloscope
    WebSocket API. This initialization ensures proper module loading order and provides
    a clean import interface for external consumers of the backend package.
Dependencies: FastAPI framework, custom core modules for exceptions and security
Exports: Application package namespace and core component access
Interfaces: Package-level imports for main application components
Implementation: Standard Python package initialization with centralized component access
"""
