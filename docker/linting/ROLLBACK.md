# Rollback Procedures for Docker Linting Separation

## Overview
If issues are discovered with the dedicated linting containers, this document provides steps to quickly revert to the previous architecture where linting tools were included in development containers.

## Emergency Rollback

### Step 1: Revert Makefile.lint
```bash
# Revert to previous version of Makefile.lint
git checkout main -- Makefile.lint
```

### Step 2: Revert GitHub Actions
```bash
# Revert GitHub Actions workflow
git checkout main -- .github/workflows/lint.yml
```

### Step 3: Restore Development Container Linting Tools

#### Backend Container
```bash
# Restore backend Dockerfile.dev from backup
cp durable-code-app/backend/Dockerfile.dev.backup durable-code-app/backend/Dockerfile.dev

# Or manually restore by reverting PR #48
git checkout e289ecd~1 -- durable-code-app/backend/Dockerfile.dev
```

#### Frontend Container
```bash
# Restore frontend Dockerfile.dev from backup
cp durable-code-app/frontend/Dockerfile.dev.backup durable-code-app/frontend/Dockerfile.dev

# Or manually restore by reverting PR #48
git checkout e289ecd~1 -- durable-code-app/frontend/Dockerfile.dev
```

### Step 4: Revert Pre-commit Hooks
```bash
# Restore original pre-commit configuration
git checkout main -- .pre-commit-config.yaml
```

### Step 5: Rebuild Development Containers
```bash
# Stop current environment
make dev-stop

# Clean Docker artifacts
docker system prune -f

# Remove linting containers
docker-compose -f docker-compose.lint.yml down --rmi all

# Rebuild with restored configuration
make init
```

### Step 6: Test Rollback
```bash
# Verify linting works with development containers
make lint-all

# Verify development environment works
make dev

# Test pre-commit hooks
pre-commit run --all-files
```

## Partial Rollback Options

### Option 1: Keep Containers, Revert Makefile
If dedicated containers work but Make integration has issues:

```bash
# Revert only Makefile.lint
git checkout main -- Makefile.lint

# Keep dedicated containers for future fixing
# Containers can still be used manually
```

### Option 2: Keep Makefile, Revert CI/CD
If local development works but CI has issues:

```bash
# Revert only GitHub Actions
git checkout main -- .github/workflows/lint.yml

# Keep local improvements
# Fix CI separately
```

### Option 3: Revert Specific Container
If only one container has issues:

```bash
# For Python container issues, revert backend changes
git checkout e289ecd~1 -- durable-code-app/backend/Dockerfile.dev
git checkout main -- Makefile.lint  # Update relevant sections

# For JS container issues, revert frontend changes
git checkout e289ecd~1 -- durable-code-app/frontend/Dockerfile.dev
git checkout main -- Makefile.lint  # Update relevant sections
```

## Common Rollback Triggers

### Performance Regression
- Container startup slower than expected
- Linting execution significantly slower
- Resource consumption excessive

### Developer Workflow Disruption
- Make targets not working as expected
- Container management issues
- Volume mount problems

### CI/CD Pipeline Failures
- GitHub Actions failing consistently
- Docker cache issues in CI
- Build timeouts

### Container Reliability Issues
- Containers crashing frequently
- Network connectivity problems
- Tool installation failures

### Resource Consumption Problems
- Memory usage excessive
- CPU usage too high
- Disk space issues

## Quick Diagnostics Before Rollback

### Check Container Status
```bash
# View running containers
docker ps | grep linter

# Check container logs
docker-compose -f docker-compose.lint.yml logs

# Check resource usage
docker stats | grep linter
```

### Verify Volume Mounts
```bash
# Python container
docker exec durable-code-python-linter-main ls -la /workspace/

# JS container
docker exec durable-code-js-linter-main ls -la /workspace/frontend/
```

### Test Linting Tools
```bash
# Test Python tools
docker exec durable-code-python-linter-main which black

# Test JS tools
docker exec durable-code-js-linter-main which eslint
```

## Post-Rollback Actions

### 1. Document Issues
Create a detailed issue report including:
- What triggered the rollback
- Specific error messages
- System configuration
- Docker version
- Resource constraints

### 2. Create GitHub Issue
```bash
# Template for issue
Title: Docker Linting Separation Rollback - [Brief Description]

## Environment
- OS: [Your OS]
- Docker version: $(docker --version)
- Docker Compose version: $(docker-compose --version)
- Branch: $(git branch --show-current)

## Issue Description
[What happened]

## Error Messages
[Paste relevant error output]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
...

## Attempted Solutions
[What you tried]

## Rollback Method Used
[Which rollback option you chose]
```

### 3. Plan Fixes
- Analyze root cause
- Develop fix strategy
- Test in isolated environment
- Schedule retry with fixes

### 4. Update Documentation
- Document lessons learned
- Update troubleshooting guide
- Add to known issues if applicable

## Recovery After Fix

### Re-apply Changes
```bash
# Create new branch for retry
git checkout -b feature/docker-linting-separation-retry

# Re-apply changes with fixes
# Follow original implementation but with corrections

# Test thoroughly before merging
make lint-all
make dev
```

### Gradual Rollout
Consider phased approach:
1. Test with single developer first
2. Expand to small team
3. Deploy to CI/CD
4. Full team adoption

## Rollback Verification Checklist

- [ ] Development containers rebuild successfully
- [ ] `make dev` starts without errors
- [ ] `make lint-all` executes correctly
- [ ] `make lint-fix` works as expected
- [ ] `make lint-custom` runs design linters
- [ ] Pre-commit hooks function properly
- [ ] CI/CD pipeline passes
- [ ] No performance regression
- [ ] Developer workflow unchanged
- [ ] All linting tools available

## Prevention Strategies

### Before Future Changes
1. **Test in isolation**: Use feature branch extensively
2. **Measure performance**: Document baseline metrics
3. **Gradual migration**: Implement in smaller phases
4. **Backup strategy**: Always create backups before changes
5. **Communication**: Notify team before major changes

### Monitoring
- Set up container health checks
- Monitor resource usage trends
- Track linting execution times
- Log container startup times

## Support Contacts

For assistance with rollback:
1. Check this documentation first
2. Review troubleshooting guide
3. Create GitHub issue with diagnostics
4. Tag maintainers for urgent issues

## Related Documents
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions
- [README.md](./README.md) - Architecture overview
- [PROGRESS_TRACKER.md](../../roadmap/in_progress/docker-linting-separation/PROGRESS_TRACKER.md) - Implementation history