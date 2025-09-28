# Purpose: Multi-stage Docker build configuration for Python FastAPI backend service
# Scope: Backend containerization for development, testing, and production environments
# Overview: Implements secure multi-stage Docker build with Poetry dependency management,
#     non-root user execution, health checks, and optimized layer caching. The builder stage
#     installs dependencies using Poetry while the production stage copies only necessary
#     packages and application code. Includes security hardening with non-root user,
#     comprehensive health checks, and efficient layer structure for CI/CD optimization.
# Dependencies: Python 3.11, Poetry package manager, FastAPI application structure
# Exports: Containerized backend service exposing port 8000 with health monitoring
# Interfaces: HTTP health endpoint, uvicorn ASGI server, and container orchestration APIs
# Environment: Multi-stage build supporting development and production deployment scenarios
# Related: docker-compose configuration, FastAPI application, and deployment documentation
# Implementation: Multi-stage build pattern with security best practices and health monitoring

# Multi-stage build for Python backend
FROM python:3.11-slim as builder

# Set working directory
WORKDIR /app

# Install Poetry
RUN pip install poetry==1.7.1

# Copy dependency files
COPY pyproject.toml poetry.lock* ./

# Configure poetry to not create virtual environment and install dependencies
RUN poetry config virtualenvs.create false && \
    poetry install --no-dev --no-interaction --no-ansi

# Production stage
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy Python packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
