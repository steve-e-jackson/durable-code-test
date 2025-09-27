# Dedicated Linting Containers

## Overview
This directory contains Docker configurations for dedicated linting containers, separated from application development containers for improved performance and maintainability.

## Architecture

### Python Linting Container (`Dockerfile.python-lint`)
- **Base**: python:3.11-slim
- **Tools**: Poetry + all dev dependencies, shellcheck, TFLint
- **Mount Points**:
  - `/workspace/backend` - Backend application code
  - `/workspace/tools` - Design linters framework
  - `/workspace/test` - Test files
  - `/workspace/infra` - Infrastructure files

### JavaScript Linting Container (`Dockerfile.js-lint`)
- **Base**: node:20-alpine
- **Tools**: HTMLHint, TypeScript, npm dev dependencies
- **Mount Points**:
  - `/workspace/frontend` - Frontend application code

## Usage

### Start Linting Services
```bash
# Start all linting containers
docker-compose -f docker-compose.lint.yml up -d

# Check container status
docker ps | grep linter
```

### Run Linting Commands
```bash
# Python linting
docker exec durable-code-python-linter-main bash -c "cd /workspace && poetry run ruff check backend"

# JavaScript linting
docker exec durable-code-js-linter-main sh -c "cd /workspace/frontend && npm run lint"
```

### Stop Linting Services
```bash
# Stop and remove containers
docker-compose -f docker-compose.lint.yml down
```

## Benefits

### Performance
- Faster development container startup (no linting tools)
- Parallel linting execution capability
- Better resource allocation per linting type

### Maintenance
- Independent tool updates
- Isolated linting failures
- Clear separation of concerns

### Security
- Reduced production container attack surface
- Read-only source code access
- Non-root user execution

## Integration with Make Targets
These containers are designed to be used by existing `make lint-*` targets with no change to developer workflow.