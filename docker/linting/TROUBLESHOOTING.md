# Docker Linting Containers - Troubleshooting Guide

## Quick Diagnostics

```bash
# Run this first for quick status check
make lint-containers-status

# If containers aren't running
docker-compose -f docker-compose.lint.yml ps

# Check for error logs
docker-compose -f docker-compose.lint.yml logs --tail=50
```

## Common Issues and Solutions

### 1. Container Won't Start

#### Symptoms
- `docker-compose up` fails
- Containers exit immediately
- Error: "container name already in use"

#### Solutions

**Check for existing containers:**
```bash
# List all containers (including stopped)
docker ps -a | grep linter

# Remove old containers
docker rm durable-code-python-linter-main durable-code-js-linter-main

# Try starting again
docker-compose -f docker-compose.lint.yml up -d
```

**Check build issues:**
```bash
# Rebuild containers from scratch
docker-compose -f docker-compose.lint.yml build --no-cache

# Check build logs for errors
docker-compose -f docker-compose.lint.yml build --progress=plain
```

**Verify Docker resources:**
```bash
# Check Docker daemon status
docker system info

# Check available disk space
df -h /var/lib/docker

# Clean up if needed
docker system prune -a --volumes
```

### 2. Volume Mount Issues

#### Symptoms
- "No such file or directory" errors
- Linting can't find source files
- Permission denied errors

#### Solutions

**Verify mount points:**
```bash
# Check Python container mounts
docker exec durable-code-python-linter-main ls -la /workspace/
# Should show: backend/, tools/, test/, infra/, root/

# Check JS container mounts
docker exec durable-code-js-linter-main ls -la /workspace/
# Should show: frontend/, root/

# If empty, restart containers
docker-compose -f docker-compose.lint.yml down
docker-compose -f docker-compose.lint.yml up -d
```

**Fix permission issues:**
```bash
# Check file ownership
ls -la durable-code-app/backend/

# If permission issues, fix locally
chmod -R 755 durable-code-app/
chmod -R 755 tools/

# Or run linting as root (temporary fix)
docker exec -u root durable-code-python-linter-main bash -c "cd /workspace && poetry run black --check backend"
```

**Verify source files exist:**
```bash
# Ensure you're in project root
pwd  # Should show: /home/stevejackson/Projects/durable-code-test

# Check source directories exist
ls -la durable-code-app/backend/
ls -la durable-code-app/frontend/
ls -la tools/
```

### 3. Linting Tools Not Found

#### Symptoms
- "command not found" errors
- "No module named" Python errors
- "Cannot find module" JavaScript errors

#### Solutions

**Python tools missing:**
```bash
# Check Poetry installation
docker exec durable-code-python-linter-main poetry --version

# List installed packages
docker exec durable-code-python-linter-main poetry show

# Reinstall if needed
docker exec durable-code-python-linter-main bash -c "poetry install --only dev"

# Verify specific tool
docker exec durable-code-python-linter-main which black
docker exec durable-code-python-linter-main which ruff
```

**JavaScript tools missing:**
```bash
# Check npm packages
docker exec durable-code-js-linter-main npm list --depth=0

# Reinstall if needed
docker exec durable-code-js-linter-main npm install

# Verify specific tool
docker exec durable-code-js-linter-main which eslint
docker exec durable-code-js-linter-main which htmlhint
```

**System tools missing:**
```bash
# Check shellcheck (Python container)
docker exec durable-code-python-linter-main which shellcheck

# Check TFLint (Python container)
docker exec durable-code-python-linter-main which tflint

# Rebuild container if tools missing
docker-compose -f docker-compose.lint.yml build python-linter --no-cache
```

### 4. Performance Issues

#### Symptoms
- Linting takes longer than expected
- Container using excessive resources
- System becomes unresponsive

#### Solutions

**Check resource usage:**
```bash
# Monitor in real-time
docker stats | grep linter

# Check container limits
docker inspect durable-code-python-linter-main | grep -A 5 "Resources"
```

**Optimize performance:**
```bash
# Stop other containers to free resources
docker ps --format "table {{.Names}}\t{{.Status}}"
make dev-stop  # If dev environment not needed

# Run linters sequentially instead of parallel
make lint-python
make lint-js
make lint-design
```

**Adjust resource limits:**
Edit `docker-compose.lint.yml`:
```yaml
services:
  python-linter:
    deploy:
      resources:
        limits:
          cpus: '2.0'  # Increase from 1.0
          memory: 2G    # Increase from 1G
```

### 5. Make Target Failures

#### Symptoms
- `make lint-all` fails
- `make lint-fix` doesn't work
- Error: "make: *** [target] Error"

#### Solutions

**Debug Make execution:**
```bash
# Run with verbose output
make lint-all VERBOSE=1

# Check which part fails
make lint-python
make lint-js
make lint-design

# Run Make target with shell debugging
make lint-all SHELL="sh -x"
```

**Check container names:**
```bash
# Verify branch name variable
echo $BRANCH_NAME
git branch --show-current

# Check container naming
docker ps --format "table {{.Names}}" | grep linter
```

**Fix Make target issues:**
```bash
# Ensure containers are running
make lint-containers-start

# Check Make variables
make print-BRANCH_NAME
make print-DOCKER_COMPOSE
```

### 6. Network Connectivity Issues

#### Symptoms
- Container can't download dependencies
- "Network unreachable" errors
- DNS resolution failures

#### Solutions

**Check network configuration:**
```bash
# List Docker networks
docker network ls

# Inspect linting network
docker network inspect durable-code-test_linting-network

# Test connectivity
docker exec durable-code-python-linter-main ping -c 1 google.com
docker exec durable-code-python-linter-main nslookup google.com
```

**Fix network issues:**
```bash
# Recreate network
docker-compose -f docker-compose.lint.yml down
docker network prune -f
docker-compose -f docker-compose.lint.yml up -d

# Use host network (temporary)
docker run --rm --network host -v $(pwd):/workspace python:3.11-slim bash -c "cd /workspace && pip install black && black --check backend"
```

### 7. Cache and State Issues

#### Symptoms
- Old linting results shown
- Changes not detected
- Stale cache errors

#### Solutions

**Clear caches:**
```bash
# Clear MyPy cache
docker exec durable-code-python-linter-main rm -rf /tmp/mypy_cache

# Clear Ruff cache
docker exec durable-code-python-linter-main rm -rf /workspace/backend/.ruff_cache

# Clear npm cache
docker exec durable-code-js-linter-main npm cache clean --force
```

**Reset container state:**
```bash
# Full reset
docker-compose -f docker-compose.lint.yml down
docker-compose -f docker-compose.lint.yml up -d --force-recreate
```

### 8. Git Hook Failures

#### Symptoms
- Pre-commit hooks fail
- "Container not found" during commit
- Hooks timeout

#### Solutions

**Check hook configuration:**
```bash
# View current hooks
cat .pre-commit-config.yaml | grep -A 10 "repo: local"

# Test hooks manually
pre-commit run --all-files --verbose

# Run specific hook
pre-commit run black --all-files
```

**Fix container startup in hooks:**
```bash
# Ensure containers start before hooks
make lint-containers-start

# Keep containers running
# Edit .pre-commit-config.yaml to not stop containers
```

## Advanced Debugging

### Enable Debug Logging

**Python container:**
```bash
# Run with debug output
docker exec durable-code-python-linter-main bash -c "PYTHONPATH=/workspace/tools python -m design_linters --verbose --debug backend"
```

**JavaScript container:**
```bash
# Run with debug output
docker exec durable-code-js-linter-main sh -c "cd /workspace/frontend && DEBUG=* npm run lint"
```

### Container Shell Access

**Interactive debugging:**
```bash
# Python container
docker exec -it durable-code-python-linter-main bash

# JS container
docker exec -it durable-code-js-linter-main sh
```

### Check Container Build Context

```bash
# View Dockerfile used
cat docker/linting/Dockerfile.python-lint
cat docker/linting/Dockerfile.js-lint

# Check build arguments
docker-compose -f docker-compose.lint.yml config
```

## Performance Optimization

### Parallel Execution
```bash
# Run linters in parallel (default)
make -j3 lint-python lint-js lint-design

# Run sequentially if resources limited
make lint-python && make lint-js && make lint-design
```

### Container Prewarming
```bash
# Start containers at beginning of work session
make lint-containers-start

# They stay running for faster subsequent linting
# Stop at end of session
make lint-containers-stop
```

### Selective Linting
```bash
# Lint only changed files
git diff --name-only | grep "\.py$" | xargs docker exec durable-code-python-linter-main poetry run black --check

# Lint specific directory
docker exec durable-code-python-linter-main poetry run ruff check backend/app
```

## Maintenance Tasks

### Update Linting Tools

**Python tools:**
```bash
# Update in container
docker exec durable-code-python-linter-main poetry update

# Or rebuild with latest
docker-compose -f docker-compose.lint.yml build python-linter --no-cache
```

**JavaScript tools:**
```bash
# Update in container
docker exec durable-code-js-linter-main npm update

# Or rebuild with latest
docker-compose -f docker-compose.lint.yml build js-linter --no-cache
```

### Container Cleanup

```bash
# Remove stopped containers
docker container prune -f

# Remove unused images
docker image prune -f

# Full cleanup (careful!)
docker system prune -a --volumes

# Remove only linting containers
docker-compose -f docker-compose.lint.yml down --rmi all --volumes
```

## Getting Help

### Diagnostic Information to Collect

When reporting issues, include:

```bash
# System info
uname -a
docker --version
docker-compose --version

# Container status
docker ps -a | grep linter
docker-compose -f docker-compose.lint.yml ps

# Recent logs
docker-compose -f docker-compose.lint.yml logs --tail=100

# Resource usage
docker system df
docker stats --no-stream | grep linter

# Git status
git status
git branch --show-current
```

### Quick Fix Attempts

Before reporting issues, try:

1. **Restart containers:**
   ```bash
   make lint-containers-stop
   make lint-containers-start
   ```

2. **Rebuild containers:**
   ```bash
   docker-compose -f docker-compose.lint.yml build --no-cache
   ```

3. **Clean environment:**
   ```bash
   docker system prune -f
   make init
   ```

4. **Check documentation:**
   - [README.md](./README.md) - Architecture overview
   - [ROLLBACK.md](./ROLLBACK.md) - Rollback procedures
   - `.ai/howto/run-linting.md` - Usage guide

### Support Channels

1. Check this troubleshooting guide
2. Review GitHub issues for similar problems
3. Create detailed issue with diagnostic information
4. Tag maintainers for urgent production issues

## Prevention Best Practices

### Regular Maintenance
- Update containers monthly
- Clean Docker cache weekly
- Monitor disk space
- Review container logs for warnings

### Development Workflow
- Start containers at session begin
- Keep containers running during work
- Use Make targets consistently
- Report issues early

### Team Coordination
- Document custom configurations
- Share troubleshooting solutions
- Update this guide with new issues
- Communicate before major updates